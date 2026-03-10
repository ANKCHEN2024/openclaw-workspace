/**
 * 工具函数
 * 提供错误处理、重试机制、HTTP 请求等通用功能
 */

import { ApiResult, ProviderConfig } from '../types';

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的异步操作执行
 * 
 * @param operation 要执行的操作
 * @param config 提供商配置（包含重试参数）
 * @param operationName 操作名称（用于日志）
 * @returns 操作结果
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: ProviderConfig,
  operationName: string
): Promise<T> {
  const maxRetries = config.maxRetries || 3;
  const retryDelay = config.retryDelay || 2000;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 记录错误
      console.warn(
        `[Retry] ${operationName} 失败 (尝试 ${attempt}/${maxRetries + 1}): ${lastError.message}`
      );
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt > maxRetries) {
        break;
      }
      
      // 等待后重试（指数退避）
      const waitTime = retryDelay * Math.pow(1.5, attempt - 1);
      console.log(`[Retry] ${waitTime / 1000}秒后重试...`);
      await delay(waitTime);
    }
  }
  
  // 所有重试都失败
  throw new Error(
    `${operationName} 失败，已重试 ${maxRetries} 次: ${lastError?.message || '未知错误'}`
  );
}

/**
 * 创建成功的 API 响应
 */
export function createSuccessResult<T>(
  data: T,
  provider: string,
  requestId?: string
): ApiResult<T> {
  return {
    success: true,
    data,
    provider,
    requestId,
  };
}

/**
 * 创建失败的 API 响应
 */
export function createErrorResult<T>(
  error: string,
  provider: string,
  errorCode?: string,
  requestId?: string
): ApiResult<T> {
  return {
    success: false,
    error,
    errorCode,
    provider,
    requestId,
  };
}

/**
 * 生成请求 ID（用于追踪）
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 安全的 HTTP 请求（使用 fetch）
 * 
 * @param url 请求 URL
 * @param options fetch 选项
 * @param config 提供商配置
 * @param operationName 操作名称
 */
export async function safeFetch<T>(
  url: string,
  options: RequestInit = {},
  config: ProviderConfig,
  operationName: string
): Promise<ApiResult<T>> {
  const requestId = generateRequestId();
  const timeout = config.timeout || 30000;
  
  try {
    // 创建带超时的控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // 无法解析错误响应
      }
      
      return createErrorResult(
        errorMessage,
        config.name,
        `HTTP_${response.status}`,
        requestId
      );
    }
    
    // 解析响应
    const data = await response.json();
    return createSuccessResult(data as T, config.name, requestId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '请求失败';
    
    // 检查是否是超时错误
    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      return createErrorResult(
        `请求超时（>${timeout / 1000}秒）`,
        config.name,
        'TIMEOUT',
        requestId
      );
    }
    
    return createErrorResult(
      errorMessage,
      config.name,
      'NETWORK_ERROR',
      requestId
    );
  }
}

/**
 * 验证提示词
 * @param prompt 提示词
 * @returns 验证结果
 */
export function validatePrompt(prompt: string): { valid: boolean; message?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, message: '提示词不能为空' };
  }
  
  if (prompt.length > 5000) {
    return { valid: false, message: '提示词过长（最大 5000 字符）' };
  }
  
  return { valid: true };
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 格式化持续时间
 * @param seconds 秒数
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}分${remainingSeconds}秒`
      : `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分' : ''}`;
}

/**
 * 等待直到条件满足
 * @param condition 条件函数
 * @param timeout 超时时间（毫秒）
 * @param interval 检查间隔（毫秒）
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await delay(interval);
  }
  
  return false;
}
