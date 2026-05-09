# Scope Decision — 作文批改助手 MVP

## 确认的 MVP 范围

### 两个场景
| 场景 | 输入 | 处理 | 输出 |
|------|------|------|------|
| 考试模式 | 网站 DOM 读取 | MiniMax 文本 API 评分 | 自动点击分数按钮 |
| 日常模式（扩展） | 图片上传 | 后端 → MiniMax Vision API → 文本评分 | 展示分数和评语 |
| OpenClaw Skill | 飞书发图 | OpenClaw → MiniMax Vision API → 评分 | 飞书消息返回评分 |

### 核心功能
- 评分规则输入（用户自定义，每次输入）
- MiniMax Vision API（图片理解）
- MiniMax 文本 API（作文评分）
- 自动点击分数按钮（考试模式）

### 技术栈
- Chrome Extension (Manifest V3)
- Node.js 后端服务（处理图片理解）
- MiniMax 文本 API: `https://api.minimaxi.com/anthropic/v1/messages`
- MiniMax Vision API: `https://api.minimaxi.com/v1/chat/completions`（OpenAI 兼容）

### 暂不包含
- 批量自动批改
- 评分历史存储
- 自定义评分维度预设

## 已验证
- [x] MiniMax Vision API 支持图片理解
- [x] MiniMax 文本 API 支持作文评分（返回 45 分详细评语）
- [x] 后端服务运行在 3002 端口
- [x] OpenClaw Skill 已创建

## 待确认
- [ ] 考试网站作文区域 DOM 选择器
- [ ] 考试网站分数按钮 DOM 结构
- [ ] 日常模式（扩展）实际测试
