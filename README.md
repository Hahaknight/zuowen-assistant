# 作文批改助手

AI 辅助作文批改工具，嵌入 Chrome 浏览器，自动识别作文内容并通过 MiniMax AI 进行智能评分。

## 功能特性

- **考试模式**：自动读取网页作文内容，AI 评分后自动点击对应分数按钮
- **日常模式**：上传作文图片，AI 视觉识别并评分
- **自定义评分规则**：根据不同作文题目设置灵活的评价维度

## 安装步骤

### 1. 安装 Chrome 扩展

1. 下载/克隆本项目到本地
2. 打开 Chrome，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹

### 2. 安装后端服务（日常模式必需）

日常模式的图片理解功能需要后端服务支持。

```bash
cd server
npm install
```

复制环境变量配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 MiniMax API Key：
```
MINIMAX_API_KEY=your_api_key_here
```

启动后端服务：
```bash
npm start
```

服务启动后运行在 `http://localhost:3002`

### 3. 获取 MiniMax API Key

访问 [MiniMax 开放平台](https://platform.minimaxi.com)，订阅 Token Plan 获取 API Key。

## 使用方法

### 考试模式

1. 点击 Chrome 工具栏的扩展图标
2. 选择「考试模式」
3. 输入 MiniMax API Key
4. 输入评分规则
5. 配置 DOM 选择器（见下方说明）
6. 在目标网站进入作文页面
7. 点击「读取作文内容」
8. 确认内容后，点击「AI 评分并打分」
9. AI 完成评分后会自动点击对应分数

### 日常模式

1. 点击 Chrome 工具栏的扩展图标
2. 选择「日常批改」
3. 输入 MiniMax API Key
4. 输入评分规则
5. 确认后端服务地址（默认 `http://localhost:3002`）
6. 拍照或选择作文图片上传
7. 点击「AI 评分」获取评分结果

## 配置 DOM 选择器（考试模式）

对于考试模式，需要配置目标网站的 DOM 选择器：

1. 在目标网站页面按 `F12` 打开开发者工具
2. 点击左上角的元素选择器图标
3. 点击作文内容区域，查看并复制其 class 或 id
4. 同理获取分数按钮区域的选择器
5. 在扩展中配置这些选择器

### 示例

假设作文区域的 HTML 是：
```html
<div class="essay-content" id="main-essay">...</div>
```

则选择器为 `.essay-content` 或 `#main-essay`

假设分数按钮的 HTML 是：
```html
<button class="score-btn" data-score="45">45</button>
```

则选择器为 `.score-btn`

## 技术架构

- **Chrome Extension** (Manifest V3)
- **Node.js 后端服务** - 处理图片理解
- **MiniMax 文本 API** - 作文评分
- **MiniMax MCP** - 图片理解（通过后端服务调用）

## 项目结构

```
zuowen/
├── manifest.json           # Chrome 扩展配置
├── popup.html              # 主界面
├── popup.js               # 界面逻辑
├── popup.css               # 样式
├── content.js             # 内容脚本（DOM 操作）
├── background.js          # 后台脚本
├── server/                # 后端服务（Node.js）
│   ├── server.js          # 服务主文件
│   ├── package.json       # 依赖配置
│   └── .env.example       # 环境变量模板
├── skills/                # OpenClaw Skills
│   └── zuowen-grading/   # 作文批改 Skill
│       ├── SKILL.md       # Skill 定义
│       └── INSTALL.md     # 安装指南
└── README.md              # 说明文档
```

## OpenClaw Skill

本项目包含一个 OpenClaw Skill，可用于飞书等平台的 OpenClaw 集成。

安装方式：
```bash
cp -r skills/zuowen-grading ~/.openclaw/skills/
```

使用方式：在飞书向 OpenClaw 发送作文照片 + "批改"

## 后端 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /health` | GET | 健康检查 |
| `POST /api/understand-image` | POST | 图片理解 |
| `POST /api/grade-essay` | POST | 作文评分 |

### 图片理解接口

```bash
POST /api/understand-image
Content-Type: application/json

{
  "imageBase64": "base64编码的图片数据",
  "prompt": "请描述这张图片中的作文内容",
  "apiKey": "MiniMax API Key"
}
```

### 作文评分接口

```bash
POST /api/grade-essay
Content-Type: application/json

{
  "essay": "作文正文内容",
  "rules": "评分规则",
  "apiKey": "MiniMax API Key"
}
```

## 注意事项

- 考试模式需要目标网站的 DOM 结构支持
- 日常模式必须先启动后端服务
- 请妥善保管你的 API Key，不要泄露给他人
- 后端服务默认运行在 `http://localhost:3002`
