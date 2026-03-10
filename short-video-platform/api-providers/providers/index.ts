/**
 * 视频提供商管理器
 * 
 * 统一管理所有视频生成 API 提供商
 * 提供工厂方法和统一访问接口
 */

import { IVideoProvider, VideoGenerationOptions, ApiResult, TaskStatusInfo, VideoInfo } from '../types';
import { RunwayProvider } from './runway-provider';
import { PikaProvider } from './pika-provider';
import { KlingProvider } from './kling-provider';
import { SVDProvider } from './svd-provider';
import { getEnabledProviders, getProviderConfig } from '../config/providers.config';
import { hasApiKey, getConfiguredProviders } from '../config/api-key-manager';

/**
 * 提供商管理器类
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<string, IVideoProvider> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * 初始化所有提供商
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // 注册所有提供商
    this.registerProvider('runway', new RunwayProvider());
    this.registerProvider('pika', new PikaProvider());
    this.registerProvider('kling', new KlingProvider());
    this.registerProvider('svd', new SVDProvider());

    this.initialized = true;
    console.log('[ProviderManager] 已初始化所有视频提供商');
  }

  /**
   * 注册提供商
   */
  registerProvider(name: string, provider: IVideoProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * 获取提供商
   * @param name 提供商名称
   */
  getProvider(name: string): IVideoProvider | undefined {
    if (!this.initialized) {
      this.initialize();
    }
    return this.providers.get(name);
  }

  /**
   * 获取所有提供商
   */
  getAllProviders(): Map<string, IVideoProvider> {
    if (!this.initialized) {
      this.initialize();
    }
    return new Map(this.providers);
  }

  /**
   * 获取已启用的提供商列表
   */
  getEnabledProviders(): string[] {
    return getEnabledProviders();
  }

  /**
   * 获取已配置的提供商（有有效 API 密钥）
   */
  getConfiguredProviders(): string[] {
    return getConfiguredProviders();
  }

  /**
   * 获取可用的提供商（已启用且有 API 密钥）
   */
  getAvailableProviders(): string[] {
    const enabled = this.getEnabledProviders();
    return enabled.filter(name => hasApiKey(name));
  }

  /**
   * 使用指定提供商生成视频
   * @param providerName 提供商名称
   * @param prompt 提示词
   * @param options 选项
   */
  async generateVideo(
    providerName: string,
    prompt: string,
    options?: VideoGenerationOptions
  ): Promise<ApiResult<string | VideoInfo>> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      return {
        success: false,
        error: `未知的提供商：${providerName}`,
        errorCode: 'UNKNOWN_PROVIDER',
        provider: providerName,
      };
    }

    return provider.generateVideo(prompt, options);
  }

  /**
   * 检查任务状态
   * @param providerName 提供商名称
   * @param taskId 任务 ID
   */
  async checkStatus(
    providerName: string,
    taskId: string
  ): Promise<ApiResult<TaskStatusInfo>> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      return {
        success: false,
        error: `未知的提供商：${providerName}`,
        errorCode: 'UNKNOWN_PROVIDER',
        provider: providerName,
      };
    }

    return provider.checkStatus(taskId);
  }

  /**
   * 下载视频
   * @param providerName 提供商名称
   * @param videoId 视频 ID
   * @param savePath 保存路径
   */
  async downloadVideo(
    providerName: string,
    videoId: string,
    savePath?: string
  ): Promise<ApiResult<VideoInfo>> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      return {
        success: false,
        error: `未知的提供商：${providerName}`,
        errorCode: 'UNKNOWN_PROVIDER',
        provider: providerName,
      };
    }

    return provider.downloadVideo(videoId, savePath);
  }

  /**
   * 验证提供商的 API 密钥
   * @param providerName 提供商名称
   */
  async validateApiKey(providerName: string): Promise<ApiResult<boolean>> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      return {
        success: false,
        error: `未知的提供商：${providerName}`,
        errorCode: 'UNKNOWN_PROVIDER',
        provider: providerName,
      };
    }

    return provider.validateApiKey();
  }

  /**
   * 获取提供商信息
   * @param providerName 提供商名称
   */
  getProviderInfo(providerName: string): ProviderInfo | undefined {
    const config = getProviderConfig(providerName);
    if (!config) {
      return undefined;
    }

    const hasKey = hasApiKey(providerName);
    
    return {
      name: config.name,
      key: providerName,
      enabled: config.enabled,
      configured: hasKey,
      available: config.enabled && hasKey,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    };
  }

  /**
   * 获取所有提供商信息
   */
  getAllProviderInfo(): ProviderInfo[] {
    const infos: ProviderInfo[] = [];
    
    for (const [key, config] of Object.entries(getProviderConfig('') || {})) {
      const info = this.getProviderInfo(key);
      if (info) {
        infos.push(info);
      }
    }

    // 手动构建所有提供商信息
    const providerKeys = ['runway', 'pika', 'kling', 'svd'];
    for (const key of providerKeys) {
      const info = this.getProviderInfo(key);
      if (info) {
        infos.push(info);
      }
    }

    return infos;
  }
}

/**
 * 提供商信息
 */
export interface ProviderInfo {
  name: string;
  key: string;
  enabled: boolean;
  configured: boolean;
  available: boolean;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * 便捷函数：获取提供商管理器实例
 */
export function getProviderManager(): ProviderManager {
  return ProviderManager.getInstance();
}

/**
 * 便捷函数：获取提供商
 */
export function getProvider(name: string): IVideoProvider | undefined {
  return getProviderManager().getProvider(name);
}

/**
 * 便捷函数：获取所有可用提供商
 */
export function getAvailableProviders(): string[] {
  return getProviderManager().getAvailableProviders();
}
