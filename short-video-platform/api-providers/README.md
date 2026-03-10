# API Providers - 短视频生成平台 API 集成模块

统一的视频生成 API 集成模块，支持多个主流 AI 视频生成平台。

## 📦 支持的提供商

| 提供商 | 状态 | 特点 |
|--------|------|------|
| **Runway ML** | ✅ 已实现 | 专业级视频生成，Gen-2 模型 |
| **Pika Labs** | ✅ 已实现 | 快速生成，适合社交媒体 |
| **Kling AI（可灵）** | ✅ 已实现 | 快手出品，支持中文提示词 |
| **Stable Video Diffusion** | ✅ 已实现 | 本地部署，开源免费 |

## 🚀 快速开始

### 1. 安装依赖

```bash
cd api-providers
npm install
```

### 2. 配置 API 密钥

复制示例配置文件并填入你的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Runway ML
RUNWAY_API_KEY=your_runway_api_key

# Pika Labs
PIKA_API_KEY=your_pika_api_key

# Kling AI
KLING_API_KEY=your_kling_api_key

# SVD（本地部署可选）
SVD_API_KEY=optional
```

### 3. 基本使用

```typescript
import { getProvider } from './api-providers';

// 获取提供商
const provider = getProvider('runway');

// 生成视频
const result = await provider?.generateVideo(
  '一只可爱的猫咪在阳光下玩耍',
  {
    duration: 4,
    resolution: '1080p',
  }
);

if (result?.success) {
  const taskId = result.data;
  console.log('任务 ID:', taskId);
  
  // 检查状态
  const status = await provider?.checkStatus(taskId);
  
  // 下载视频
  const video = await provider?.downloadVideo(taskId, './output.mp4');
}
```

## 📖 API 文档

### 统一接口

所有提供商都实现以下统一接口：

#### `generateVideo(prompt, options?)`

生成视频

```typescript
interface VideoGenerationOptions {
  duration?: number;        // 视频时长（秒）
  resolution?: string;      // 分辨率：1080p, 720p
  fps?: number;             // 帧率
  style?: string;           // 风格提示
  negativePrompt?: string;  // 负面提示
  seed?: number;            // 种子值
  extra?: Record<string, any>; // 额外参数
}
```

#### `checkStatus(taskId)`

检查任务状态

```typescript
interface TaskStatusInfo {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;        // 进度 0-100
  message?: string;         // 状态消息
  error?: string;           // 错误信息
}
```

#### `downloadVideo(videoId, savePath?)`

下载视频

```typescript
interface VideoInfo {
  videoId: string;
  downloadUrl: string;
  previewUrl?: string;
  duration: number;
  resolution: string;
  fileSize?: number;
  format?: string;
}
```

### 响应格式

所有 API 调用返回统一格式：

```typescript
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  provider: string;
  requestId?: string;
}
```

## 📁 目录结构

```
api-providers/
├── index.ts                 # 主入口
├── types/
│   └── index.ts            # 类型定义
├── config/
│   ├── providers.config.ts # 提供商配置
│   └── api-key-manager.ts  # API 密钥管理
├── utils/
│   └── index.ts            # 工具函数
├── providers/
│   ├── base-provider.ts    # 基础提供商类
│   ├── runway-provider.ts  # Runway ML
│   ├── pika-provider.ts    # Pika Labs
│   ├── kling-provider.ts   # Kling AI
│   ├── svd-provider.ts     # SVD 本地
│   └── index.ts            # 提供商管理器
├── examples/
│   └── usage-examples.ts   # 使用示例
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 高级用法

### 提供商管理器

```typescript
import { getProviderManager } from './api-providers';

const manager = getProviderManager();

// 查看所有可用提供商
const available = manager.getAvailableProviders();

// 使用特定提供商
const result = await manager.generateVideo('pika', prompt, options);

// 故障转移
for (const providerName of ['runway', 'pika', 'kling']) {
  const result = await manager.generateVideo(providerName, prompt);
  if (result.success) break;
}
```

### 添加新提供商

1. 创建提供商类继承 `BaseVideoProvider`
2. 实现统一接口方法
3. 在配置中添加提供商配置
4. 在 `providers/index.ts` 中注册

```typescript
// 示例：添加新提供商
export class NewProvider extends BaseVideoProvider {
  readonly name = 'New Provider';
  
  async generateVideo(prompt: string, options?: VideoGenerationOptions) {
    // 实现生成逻辑
  }
  
  async checkStatus(taskId: string) {
    // 实现状态检查
  }
  
  async downloadVideo(videoId: string, savePath?: string) {
    // 实现下载逻辑
  }
}
```

## ⚠️ 注意事项

1. **API 密钥安全**
   - 不要将 `.env` 文件提交到版本控制
   - 使用环境变量管理密钥

2. **错误处理**
   - 始终检查 `result.success`
   - 实现重试机制（已内置）

3. **API 限流**
   - 注意各提供商的速率限制
   - 批量生成时添加延迟

4. **本地 SVD**
   - 需要 GPU 支持
   - 默认地址：http://localhost:7860
   - 在配置中启用：`enabled: true`

## 📝 提供商对比

| 特性 | Runway | Pika | Kling | SVD |
|------|--------|------|-------|-----|
| 生成速度 | 中 | 快 | 慢 | 取决于 GPU |
| 视频质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 中文支持 | 一般 | 一般 | 优秀 | 取决于模型 |
| 成本 | 高 | 中 | 中 | 免费 |
| 部署方式 | 云端 | 云端 | 云端 | 本地 |

## 🐛 故障排除

### API 密钥无效
```bash
# 检查环境变量是否加载
echo $RUNWAY_API_KEY
```

### 连接超时
- 检查网络连接
- 增加 `timeout` 配置
- 使用代理（如需要）

### SVD 服务不可用
```bash
# 检查本地服务是否运行
curl http://localhost:7860/sdapi/v1/cmd-flags
```

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
