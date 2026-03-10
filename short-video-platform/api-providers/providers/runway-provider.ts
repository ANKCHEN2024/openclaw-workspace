/**
 * Runway ML API 提供商
 * 
 * Runway ML 是专业的 AI 视频生成平台
 * 文档：https://docs.runwayml.com/
 * 
 * 主要功能：
 * - Gen-2: 文本到视频生成
 * - 图像到视频
 * - 视频风格转换
 */

import { BaseVideoProvider } from './base-provider';
import { VideoGenerationOptions, ApiResult, TaskStatusInfo, VideoInfo, TaskStatus } from '../types';
import { providerConfigs } from '../config/providers.config';
import { validatePrompt, safeFetch, createErrorResult, generateRequestId } from '../utils';

/**
 * Runway ML 视频提供商
 */
export class RunwayProvider extends BaseVideoProvider {
  readonly name = 'Runway ML';

  constructor() {
    super(providerConfigs.runway);
  }

  /**
   * 生成视频
   * 
   * @param prompt 文本提示词
   * @param options 生成选项
   * @returns 任务 ID
   */
  async generateVideo(
    prompt: string,
    options?: VideoGenerationOptions
  ): Promise<ApiResult<string | VideoInfo>> {
    // 验证提示词
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      return createErrorResult(validation.message!, this.name, 'INVALID_PROMPT');
    }

    // 检查 API 密钥
    if (!this.isConfigured()) {
      return createErrorResult('API 密钥未配置', this.name, 'MISSING_API_KEY');
    }

    try {
      // 构建请求体
      const requestBody = this.buildGenerationRequest(prompt, options);
      
      // 发送请求
      const result = await this.executeWithRetry(
        async () => {
          return await safeFetch(
            this.buildUrl('/generations'),
            {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify(requestBody),
            },
            this.config,
            'generateVideo'
          );
        },
        '生成视频'
      );

      if (!result.success) {
        return result;
      }

      // 解析响应（根据 Runway API 实际响应格式调整）
      const responseData = result.data as any;
      const taskId = responseData.id || responseData.task_id;

      if (!taskId) {
        return createErrorResult(
          '无法从响应中获取任务 ID',
          this.name,
          'INVALID_RESPONSE'
        );
      }

      return {
        success: true,
        data: taskId,
        provider: this.name,
        requestId: result.requestId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成视频失败';
      return createErrorResult(errorMessage, this.name, 'GENERATION_FAILED');
    }
  }

  /**
   * 检查任务状态
   * 
   * @param taskId 任务 ID
   * @returns 任务状态信息
   */
  async checkStatus(taskId: string): Promise<ApiResult<TaskStatusInfo>> {
    if (!taskId) {
      return createErrorResult('任务 ID 不能为空', this.name, 'INVALID_TASK_ID');
    }

    if (!this.isConfigured()) {
      return createErrorResult('API 密钥未配置', this.name, 'MISSING_API_KEY');
    }

    try {
      const result = await this.executeWithRetry(
        async () => {
          return await safeFetch(
            this.buildUrl(`/generations/${taskId}`),
            {
              method: 'GET',
              headers: this.getHeaders(),
            },
            this.config,
            'checkStatus'
          );
        },
        '检查状态'
      );

      if (!result.success) {
        return result as ApiResult<TaskStatusInfo>;
      }

      // 解析响应
      const responseData = result.data as any;
      const status = this.mapStatus(responseData.status);

      const statusInfo: TaskStatusInfo = {
        taskId,
        status,
        progress: responseData.progress || 0,
        message: responseData.message || this.getStatusMessage(status),
        createdAt: responseData.created_at ? new Date(responseData.created_at) : undefined,
        updatedAt: responseData.updated_at ? new Date(responseData.updated_at) : undefined,
      };

      return {
        success: true,
        data: statusInfo,
        provider: this.name,
        requestId: result.requestId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查状态失败';
      return createErrorResult(errorMessage, this.name, 'STATUS_CHECK_FAILED');
    }
  }

  /**
   * 下载视频
   * 
   * @param videoId 视频 ID
   * @param savePath 保存路径（可选）
   * @returns 视频信息
   */
  async downloadVideo(
    videoId: string,
    savePath?: string
  ): Promise<ApiResult<VideoInfo>> {
    if (!videoId) {
      return createErrorResult('视频 ID 不能为空', this.name, 'INVALID_VIDEO_ID');
    }

    if (!this.isConfigured()) {
      return createErrorResult('API 密钥未配置', this.name, 'MISSING_API_KEY');
    }

    try {
      // 首先获取视频信息
      const result = await this.executeWithRetry(
        async () => {
          return await safeFetch(
            this.buildUrl(`/videos/${videoId}`),
            {
              method: 'GET',
              headers: this.getHeaders(),
            },
            this.config,
            'getVideoInfo'
          );
        },
        '获取视频信息'
      );

      if (!result.success) {
        return result as ApiResult<VideoInfo>;
      }

      // 解析响应
      const responseData = result.data as any;
      
      const videoInfo: VideoInfo = {
        videoId,
        downloadUrl: responseData.url || responseData.download_url,
        previewUrl: responseData.preview_url,
        duration: responseData.duration || 4,
        resolution: responseData.resolution || '1080p',
        fileSize: responseData.file_size,
        format: responseData.format || 'mp4',
        createdAt: responseData.created_at ? new Date(responseData.created_at) : undefined,
      };

      // 如果需要保存到本地
      if (savePath) {
        await this.saveVideo(videoInfo.downloadUrl, savePath);
      }

      return {
        success: true,
        data: videoInfo,
        provider: this.name,
        requestId: result.requestId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '下载视频失败';
      return createErrorResult(errorMessage, this.name, 'DOWNLOAD_FAILED');
    }
  }

  /**
   * 构建生成请求体
   */
  private buildGenerationRequest(
    prompt: string,
    options?: VideoGenerationOptions
  ): Record<string, any> {
    const defaultOptions = this.config.extra || {};
    
    return {
      prompt,
      model: options?.extra?.model || defaultOptions.defaultModel || 'gen2',
      duration: options?.duration || defaultOptions.defaultDuration || 4,
      resolution: options?.resolution || '1080p',
      seed: options?.seed,
      style: options?.style,
      negative_prompt: options?.negativePrompt,
      ...options?.extra,
    };
  }

  /**
   * 映射 API 状态到统一状态
   */
  private mapStatus(apiStatus: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      'queued': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
    };
    
    return statusMap[apiStatus.toLowerCase()] || 'pending';
  }

  /**
   * 获取状态消息
   */
  private getStatusMessage(status: TaskStatus): string {
    const messages: Record<TaskStatus, string> = {
      'pending': '任务正在排队等待',
      'processing': '视频正在生成中',
      'completed': '视频生成完成',
      'failed': '视频生成失败',
      'cancelled': '任务已取消',
    };
    
    return messages[status];
  }

  /**
   * 保存视频到本地
   */
  private async saveVideo(url: string, savePath: string): Promise<void> {
    // 这里可以使用 Node.js 的 fs 模块或 download 库
    // 由于是示例实现，暂时只记录日志
    console.log(`[Runway] 视频将保存到：${savePath}`);
    console.log(`[Runway] 下载 URL: ${url}`);
    
    // 实际实现可以使用：
    // import { writeFileSync } from 'fs';
    // import { get } from 'https';
    // 或者使用 axios、node-fetch 等库
  }
}
