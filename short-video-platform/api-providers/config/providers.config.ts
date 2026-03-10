/**
 * API 提供商配置文件
 * 配置所有视频生成 API 提供商的参数
 */

import { ProviderConfig } from '../types';

/**
 * 提供商配置
 * 
 * 使用说明：
 * 1. 在使用前，请确保在环境变量中设置相应的 API 密钥
 * 2. 可以通过修改 enabled 字段来启用/禁用某个提供商
 * 3. timeout、maxRetries、retryDelay 可根据需要调整
 */
export const providerConfigs: Record<string, ProviderConfig> = {
  /**
   * Runway ML
   * 专业的 AI 视频生成平台
   * 文档：https://docs.runwayml.com/
   */
  runway: {
    name: 'Runway ML',
    baseUrl: 'https://api.runwayml.com/v1',
    apiKeyEnvName: 'RUNWAY_API_KEY',
    enabled: true,
    timeout: 60000,        // 60 秒超时
    maxRetries: 3,         // 最多重试 3 次
    retryDelay: 2000,      // 重试间隔 2 秒
    extra: {
      // Runway 特定的默认参数
      defaultModel: 'gen2',
      defaultDuration: 4,  // 默认 4 秒
    }
  },

  /**
   * Pika Labs
   * 专注于文本到视频的 AI 平台
   * 文档：https://docs.pika.art/
   */
  pika: {
    name: 'Pika Labs',
    baseUrl: 'https://api.pika.art/v1',
    apiKeyEnvName: 'PIKA_API_KEY',
    enabled: true,
    timeout: 90000,        // 90 秒超时（Pika 生成较慢）
    maxRetries: 3,
    retryDelay: 3000,      // 重试间隔 3 秒
    extra: {
      // Pika 特定的默认参数
      defaultModel: 'pika-1.0',
      defaultFps: 24,
    }
  },

  /**
   * Kling AI（可灵）
   * 快手推出的 AI 视频生成模型
   * 文档：https://platform.klingai.com/
   */
  kling: {
    name: 'Kling AI',
    baseUrl: 'https://api.klingai.com/v1',
    apiKeyEnvName: 'KLING_API_KEY',
    enabled: true,
    timeout: 120000,       // 120 秒超时（可灵生成时间较长）
    maxRetries: 3,
    retryDelay: 5000,      // 重试间隔 5 秒
    extra: {
      // Kling 特定的默认参数
      defaultModel: 'kling-v1',
      defaultDuration: 5,
      defaultResolution: '720p',
    }
  },

  /**
   * Stable Video Diffusion（本地部署）
   * Stability AI 的开源视频生成模型
   * 文档：https://github.com/Stability-AI/generative-models
   */
  svd: {
    name: 'Stable Video Diffusion',
    baseUrl: 'http://localhost:7860',  // 本地服务地址，可根据实际部署修改
    apiKeyEnvName: 'SVD_API_KEY',       // 本地部署可选
    enabled: false,                     // 默认禁用，需要本地部署后启用
    timeout: 180000,                    // 180 秒超时（本地推理可能较慢）
    maxRetries: 2,
    retryDelay: 5000,
    extra: {
      // SVD 特定的默认参数
      defaultModel: 'svd-xt',
      defaultFrames: 25,
      defaultMotionBucket: 127,
    }
  },
};

/**
 * 获取启用的提供商列表
 */
export function getEnabledProviders(): string[] {
  return Object.entries(providerConfigs)
    .filter(([_, config]) => config.enabled)
    .map(([key, _]) => key);
}

/**
 * 获取提供商配置
 * @param providerName 提供商名称
 */
export function getProviderConfig(providerName: string): ProviderConfig | undefined {
  return providerConfigs[providerName];
}

/**
 * 获取所有提供商配置
 */
export function getAllProviderConfigs(): Record<string, ProviderConfig> {
  return { ...providerConfigs };
}
