// 作文批改助手 - Popup 逻辑

let currentMode = 'exam';
let extractedEssay = '';
let gradingResult = null;

// DOM 元素
const modeButtons = document.querySelectorAll('.mode-btn');
const examSection = document.getElementById('examSection');
const dailySection = document.getElementById('dailySection');
const resultSection = document.getElementById('resultSection');
const apiKeyInput = document.getElementById('apiKey');
const rulesTextarea = document.getElementById('rules');
const extractBtn = document.getElementById('extractBtn');
const autoGradeBtn = document.getElementById('autoGradeBtn');
const gradeImageBtn = document.getElementById('gradeImageBtn');
const examStatus = document.getElementById('examStatus');
const dailyStatus = document.getElementById('dailyStatus');
const essayContent = document.getElementById('essayContent');
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const previewImage = document.getElementById('previewImage');
const totalScoreEl = document.getElementById('totalScore');
const resultDetails = document.getElementById('resultDetails');
const essaySelectorInput = document.getElementById('essaySelector');
const scoreSelectorInput = document.getElementById('scoreSelector');
const saveSelectorsBtn = document.getElementById('saveSelectorsBtn');
const backendUrlInput = document.getElementById('backendUrl');

// 模式切换
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    if (currentMode === 'exam') {
      examSection.classList.remove('hidden');
      dailySection.classList.add('hidden');
    } else {
      examSection.classList.add('hidden');
      dailySection.classList.remove('hidden');
    }
    resultSection.classList.add('hidden');
  });
});

// 保存选择器配置
saveSelectorsBtn.addEventListener('click', async () => {
  const essaySelector = essaySelectorInput.value.trim();
  const scoreSelector = scoreSelectorInput.value.trim();

  if (!essaySelector || !scoreSelector) {
    alert('请填写两个选择器');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, {
      action: 'configureSelectors',
      essaySelector: essaySelector,
      scoreButtonSelector: scoreSelector
    });
    saveSelectorsBtn.textContent = '已保存';
    saveSelectorsBtn.disabled = true;
    setTimeout(() => {
      saveSelectorsBtn.textContent = '保存配置';
      saveSelectorsBtn.disabled = false;
    }, 2000);
  } catch (err) {
    alert('保存失败：' + err.message);
  }
});

// 考试模式：读取作文
extractBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    examStatus.textContent = '请输入 API Key';
    return;
  }

  examStatus.textContent = '正在读取作文内容...';
  extractBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractEssay' });

    if (result && result.success) {
      extractedEssay = result.content;
      essayContent.textContent = extractedEssay;
      examStatus.textContent = `已读取 ${extractedEssay.length} 字`;
      autoGradeBtn.disabled = false;
    } else {
      examStatus.textContent = '读取失败：' + (result?.error || '请确保在目标网站页面');
    }
  } catch (err) {
    examStatus.textContent = '读取失败：' + err.message;
  } finally {
    extractBtn.disabled = false;
  }
});

// 考试模式：AI 评分并自动点击
autoGradeBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rules = rulesTextarea.value.trim();

  if (!apiKey) {
    examStatus.textContent = '请输入 API Key';
    return;
  }
  if (!rules) {
    examStatus.textContent = '请输入评分规则';
    return;
  }
  if (!extractedEssay) {
    examStatus.textContent = '请先读取作文内容';
    return;
  }

  examStatus.textContent = 'AI 评分中，请稍候...';
  autoGradeBtn.disabled = true;

  try {
    gradingResult = await gradeEssay(apiKey, rules, extractedEssay);

    if (gradingResult && gradingResult.score !== undefined) {
      totalScoreEl.textContent = gradingResult.score;
      displayResultDetails(gradingResult);
      resultSection.classList.remove('hidden');

      examStatus.textContent = `评分完成：${gradingResult.score}分，正在自动打分...`;

      // 自动点击分数
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'clickScore',
        score: gradingResult.score
      });

      examStatus.textContent = `评分完成！已自动点击 ${gradingResult.score} 分`;
    } else {
      examStatus.textContent = '评分失败：未返回有效结果';
    }
  } catch (err) {
    examStatus.textContent = '评分失败：' + err.message;
  } finally {
    autoGradeBtn.disabled = false;
  }
});

// 日常模式：图片上传
uploadArea.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.classList.remove('hidden');
      uploadArea.querySelector('.upload-placeholder').classList.add('hidden');
      gradeImageBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

