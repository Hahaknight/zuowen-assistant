# 作文批改助手

## 项目概述

Chrome 扩展 + OpenClaw Skill，调用 MiniMax M2.7 API 对作文进行 AI 批改和评分。

## 两个场景

| 场景 | 入口 | 技术方案 |
|------|------|---------|
| 考试模式 | Chrome 扩展 | DOM 读取 → MiniMax 文本 API → 自动点击分数 |
| 日常批改（扩展） | Chrome 扩展 | 图片上传 → 后端 → MiniMax Vision API → 评分 |
| 日常批改（飞书） | OpenClaw Skill | 飞书发图 → OpenClaw → MiniMax Vision → 评分 |

## 技术栈

- Chrome Extension (Manifest V3)
- Node.js 后端 (`server/server.js`)
- MiniMax API: `https://api.minimaxi.com`
  - Vision: OpenAI 兼容接口 (`/v1/chat/completions`)
  - 文本: Anthropic 兼容接口 (`/anthropic/v1/messages`)

## 关键路径

- 后端端口: **3002**（3001 被占用）
- MiniMax 模型: `MiniMax-M2.7`
- OpenClaw Skill: `skills/zuowen-grading/SKILL.md`

## 工作规则

1. 先澄清需求，再写代码
2. 先出计划，再实现
3. 每次实现后自检、补测试、更新文档
4. 优先小步提交

## gstack workflow

1. /office-hours → docs/01-mvp-brief.md
2. /plan-ceo-review → docs/02-scope-decision.md
3. implementation
4. /review
5. /qa
6. /ship

## 文档

- `README.md` — 安装和使用指南
- `docs/01-mvp-brief.md` — MVP 详细说明
- `docs/02-scope-decision.md` — 范围决策记录
- `skills/zuowen-grading/SKILL.md` — OpenClaw Skill
