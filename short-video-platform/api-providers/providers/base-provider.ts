/**
 * 基础视频提供商类
 * 所有具体提供商都应继承此类
 */

import { IVideoProvider, VideoGenerationOptions, ApiResult, TaskStatusInfo, VideoInfo, ProviderConfig } from '../types';
import { executeWithRetry, createErrorResult } from '../utils';

/**
 * 抽象基础类
 * 提供通用功能和默认实现
 */
export abstract class BaseVideoProvider implements IVideoProvider {
  /** 提供商名称 */
  abstract readonly name: string;
  
  /** 提供商配置 */
  protected config: ProviderConfig;
  
  /** API 密钥 */
  protected apiKey: string | undefined;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * 初始化（由子类实现）
   * 设置 API 密钥等
   */
  protected async initialize(): Promise<void> {
    // 从环境变量获取 API 密钥
    const apiKeyEnvName = this.config.apiKeyEnvName;
    this.apiKey = process.env[apiKeyEnvName];
    
    if (!this.apiKey && apiKeyEnvName) {
      console.warn(`[${this.name}] API 密钥未设置：${apiKeyEnvName}`);
    }
  }

  /**
   * 获取认证头
   * 子类根据需要重写
   */
  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) {
      return {};
    }
    
    // 默认使用 Bearer Token
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * 生成视频（抽象方法，子类必须实现）
   */
  abstract generateVideo(
    prompt: string,
    options?: VideoGenerationOptions
  ): Promise<ApiResult<string | VideoInfo>>;

  /**
   * 检查任务状态（抽象方法，子类必须实现）
   */
  abstract checkStatus(taskId: string): Promise<ApiResult<TaskStatusInfo>>;

  /**
   * 下载视频（抽象方法，子类必须实现）
   */
  abstract downloadVideo(
    videoId: string,
    savePath?: string
  ): Promise<ApiResult<VideoInfo>>;

  /**
   * 验证 API 密钥
   * 默认实现：检查密钥是否存在
   * 子类可以重写以进行实际验证
   */
  async validateApiKey(): Promise<ApiResult<boolean>> {
    if (!this.apiKey) {
      return createErrorResult(
        'API 密钥未设置',
        this.name,
        'MISSING_API_KEY'
      );
    }
    
    if (this.apiKey.length < 10) {
      return createErrorResult(
        'API 密钥格式无效',
        this.name,
        'INVALID_API_KEY'
      );
    }
    
    return {
      success: true,
      data: true,
      provider: this.name,
    };
  }

  /**
   * 带重试的执行
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return executeWithRetry(operation, this.config, operationName);
  }

  /**
   * 构建完整的 API URL
   */
  protected buildUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, ''); // 移除末尾的斜杠
    const cleanEndpoint = endpoint.replace(/^\//, ''); // 移除开头的斜杠
    return `${baseUrl}/${cleanEndpoint}`;
  }

  /**
   * 检查提供商是否已配置
   */
  protected isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * 获取请求头（合并认证头和其他头）
   */
  protected getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.getAuthHeaders(),
      ...customHeaders,
    };
  }
}
