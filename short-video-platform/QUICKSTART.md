# 🚀 快速入门指南

## 一键短视频生成平台

### 📋 前置要求

确保已安装以下工具：

```bash
# Node.js (v16+)
node -v

# Python 3
python3 -v

# FFmpeg
brew install ffmpeg  # macOS
```

### 🔧 快速启动

```bash
# 1. 进入项目目录
cd /Users/chenggl/workspace/short-video-platform

# 2. 赋予启动脚本执行权限
chmod +x start.sh

# 3. 一键启动
./start.sh
```

启动后：
- **后端 API**: http://localhost:3000
- **Web 界面**: http://localhost:8080
- **CLI 工具**: `short-video --help`

---

## 💻 使用方式

### 方式一：Web 界面（推荐新手）

1. 打开浏览器访问 http://localhost:8080
2. 首次使用先到「设置」页面配置 API 密钥
3. 在首页输入视频描述，点击生成
4. 在「视频库」查看生成的视频

### 方式二：CLI 命令行

```bash
# 安装 CLI 工具
cd cli
npm install
npm link

# 配置（首次使用）
short-video config

# 生成视频
short-video generate "一只柯基在足球场上奔跑"

# 查看视频列表
short-video list

# 下载视频
short-video download <视频 ID>
```

### 方式三：API 调用

```bash
# 生成视频
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只柯基在足球场上奔跑",
    "duration": 30,
    "provider": "runway"
  }'

# 查看视频列表
curl http://localhost:3000/api/videos

# 配置 API 密钥
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "runway_api_key": "your_key_here"
  }'
```

---

## 🎯 功能特性

### ✅ 已实现

- **视频生成**: 文本生成视频、图片生成视频
- **多 API 支持**: Runway ML、Pika Labs、Kling AI
- **Web 界面**: 简洁现代的响应式设计
- **CLI 工具**: 完整的命令行体验
- **视频处理**: 格式转换、剪辑、压缩、水印
- **任务队列**: 批量生成、进度追踪

### 📁 项目结构

```
short-video-platform/
├── backend/           # 后端服务 (Express.js)
├── frontend/          # Web 界面
├── cli/              # 命令行工具
├── api-providers/    # API 集成模块
├── video-processor/  # 视频处理 (ffmpeg)
├── start.sh          # 一键启动脚本
├── README.md         # 项目说明
└── QUICKSTART.md     # 快速入门（本文件）
```

---

## 🔑 API 密钥配置

### 支持的提供商

| 提供商 | 免费额度 | 文档 |
|--------|----------|------|
| Runway ML | 有免费试用 | https://runwayml.com |
| Pika Labs | Discord 免费 | https://pika.art |
| Kling AI | 有免费试用 | https://klingai.com |

### 配置方法

**Web 界面**: 设置页面 → 输入 API 密钥 → 保存

**CLI**: `short-video config` (交互式向导)

**API**: 
```bash
curl -X POST http://localhost:3000/api/config \
  -d '{"runway_api_key": "xxx"}'
```

---

## 📖 更多文档

- [README.md](README.md) - 项目完整说明
- [backend/README.md](backend/README.md) - 后端 API 文档
- [frontend/README.md](frontend/README.md) - 前端使用说明
- [cli/README.md](cli/README.md) - CLI 命令参考
- [api-providers/README.md](api-providers/README.md) - API 集成文档
- [video-processor/README.md](video-processor/README.md) - 视频处理指南

---

## ❓ 常见问题

### Q: 生成视频失败？
A: 检查 API 密钥是否正确配置，网络连接是否正常

### Q: 视频生成很慢？
A: AI 视频生成通常需要 1-5 分钟，可以在任务列表查看进度

### Q: 本地运行需要 GPU 吗？
A: 使用在线 API 不需要 GPU。如果使用本地 SVD 模型需要 NVIDIA GPU

### Q: 如何批量生成？
A: CLI 使用 `--batch` 参数，或在 Web 界面多次提交任务

---

## 🎉 开始创作吧！

现在你已经准备好了，开始生成你的第一个短视频吧！🎬

```bash
short-video generate "一只柯基在足球场上奔跑，阳光明媚，4K 高清"
```