// 日常模式：AI 评分
gradeImageBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rules = rulesTextarea.value.trim();

  if (!apiKey) {
    dailyStatus.textContent = '请输入 API Key';
    return;
  }
  if (!rules) {
    dailyStatus.textContent = '请输入评分规则';
    return;
  }
  if (!previewImage.src || previewImage.src === 'data:,') {
    dailyStatus.textContent = '请先上传图片';
    return;
  }

  dailyStatus.textContent = 'AI 识别和评分中，请稍候...';
  gradeImageBtn.disabled = true;

  try {
    gradingResult = await gradeImage(apiKey, rules, previewImage);

    if (gradingResult && gradingResult.score !== undefined) {
      totalScoreEl.textContent = gradingResult.score;
      displayResultDetails(gradingResult);
      resultSection.classList.remove('hidden');
      dailyStatus.textContent = `评分完成：${gradingResult.score}分`;
    } else {
      dailyStatus.textContent = '评分失败：未返回有效结果';
    }
  } catch (err) {
    dailyStatus.textContent = '评分失败：' + err.message;
  } finally {
    gradeImageBtn.disabled = false;
  }
});

// 调用 MiniMax 文本 API 评分
async function gradeEssay(apiKey, rules, essay) {
  const response = await fetch('https://api.minimaxi.com/anthropic/v1/messages', {
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
请根据用户提供的评分规则，对作文进行评分，并返回 JSON 格式的结果。
评分规则和作文内容会在 messages 中提供。`,
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
  const text = data.content?.[0]?.text;

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

// 调用后端服务进行图片理解和评分
async function gradeImage(apiKey, rules, imageElement) {
  const backendUrl = backendUrlInput.value.trim() || 'http://localhost:3001';

  dailyStatus.textContent = '正在上传图片...';

  try {
    // 将图片转换为 base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);

    dailyStatus.textContent = '图片理解中，请稍候...';

    // 调用后端 API
    const response = await fetch(`${backendUrl}/api/understand-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: imageBase64,
        prompt: `这是一篇作文，请识别其中的标题和正文内容。`,
        apiKey: apiKey
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`后端服务错误: ${response.status} - ${err}`);
    }

    const imageResult = await response.json();

    if (!imageResult.success && !imageResult.description) {
      throw new Error(imageResult.error || '图片理解失败');
    }

    dailyStatus.textContent = '图片识别完成，正在评分...';

    // 使用识别出的作文内容进行评分
    const essayText = imageResult.description;

    // 调用后端评分 API
    const gradeResponse = await fetch(`${backendUrl}/api/grade-essay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        essay: essayText,
        rules: rules,
        apiKey: apiKey
      })
    });

    if (!gradeResponse.ok) {
      const err = await gradeResponse.text();
      throw new Error(`评分API错误: ${gradeResponse.status} - ${err}`);
    }

    const gradeResult = await gradeResponse.json();

    return {
      ...gradeResult,
      _imageDescription: essayText // 保留图片识别结果供参考
    };
  } catch (error) {
    throw new Error('日常模式错误: ' + error.message);
  }
}

// 显示评分结果详情
function displayResultDetails(result) {
  let html = '';

  // 如果有图片识别结果，显示识别出的作文内容
  if (result._imageDescription) {
    html += '<h3>识别内容</h3>';
    html += `<div class="recognized-text">${escapeHtml(result._imageDescription.substring(0, 200))}${result._imageDescription.length > 200 ? '...' : ''}</div>`;
  }

  if (result.strengths && result.strengths.length > 0) {
    html += '<h3>优点</h3><ul>';
    result.strengths.forEach(s => { html += `<li>${escapeHtml(s)}</li>`; });
    html += '</ul>';
  }

  if (result.weaknesses && result.weaknesses.length > 0) {
    html += '<h3>问题</h3><ul>';
    result.weaknesses.forEach(w => { html += `<li>${escapeHtml(w)}</li>`; });
    html += '</ul>';
  }

  if (result.suggestions && result.suggestions.length > 0) {
    html += '<h3>建议</h3><ul>';
    result.suggestions.forEach(s => { html += `<li>${escapeHtml(s)}</li>`; });
    html += '</ul>';
  }

  if (result.summary) {
    html += `<h3>总体评价</h3><p>${escapeHtml(result.summary)}</p>`;
  }

  resultDetails.innerHTML = html || '<p>无详细评价</p>';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
