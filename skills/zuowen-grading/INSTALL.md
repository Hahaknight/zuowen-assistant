# 作文批改助手 Skill 安装指南

## 安装步骤

### 方法一：复制到个人 skills 目录（推荐）

```bash
# 复制 skill 到 OpenClaw 个人 skills 目录
cp -r D:/CC/zuowen/skills/zuowen-grading ~/.openclaw/skills/

# 重启 OpenClaw 或开启新会话
```

### 方法二：复制到 workspace skills 目录

如果你有特定的 workspace：
```bash
cp -r D:/CC/zuowen/skills/zuowen-grading <你的workspace>/skills/
```

### 方法三：使用 OpenClaw CLI

```bash
# 进入 skills 目录
cd ~/.openclaw/skills

# 克隆或复制 skill
cp -r D:/CC/zuowen/skills/zuowen-grading ./

# 重启 OpenClaw Gateway
openclaw gateway restart
```

## 验证安装

在 OpenClaw 对话中输入 `/skills` 查看已安装的 skills，应该能看到 `zuowen-grading`。

## 使用方式

在飞书向 OpenClaw 发送：
1. 一张作文照片 + "批改" / "评分" / "打分"
2. 或直接发送作文照片，OpenClaw 会自动识别并评分

## 自定义评分规则

如果需要使用自定义评分规则，可以这样发送：
```
请按以下规则批改：[你的评分规则]
[作文图片]
```
