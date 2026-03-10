---
name: auto-skill-installer
description: 自动从 ClawHub 安装热门技能（过滤需要 API 密钥的技能）。当用户想要批量安装免 API 技能、自动定期安装热门技能时使用。支持 24 小时自动检查安装和手动批量安装。
---

# 自动技能安装器

## 概述

这个技能可以自动从 ClawHub (https://clawhub.ai) 下载并安装最受欢迎的技能，**自动过滤掉需要 API 密钥的技能**。支持手动批量安装和 24 小时自动安装模式。

## 免 API 技能白名单

以下技能不需要 API 密钥，可以自动安装：

| 技能 | 描述 |
|------|------|
| **self-improving-agent** | 自我迭代改进代理 |
| **skill-creator** | 技能创建指南 |
| **weather** | 天气查询（无需 API key） |
| **summarize** | 文件/网页摘要 |
| **agent-browser** | 浏览器自动化 |
| **github** | GitHub CLI 操作 |
| **proactive-agent** | 主动式代理 |
| **sonoscli** | Sonos 音箱控制 |
| **obsidian** | Obsidian 笔记管理 |
| **nano-pdf** | PDF 编辑工具 |
| **humanizer** | AI 文本人性化 |
| **openai-whisper** | 本地语音转文字 |
| **youtube-transcript** | YouTube 字幕提取 |
| **brave-search** | Brave 搜索（如已配置） |
| **auto-updater** | 自动更新技能 |

**需要 API 密钥的技能（自动跳过）：**
- tavily-search（需要 TAVILY_API_KEY）
- gog（需要 Google OAuth）
- notion（需要 NOTION_API_KEY）
- nano-banana-pro（需要 API key）
- api-gateway（需要各种 API 密钥）
- 等等

## 使用场景

1. **首次设置** - 新环境快速安装常用免 API 技能
2. **自动维护** - 24 小时自动检查并安装新热门技能
3. **批量安装** - 一次性安装多个免 API 技能

## 工作流程

### 手动安装免 API 热门技能

```bash
# 默认安装前 10 个免 API 技能
python scripts/install_top_skills.py

# 安装前 20 个
python scripts/install_top_skills.py --count 20

# 查看会安装哪些技能（不实际安装）
python scripts/install_top_skills.py --dry-run
```

### 24 小时自动安装模式

```bash
# 启动自动安装守护进程
python scripts/auto_install_daemon.py

# 自定义检查间隔（默认 24 小时）
python scripts/auto_install_daemon.py --interval 12

# 后台运行
nohup python scripts/auto_install_daemon.py > /tmp/auto-skill.log 2>&1 &
```

### 安装特定技能（自动检查是否需要 API）

```bash
# 安装单个技能（自动检查是否需要 API）
python scripts/install_skill.py self-improving-agent

# 强制安装（跳过 API 检查）
python scripts/install_skill.py tavily-search --force
```

## 安装脚本说明

### install_top_skills.py

自动获取热门技能列表，**过滤需要 API 的技能**，批量安装。

**功能：**
- 获取技能列表（按下载量排序）
- **自动过滤需要 API 密钥的技能**
- 跳过已安装的技能
- 自动下载 ZIP 文件
- 解压到扩展目录
- 生成安装报告

**参数：**
- `--count`: 要安装的技能数量（默认 10）
- `--output`: 输出目录（默认 ~/.openclaw/extensions）
- `--dry-run`: 模拟运行，不实际安装
- `--include-api`: 包含需要 API 的技能（默认排除）

### auto_install_daemon.py

24 小时自动检查并安装新热门技能。

**功能：**
- 每 24 小时检查一次热门技能列表
- 自动安装新的免 API 技能
- 记录安装日志
- 支持自定义检查间隔
- 可配置为系统服务

**参数：**
- `--interval`: 检查间隔小时数（默认 24）
- `--output`: 技能安装目录
- `--log`: 日志文件路径

### install_skill.py

安装单个指定的技能，自动检查是否需要 API。

**功能：**
- 检查技能是否需要 API 密钥
- 支持 slug 格式和 URL
- 自动处理下载和安装
- 验证安装结果

**参数：**
- `--force`: 强制安装，跳过 API 检查
- `--output`: 输出目录

## 配置文件

### references/no_api_skills.json

免 API 技能白名单配置文件：

```json
{
  "whitelist": [
    "self-improving-agent",
    "skill-creator",
    "weather",
    "summarize",
    "agent-browser",
    "github",
    "proactive-agent",
    "sonoscli",
    "obsidian",
    "nano-pdf",
    "humanizer",
    "openai-whisper",
    "youtube-transcript",
    "brave-search",
    "auto-updater"
  ],
  "blacklist": [
    "tavily-search",
    "gog",
    "notion",
    "nano-banana-pro",
    "api-gateway",
    "find-skills"
  ]
}
```

## 自动安装日志

### references/install_log.json

记录自动安装历史：

```json
{
  "last_check": "2026-03-06T22:00:00Z",
  "installed": [
    {"skill": "weather", "time": "2026-03-06T22:05:00Z"},
    {"skill": "summarize", "time": "2026-03-06T22:06:00Z"}
  ],
  "skipped": [
    {"skill": "tavily-search", "reason": "requires_api_key"}
  ]
}
```

## 注意事项

1. **API 过滤** - 默认只安装不需要 API 密钥的技能
2. **速率限制** - ClawHub 有下载频率限制，脚本会自动处理重试
3. **安全警告** - 部分技能可能被标记为可疑，安装前会提示确认
4. **重启 Gateway** - 安装完成后需要重启 Gateway 才能启用新技能
5. **日志查看** - 自动安装日志保存在 `references/install_log.json`

## 系统服务配置（macOS）

创建自动安装服务：

```bash
# 复制 plist 文件
sudo cp scripts/ai.openclaw.auto-skill-installer.plist ~/Library/LaunchAgents/

# 加载服务
launchctl load ~/Library/LaunchAgents/ai.openclaw.auto-skill-installer.plist

# 查看状态
launchctl list | grep openclaw
```

## 资源文件

### scripts/
- `install_top_skills.py` - 批量安装免 API 热门技能
- `install_skill.py` - 安装单个技能（自动检查 API）
- `auto_install_daemon.py` - 24 小时自动安装守护进程
- `ai.openclaw.auto-skill-installer.plist` - macOS 服务配置

### references/
- `no_api_skills.json` - 免 API 技能白名单
- `install_log.json` - 安装日志记录