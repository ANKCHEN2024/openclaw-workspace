# 短视频生成平台 - 后端服务

基于 Node.js + Express 的短视频生成平台后端 API 服务。

## 功能特性

- ✅ 视频生成任务管理
- ✅ 任务队列系统
- ✅ 多 API 提供商支持（阿里云、腾讯云、火山引擎）
- ✅ API 密钥配置管理
- ✅ CORS 跨域支持
- ✅ 统一错误处理
- ✅ 请求日志记录

## 技术栈

- **运行时:** Node.js
- **框架:** Express.js
- **依赖:** cors, uuid
- **低代码依赖:** 仅 3 个核心依赖包

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

服务默认运行在 `http://localhost:3000`

## API 端点

### 1. 视频生成

#### POST /api/generate
生成新视频

**请求体:**
```json
{
  "prompt": "一只可爱的猫咪在草地上玩耍",
  "provider": "aliyun",
  "duration": 30,
  "resolution": "1080p",
  "style": "realistic"
}
```

**响应:**
```json
{
  "success": true,
  "message": "视频生成任务已创建",
  "data": {
    "taskId": "uuid",
    "status": "pending",
    "estimatedTime": "3-5 分钟",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 视频管理

#### GET /api/videos
获取视频列表

**查询参数:**
- `status`: 按状态过滤 (pending, processing, completed, failed)
- `limit`: 返回数量限制 (默认 20)
- `offset`: 偏移量 (默认 0)

#### GET /api/videos/:id
获取单个视频详情

#### DELETE /api/videos/:id
删除视频

### 3. API 提供商

#### GET /api/providers
获取支持的 API 提供商列表

### 4. 配置管理

#### POST /api/config
配置 API 密钥

**请求体:**
```json
{
  "provider": "aliyun",
  "apiKey": "your-api-key-here"
}
```

#### GET /api/config
获取当前配置（不包含敏感信息）

### 5. 健康检查

#### GET /api/health
检查服务状态

## 项目结构

```
backend/
├── src/
│   ├── index.js              # 主入口文件
│   ├── routes/               # 路由文件
│   │   ├── generate.js       # 视频生成路由
│   │   ├── videos.js         # 视频管理路由
│   │   ├── providers.js      # 提供商路由
│   │   └── config.js         # 配置路由
│   ├── middleware/           # 中间件
│   │   └── errorHandler.js   # 错误处理
│   └── utils/                # 工具模块
│       ├── configManager.js  # 配置管理
│       └── taskQueue.js      # 任务队列
├── config/                   # 配置目录（自动生成）
│   └── config.json          # 配置文件（需手动创建）
├── package.json
└── README.md
```

## 任务状态

- `pending`: 等待中
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败
- `cancelled`: 已取消

## 配置示例

首次运行时，系统会自动创建 `config/config.json` 文件。

手动配置 API 密钥：

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"provider": "aliyun", "apiKey": "your-key"}'
```

## 使用示例

### 1. 配置 API 密钥

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"provider": "aliyun", "apiKey": "sk-xxx"}'
```

### 2. 生成视频

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的猫咪在草地上玩耍",
    "duration": 30,
    "resolution": "1080p"
  }'
```

### 3. 查看任务状态

```bash
curl http://localhost:3000/api/videos/{taskId}
```

### 4. 获取视频列表

```bash
curl "http://localhost:3000/api/videos?status=completed&limit=10"
```

## 环境变量

- `PORT`: 服务端口（默认：3000）
- `NODE_ENV`: 运行环境（development/production）

## 注意事项

1. **API 密钥安全**: 生产环境应使用加密存储，不要将 `config/config.json` 提交到版本控制
2. **CORS 配置**: 生产环境应限制具体的允许域名
3. **任务队列**: 当前为内存队列，重启后数据会丢失，生产环境建议使用 Redis 等持久化队列
4. **视频生成**: 当前为模拟实现，实际使用需对接真实的视频生成 API

## 许可证

ISC
