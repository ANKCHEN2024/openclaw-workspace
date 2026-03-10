/**
 * API Providers 模块入口
 * 
 * 短视频生成平台的 API 集成模块
 * 支持多个视频生成 API 提供商的统一接口
 * 
 * @package short-video-platform/api-providers
 * @version 1.0.0
 */

// 类型导出
export * from './types';

// 配置导出
export { providerConfigs, getEnabledProviders, getProviderConfig } from './config/providers.config';
export { ApiKeyManager, getApiKey, hasApiKey, getConfiguredProviders } from './config/api-key-manager';

// 工具函数导出
export * from './utils';

// 提供商导出
export { BaseVideoProvider } from './providers/base-provider';
export { RunwayProvider } from './providers/runway-provider';
export { PikaProvider } from './providers/pika-provider';
export { KlingProvider } from './providers/kling-provider';
export { SVDProvider } from './providers/svd-provider';
export { ProviderManager, getProviderManager, getProvider, getAvailableProviders } from './providers';

// 类型重新导出
export type {
  VideoGenerationOptions,
  TaskStatus,
  TaskStatusInfo,
  VideoInfo,
  ApiResult,
  GenerationTask,
  ProviderConfig,
  IVideoProvider,
} from './types';
