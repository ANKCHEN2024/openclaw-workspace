# 🎬 一键短视频生成平台

> **工作准则**：本项目遵循 `../WORK_PRINCIPLES.md` 全部 15 条准则，特别是：
> - 第 2 条：24 小时不间断开发
> - 第 4 条：质量第一（零缺陷交付）
> - 第 6 条：定时汇报
> - 第 8 条：Subagent 优先（并行开发）
> - 第 10 条：写下来>脑子记
> - 第 12 条：快速迭代（MVP 优先）
> - 第 13 条：透明沟通


## 项目概述
一个本地运行的短视频生成平台，支持多种 AI 视频生成 API，提供简洁的 Web 界面和 CLI 工具。

## 核心功能

### 1. 视频生成
- 文本生成视频（Text-to-Video）
- 图片生成视频（Image-to-Video）
- 支持多个视频 API 提供商
- 批量生成队列

### 2. API 集成
**国内 API**（推荐）:
- 阿里云 - 通义万相
- 腾讯云 - 混元大模型
- 火山引擎 - 即梦 AI
- 快手 - 可灵 AI

**国际 API**:
- Runway ML
- Pika Labs
- Kling AI
- Stable Video Diffusion (本地)

- 可扩展的 API 插件系统

### 3. 用户界面
- Web 界面（简洁现代）
- CLI 工具
- API 接口

### 4. 视频管理
- 生成历史记录
- 本地存储管理
- 视频预览和下载
- 基础编辑功能

### 5. 高级功能
- 提示词优化助手
- 视频风格模板
- 批量处理
- 生成进度追踪

## 技术栈
- **后端**: Node.js + Express / Python FastAPI
- **前端**: React / Vue 3
- **视频处理**: ffmpeg
- **存储**: 本地文件系统

## 项目结构
```
short-video-platform/
├── backend/           # 后端服务
├── frontend/          # Web 界面
├── cli/              # 命令行工具
├── api-providers/    # API 集成模块
├── video-processor/  # 视频处理模块
├── docs/             # 文档
└── config/           # 配置文件
```

## 快速开始
（待开发完成后填写）

## 开发状态
- [ ] 后端核心
- [ ] API 集成
- [ ] Web 界面
- [ ] CLI 工具
- [ ] 视频处理
- [ ] 文档
