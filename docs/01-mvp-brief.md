# MVP Brief — 作文批改助手

## 1. Concept & Vision

一款嵌入浏览器的作文批改助手，通过 AI 辅助将老师从重复性评分工作中解放出来。

**两个核心场景：**
- **考试模式**：登录目标网站 → 自动读取作文内容 → AI 评分 → 自动点击打分
- **日常模式**：拍照上传作文图片 → AI 视觉识别内容 → AI 评分 → 展示分数与评语

**核心价值：** 消除人工逐字阅读、逐分点击的重复劳动，老师只需确认 AI 评分结果。

---

## 2. Solution Overview

### 考试模式流程
```
用户登录目标网站 → 打开扩展 → 输入评分规则 → 配置 DOM 选择器
→ 点击"读取作文内容" → 确认内容
→ 点击"AI 评分并打分" → AI 评分
→ 自动点击对应分数按钮（1-50） → 人工确认/调整
```

### 日常模式流程
```
用户拍照 → 扩展上传图片 → 后端调用 MiniMax 图片理解 API
→ AI 按规则评分 → 展示分数 + 详细评语
```

---

## 3. Technical Architecture

### Chrome Extension (Manifest V3)
- **popup.html** — 主交互界面（模式切换、评分规则输入、状态显示）
- **content.js** — 注入目标网站，读取作文 DOM、自动点击分数按钮
- **background.js** — 预留协调能力

### Node.js 后端服务
- 接收扩展上传的图片
- 调用 MiniMax Vision API (`https://api.minimaxi.com/v1/chat/completions`) 进行图片理解
- 调用 MiniMax 文本 API (`https://api.minimaxi.com/anthropic/v1/messages`) 进行作文评分

### OpenClaw Skill
- **skills/zuowen-grading/** — 飞书 + OpenClaw 场景下的作文批改 Skill
- 内置通用评分规则（50分制），用户发送作文照片即可获得评分

### 数据流

**考试模式：**
```
[popup] → [content script] → [目标网站 DOM]
              ↓
         [MiniMax API] → [popup] → [content script 点击分数]
```

**日常模式（扩展）：**
```
[popup] → [后端服务] → [MiniMax Vision API]
              ↓
         [MiniMax 文本 API] → [popup]
```

**OpenClaw Skill：**
```
[飞书] → [OpenClaw] → [MiniMax Vision API] → [评分结果]
```

---

## 4. Key Components

### 4.1 Popup UI
- 模式切换：考试 / 日常
- API Key 输入
- 评分规则输入（textarea）
- 考试模式：DOM 选择器配置（展开式）
- 状态显示：等待中 / 识别中 / 评分中 / 完成
- 开始/暂停按钮

### 4.2 Content Script (content.js)
**考试模式：**
- `extractEssay()` — 读取作文内容区域的文本
- `clickScore(score)` — 自动点击对应分数按钮（1-50）
- 依赖用户配置的 CSS 选择器

### 4.3 后端服务 (server/server.js)
- `POST /api/understand-image` — 图片理解（调用 MiniMax Vision API）
- `POST /api/grade-essay` — 作文评分（调用 MiniMax 文本 API）
- `GET /health` — 健康检查

### 4.4 OpenClaw Skill (skills/zuowen-grading/)
- 内置通用评分规则（内容25分 + 结构10分 + 语言15分）
- 自动识别作文图片中的标题和正文
- 输出结构化评分结果

---

## 5. API Integration

### MiniMax Vision API（图片理解）
- **端点**: `POST https://api.minimaxi.com/v1/chat/completions`
- **模型**: `MiniMax-M2.7`
- **方式**: OpenAI 兼容接口，content 数组含 `type: "image_url"`

### MiniMax 文本 API（作文评分）
- **端点**: `POST https://api.minimaxi.com/anthropic/v1/messages`
- **模型**: `MiniMax-M2.7`
- **方式**: Anthropic 兼容接口，content 是文本

---

## 6. Open Questions

| # | 问题 | 状态 |
|---|------|------|
| 1 | 考试网站作文区域的 CSS 选择器 | ⏳ 待用户提供 |
| 2 | 考试网站分数按钮的 DOM 结构 | ⏳ 待用户提供 |
| 3 | OpenClaw Skill 图片理解方式 | ✅ 已验证 MiniMax Vision API 可用 |

---

## 7. MVP Scope

**已实现：**
- 考试模式：DOM 读取 + MiniMax 评分 + 自动点击
- 日常模式（扩展）：图片上传 + 后端服务 + MiniMax 图片理解 + 评分
- OpenClaw Skill：飞书发图 → 自动评分

**暂不包含：**
- 批量自动批改（多篇连续处理）
- 评分历史记录存储
- 自定义评分维度预设

---

## 8. File Structure

```
zuowen/
├── manifest.json
├── popup.html / .css / .js
├── content.js
├── background.js
├── README.md
├── .gitignore
├── docs/
│   ├── 01-mvp-brief.md
│   └── 02-scope-decision.md
├── server/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .env                    # 已 gitignore
└── skills/
    └── zuowen-grading/
        ├── SKILL.md
        └── INSTALL.md
```

---

## 9. Success Criteria

- [x] 作文评分 API 验证通过（45分输出，包含详细评语）
- [x] MiniMax Vision API 验证通过（可识别图片内容）
- [x] 后端服务在 localhost:3002 正常运行
- [x] OpenClaw Skill 创建完成
- [ ] 考试模式实际测试（待提供 DOM 选择器）
- [ ] 日常模式扩展端实际测试
