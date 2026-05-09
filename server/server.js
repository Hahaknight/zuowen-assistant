const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 文件上传配置 - 存储到临时目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// MiniMax API 配置
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_HOST = process.env.MINIMAX_API_HOST || 'https://api.minimaxi.com';

// 依赖检查
function checkDependencies() {
  const deps = ['uvx'];
  for (const dep of deps) {
    try {
      require('child_process').execSync(`which ${dep}`, { stdio: 'ignore' });
    } catch (e) {
      console.warn(`警告: ${dep} 未安装，图片理解功能可能不可用`);
    }
  }
}

// 首页
app.get('/', (req, res) => {
  res.json({
    name: '作文批改助手后端服务',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      understandImage: 'POST /api/understand-image',
      gradeEssay: 'POST /api/grade-essay'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 图片理解接口
app.post('/api/understand-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    const imageFile = req.file;

    // 使用上传的文件或 base64 图片
    let imagePath;
    let isBase64 = false;

    if (imageFile) {
      imagePath = imageFile.path;
    } else if (req.body.imageBase64) {
      // 处理 base64 图片
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      imagePath = path.join(uploadDir, `temp-${Date.now()}.png`);
      fs.writeFileSync(imagePath, imageBuffer);
      isBase64 = true;
    } else {
      return res.status(400).json({ error: '需要提供图片文件或 base64 数据' });
    }

    // 优先使用请求中的 API Key，否则使用环境变量
    const effectiveApiKey = apiKey || MINIMAX_API_KEY;
    if (!effectiveApiKey) {
      return res.status(400).json({ error: '缺少 API Key' });
    }

    console.log(`图片理解请求: ${imagePath}`);

    // 调用 MiniMax MCP understand_image 工具
    const result = await callUnderstandImage(effectiveApiKey, prompt || '请描述这张图片中的作文内容，包括标题和正文', imagePath);

    // 清理临时文件
    if (isBase64 || !req.file) {
      try { fs.unlinkSync(imagePath); } catch (e) {}
    }

    res.json(result);
  } catch (error) {
    console.error('图片理解错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 文本评分接口（备用）
app.post('/api/grade-essay', async (req, res) => {
  try {
    const { essay, rules, apiKey } = req.body;

    if (!essay || !rules) {
      return res.status(400).json({ error: '缺少作文内容或评分规则' });
    }

    const effectiveApiKey = apiKey || MINIMAX_API_KEY;
    if (!effectiveApiKey) {
      return res.status(400).json({ error: '缺少 API Key' });
    }

    const result = await callGradeEssay(effectiveApiKey, rules, essay);
    res.json(result);
  } catch (error) {
    console.error('评分错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 调用 MiniMax MCP understand_image 工具
function callUnderstandImage(apiKey, prompt, imagePath) {
  return new Promise((resolve, reject) => {
    // 方法1: 直接调用 MiniMax HTTP API (如果有的话)
    // 这个 API 可能存在但文档未列出

    // 方法2: 使用 uvx 调用 MCP 工具
    // 注意：这需要 minimax-coding-plan-mcp 已安装
    const args = [
      'minimax-coding-plan-mcp',
      '-y'
    ];

    const env = {
      ...process.env,
      MINIMAX_API_KEY: apiKey,
      MINIMAX_API_HOST: MINIMAX_API_HOST
    };

    // 尝试通过 MCP 协议通信
    // 但 MCP 工具通常是本地运行的，不太适合直接 HTTP 调用

    // 实际上，更好的方式是：
    // MiniMax 可能有一个直接的 HTTP API 来做图片理解
    // 让我们尝试直接调用 MiniMax 的 vision API

    // 由于不确定 MiniMax 是否有直接的 vision API
    // 这里先用 OpenAI兼容的方式尝试
    callMiniMaxVisionAPI(apiKey, prompt, imagePath)
      .then(resolve)
      .catch(() => {
        // 如果失败，尝试 MCP 方式
        callMCPUnderstandImage(env, prompt, imagePath)
          .then(resolve)
          .catch(reject);
      });
  });
}

// 尝试调用 MiniMax 的 Vision API (通过 OpenAI 兼容接口)
async function callMiniMaxVisionAPI(apiKey, prompt, imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');

  // 尝试使用 MiniMax 的 OpenAI 兼容接口
  // MiniMax 可能支持 vision
  const response = await fetch(`${MINIMAX_API_HOST}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vision API 错误: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return {
    success: true,
    description: data.choices?.[0]?.message?.content || '',
    usage: data.usage
  };
}

// 通过 MCP 工具调用
async function callMCPUnderstandImage(env, prompt, imagePath) {
  return new Promise((resolve, reject) => {
    // 使用 Node.js 的 child_process 调用 uvx MCP 工具
    // 这需要 MCP 服务器支持 stdio 通信

    const mcpArgs = [
      'minimax-coding-plan-mcp',
      '-y'
    ];

    // 构造 MCP 请求
    // JSON-RPC 格式
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'understand_image',
        arguments: {
          prompt: prompt,
          image_url: imagePath
        }
      }
    };

    const proc = spawn('uvx', mcpArgs, {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // 尝试解析 MCP 响应
      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.startsWith('{')) {
            const response = JSON.parse(line);
            if (response.result) {
              proc.kill();
              resolve({
                success: true,
                description: typeof response.result === 'string' ? response.result : JSON.stringify(response.result)
              });
            }
          }
        }
      } catch (e) {
        // 继续收集输出
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(`MCP 工具调用失败: ${stderr}`));
      }
    });

    // 发送 MCP 请求
    proc.stdin.write(JSON.stringify(mcpRequest) + '\n');
    proc.stdin.end();

    // 超时处理
    setTimeout(() => {
      proc.kill();
      reject(new Error('MCP 工具调用超时'));
    }, 30000);
  });
}

// 调用 MiniMax 文本评分 API
async function callGradeEssay(apiKey, rules, essay) {
  const response = await fetch(`${MINIMAX_API_HOST}/anthropic/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: 1024,
      system: `你是一位专业的语文老师，擅长根据评分规则对作文进行批改和评分。
请根据用户提供的评分规则，对作文进行评分，并返回 JSON 格式的结果。`,
      messages: [{
        role: 'user',
        content: `请根据以下评分规则对作文进行评分：

评分规则：
${rules}

作文内容：
${essay}

请以 JSON 格式返回评分结果：
{
  "score": 数字分数(1-50),
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "summary": "总体评价"
}`
      }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${err}`);
  }

  const data = await response.json();

  // MiniMax 的 content 是数组，每个元素有 type 和对应的内容
  // 找到 type="text" 的块
  let text = '';
  if (data.content && Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === 'text') {
        text = block.text || '';
        break;
      }
    }
  }

  if (!text) {
    throw new Error('API 返回内容为空');
  }

  // 解析 JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析评分结果');
  } catch (e) {
    throw new Error('评分结果格式错误: ' + e.message);
  }
}

// 启动服务器
checkDependencies();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         作文批改助手后端服务已启动                          ║
║                                                           ║
║  服务地址: http://localhost:${PORT}                           ║
║                                                           ║
║  接口:                                                    ║
║  - GET  /health                   健康检查                 ║
║  - POST /api/understand-image     图片理解                 ║
║  - POST /api/grade-essay          作文评分                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
