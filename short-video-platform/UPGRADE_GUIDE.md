# 🚀 短视频平台升级指南

## 升级概述

本次升级实现了以下核心功能：

- ✅ **真实API提供商支持** - 支持 Runway ML、Kling AI (可灵) 等真实 API
- ✅ **任务队列系统** - 异步处理视频生成任务，支持并发控制
- ✅ **视频下载存储** - 自动下载生成的视频到本地
- ✅ **进度实时更新** - 任务状态实时跟踪
- ✅ **Mock 测试模式** - 无需 API 密钥即可测试

---

## 📦 新文件结构

```
backend/
├── src/
│   ├── providers/           # API 提供商模块（新增）
│   │   ├── base.js         # 提供商基类
│   │   ├── index.js        # 提供商管理器
│   │   ├── runway.js       # Runway ML 实现
│   │   ├── kling.js        # 可灵 AI 实现
│   │   └── mock.js         # Mock 测试模式
│   ├── services/           # 服务层（新增）
│   │   └── videoService.js # 视频服务
│   ├── routes/
│   │   ├── generate.js     # 生成路由（更新）
│   │   ├── videos.js       # 视频路由（更新）
│   │   └── tasks.js        # 任务路由（新增）
│   └── config/
│       └── config.json     # 配置文件
└── downloads/              # 下载的视频存储
```

---

## 🔧 配置真实 API

### 1. 获取 API 密钥

#### Runway ML
1. 访问 https://dev.runwayml.com/
2. 注册账号并创建 API 密钥
3. 复制密钥备用

#### Kling AI (可灵)
1. 访问 https://klingai.com/
2. 注册开发者账号
3. 在控制台获取 API 密钥

### 2. 配置 API 密钥

通过 Web 界面配置：
1. 启动服务：`./start.sh`
2. 访问 http://localhost:8080/settings.html
3. 选择提供商并输入 API 密钥

或通过 API 直接配置：

```bash
# 配置 Runway
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "runway",
    "apiKey": "your_runway_api_key_here"
  }'

# 配置可灵
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "kling",
    "apiKey": "your_kling_api_key_here"
  }'
```

---

## 🎬 使用方式

### 方式一：Web 界面

```bash
./start.sh
```

访问 http://localhost:8080

1. 首页输入视频描述
2. 选择风格、时长
3. 点击生成
4. 实时查看进度
5. 在视频库查看结果

### 方式二：API 调用

```bash
# 生成视频
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的柯基在草地上奔跑",
    "duration": 10,
    "style": "realistic",
    "provider": "runway"
  }'

# 返回示例：
# {
#   "success": true,
#   "data": {
#     "taskId": "uuid...",
#     "status": "pending",
#     "estimatedTime": "2-5 分钟"
#   }
# }

# 查询任务状态
curl http://localhost:3000/api/tasks/{taskId}

# 查看视频列表
curl http://localhost:3000/api/videos
```

---

## 🧪 测试模式（无需 API 密钥）

系统默认启用 Mock 模式，无需配置任何 API 密钥即可测试完整流程：

```bash
# Mock 模式会在 10-15 秒内模拟整个生成过程
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试视频"}'
```

---

## 📊 API 端点列表

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/generate` | 创建视频生成任务 |
| GET | `/api/tasks` | 获取所有任务 |
| GET | `/api/tasks/:id` | 获取任务状态 |
| GET | `/api/videos` | 获取视频列表 |
| GET | `/api/videos/:id` | 获取视频详情 |
| DELETE | `/api/videos/:id` | 删除视频 |
| GET | `/api/providers` | 获取支持的提供商 |
| POST | `/api/config` | 配置 API 密钥 |
| GET | `/api/health` | 健康检查 |

---

## ⚠️ 重要说明

### 关于真实 API 调用

当前实现为**框架代码**，真实的 API 调用需要根据具体提供商的官方文档进行调整：

1. **Runway ML** - 请参考 https://dev.runwayml.com/docs 获取准确的 API 端点和参数
2. **Kling AI** - 请参考官方文档获取 API 调用方式

实际的 API 调用代码已在 `providers/runway.js` 和 `providers/kling.js` 中标注，需要根据官方文档更新：
- API 端点 URL
- 请求参数格式
- 认证方式
- 响应格式处理

### 生产环境建议

1. **数据库替换** - 当前使用内存存储，生产环境应使用 PostgreSQL/MongoDB
2. **文件存储** - 当前存储在本地，建议使用云存储（AWS S3、阿里云 OSS）
3. **队列系统** - 高并发时建议使用 Redis + Bull 队列
4. **API 限制** - 添加速率限制，避免超出 API 提供商限制

---

## 🔮 后续升级计划

### 短期（1-2周）
- [ ] 接入更多国内 API（阿里云、腾讯云、火山引擎）
- [ ] 添加 WebSocket 实时进度推送
- [ ] 完善错误处理和重试机制

### 中期（1个月）
- [ ] 添加数据库持久化
- [ ] 实现用户认证系统
- [ ] 添加视频模板库

### 长期（3个月）
- [ ] 支持本地 AI 模型（Stable Video Diffusion）
- [ ] 视频编辑功能
- [ ] 批量生成优化

---

## ❓ 常见问题

### Q: 配置 API 密钥后还是使用 Mock 模式？
A: 检查 API 密钥是否正确保存，可以通过 `GET /api/providers` 查看已启用的提供商。

### Q: 真实 API 调用失败？
A: 需要根据实际情况修改 `providers/` 目录下的实现代码，匹配官方 API 文档。

### Q: 视频文件保存在哪里？
A: 下载的视频保存在 `backend/downloads/{taskId}/video.mp4`。

---

## 📞 技术支持

如有问题，请查看：
- 项目文档：`docs/` 目录
- API 文档：启动服务后访问 http://localhost:3000/api/health
- 诊断脚本：`./diagnostic.sh`
