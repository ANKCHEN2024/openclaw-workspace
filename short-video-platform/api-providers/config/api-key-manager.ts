/**
 * API 密钥管理器
 * 安全地管理和访问 API 密钥
 */

import { providerConfigs } from './providers.config';

/**
 * API 密钥管理器类
 * 
 * 功能：
 * 1. 从环境变量读取 API 密钥
 * 2. 验证密钥是否存在
 * 3. 提供安全的密钥访问方式
 * 
 * 安全提示：
 * - 永远不要将 API 密钥写入日志
 * - 不要将密钥提交到版本控制
 * - 使用 .env 文件管理本地密钥（需加入 .gitignore）
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keyCache: Map<string, string> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * 获取指定提供商的 API 密钥
   * @param providerName 提供商名称
   * @returns API 密钥，如果不存在则返回 undefined
   */
  getApiKey(providerName: string): string | undefined {
    // 检查缓存
    if (this.keyCache.has(providerName)) {
      return this.keyCache.get(providerName);
    }

    // 获取配置
    const config = providerConfigs[providerName];
    if (!config) {
      console.warn(`[ApiKeyManager] 未知的提供商：${providerName}`);
      return undefined;
    }

    // 从环境变量读取
    const apiKey = process.env[config.apiKeyEnvName];
    
    if (!apiKey) {
      console.warn(`[ApiKeyManager] 未找到 API 密钥，请设置环境变量：${config.apiKeyEnvName}`);
      return undefined;
    }

    // 缓存密钥
    this.keyCache.set(providerName, apiKey);
    
    return apiKey;
  }

  /**
   * 检查提供商的 API 密钥是否存在
   * @param providerName 提供商名称
   * @returns 是否存在有效的 API 密钥
   */
  hasApiKey(providerName: string): boolean {
    const apiKey = this.getApiKey(providerName);
    return !!apiKey && apiKey.length > 0;
  }

  /**
   * 检查多个提供商的 API 密钥
   * @param providerNames 提供商名称列表
   * @returns 包含每个提供商密钥状态的映射
   */
  checkMultipleApiKeys(providerNames: string[]): Map<string, boolean> {
    const results = new Map<string, boolean>();
    for (const name of providerNames) {
      results.set(name, this.hasApiKey(name));
    }
    return results;
  }

  /**
   * 清除缓存的密钥
   * 在重新加载环境变量后调用
   */
  clearCache(): void {
    this.keyCache.clear();
  }

  /**
   * 清除特定提供商的缓存密钥
   * @param providerName 提供商名称
   */
  clearCacheForProvider(providerName: string): void {
    this.keyCache.delete(providerName);
  }

  /**
   * 获取所有已配置密钥的提供商列表
   * @returns 有有效 API 密钥的提供商名称列表
   */
  getConfiguredProviders(): string[] {
    const configured: string[] = [];
    for (const providerName of Object.keys(providerConfigs)) {
      if (this.hasApiKey(providerName)) {
        configured.push(providerName);
      }
    }
    return configured;
  }

  /**
   * 验证 API 密钥格式（基础验证）
   * @param providerName 提供商名称
   * @returns 验证结果
   */
  validateKeyFormat(providerName: string): { valid: boolean; message?: string } {
    const apiKey = this.getApiKey(providerName);
    
    if (!apiKey) {
      return { valid: false, message: 'API 密钥不存在' };
    }

    if (apiKey.length < 10) {
      return { valid: false, message: 'API 密钥长度过短' };
    }

    // 可以根据不同提供商的密钥格式进行更详细的验证
    // 这里只做基础检查
    
    return { valid: true };
  }
}

/**
 * 便捷函数：获取 API 密钥
 */
export function getApiKey(providerName: string): string | undefined {
  return ApiKeyManager.getInstance().getApiKey(providerName);
}

/**
 * 便捷函数：检查 API 密钥是否存在
 */
export function hasApiKey(providerName: string): boolean {
  return ApiKeyManager.getInstance().hasApiKey(providerName);
}

/**
 * 便捷函数：获取所有已配置的提供商
 */
export function getConfiguredProviders(): string[] {
  return ApiKeyManager.getInstance().getConfiguredProviders();
}
