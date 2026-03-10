/**
 * Kling AI（可灵）API 提供商
 * 
 * Kling AI 是快手推出的 AI 视频生成模型
 * 文档：https://platform.klingai.com/
 * 
 * 主要功能：
 * - 文本到视频生成
 * - 图像到视频
 * - 支持多种视频风格
 */

import { BaseVideoProvider } from './base-provider';
import { VideoGenerationOptions, ApiResult, TaskStatusInfo, VideoInfo, TaskStatus } from '../types';
import { providerConfigs } from '../config/providers.config';
import { validatePrompt, safeFetch, createErrorResult } from '../utils';

/**
 * Kling AI 视频提供商
 */
export class KlingProvider extends BaseVideoProvider {
  readonly name = 'Kling AI';

  constructor() {
    super(providerConfigs.kling);
  }

  /**
   * 生成视频
   * 
   * @param prompt 文本提示词（支持中文）
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
            this.buildUrl('/video/generations'),
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

      // 解析响应（根据 Kling API 实际响应格式调整）
      const responseData = result.data as any;
      const taskId = responseData.task_id || responseData.id || responseData.request_id;

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
            this.buildUrl(`/video/tasks/${taskId}`),
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
      const status = this.mapStatus(responseData.task_status);

      const statusInfo: TaskStatusInfo = {
        taskId,
        status,
        progress: responseData.progress || this.estimateProgress(status),
        message: responseData.task_message || this.getStatusMessage(status),
        estimatedTimeRemaining: responseData.estimated_time_remaining,
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
   * @param videoId 视频 ID（任务 ID）
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
      // 获取视频信息（Kling 中视频信息包含在任务信息中）
      const result = await this.executeWithRetry(
        async () => {
          return await safeFetch(
            this.buildUrl(`/video/tasks/${videoId}`),
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
      
      // 检查视频是否已生成
      if (!responseData.video_url && !responseData.result) {
        return createErrorResult(
          '视频尚未生成完成',
          this.name,
          'VIDEO_NOT_READY'
        );
      }

      const videoResult = responseData.result || responseData;
      const downloadUrl = videoResult.video_url || videoResult.download_url;

      const videoInfo: VideoInfo = {
        videoId,
        downloadUrl,
        previewUrl: videoResult.cover_url || videoResult.thumbnail_url,
        duration: videoResult.duration || 5,
        resolution: videoResult.resolution || this.config.extra?.defaultResolution || '720p',
        fileSize: videoResult.file_size,
        format: videoResult.format || 'mp4',
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
    
    // Kling 支持多种生成模式
    const mode = options?.extra?.mode || 'text2video'; // text2video, image2video
    
    const requestBody: Record<string, any> = {
      prompt,
      mode,
      model: options?.extra?.model || defaultOptions.defaultModel || 'kling-v1',
      duration: options?.duration || defaultOptions.defaultDuration || 5,
      resolution: options?.resolution || defaultOptions.defaultResolution || '720p',
      negative_prompt: options?.negativePrompt,
      seed: options?.seed,
    };

    // 如果是图像到视频模式
    if (mode === 'image2video' && options?.extra?.image_url) {
      requestBody.image_url = options.extra.image_url;
    }

    // 风格参数
    if (options?.style) {
      requestBody.style = options.style;
    }

    // 相机控制（Kling 特色功能）
    if (options?.extra?.camera_control) {
      requestBody.camera_control = options.extra.camera_control;
    }

    return requestBody;
  }

  /**
   * 映射 API 状态到统一状态
   */
  private mapStatus(apiStatus: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      'pending': 'pending',
      'queued': 'pending',
      'processing': 'processing',
      'generating': 'processing',
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'cancelled',
    };
    
    return statusMap[apiStatus?.toLowerCase()] || 'pending';
  }

  /**
   * 根据状态估算进度
   */
  private estimateProgress(status: TaskStatus): number {
    const progressMap: Record<TaskStatus, number> = {
      'pending': 5,
      'processing': 50,
      'completed': 100,
      'failed': 0,
      'cancelled': 0,
    };
    
    return progressMap[status] || 0;
  }

  /**
   * 获取状态消息
   */
  private getStatusMessage(status: TaskStatus): string {
    const messages: Record<TaskStatus, string> = {
      'pending': '任务已提交，正在排队等待处理',
      'processing': '视频正在生成中，可灵通常需要 60-120 秒',
      'completed': '视频生成完成！',
      'failed': '视频生成失败，请检查提示词或联系支持',
      'cancelled': '任务已取消',
    };
    
    return messages[status];
  }

  /**
   * 保存视频到本地
   */
  private async saveVideo(url: string, savePath: string): Promise<void> {
    console.log(`[Kling] 视频将保存到：${savePath}`);
    console.log(`[Kling] 下载 URL: ${url}`);
  }

  /**
   * 验证 API 密钥（Kling 特定实现）
   */
  async validateApiKey(): Promise<ApiResult<boolean>> {
    if (!this.apiKey) {
      return createErrorResult('API 密钥未设置', this.name, 'MISSING_API_KEY');
    }

    try {
      // 调用一个简单的 API 来验证密钥
      const result = await safeFetch(
        this.buildUrl('/auth/verify'),
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
        this.config,
        'validateApiKey'
      );

      if (result.success) {
        return {
          success: true,
          data: true,
          provider: this.name,
          requestId: result.requestId,
        };
      } else {
        return createErrorResult(
          result.error || 'API 密钥验证失败',
          this.name,
          result.errorCode || 'VALIDATION_FAILED',
          result.requestId
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '验证失败';
      return createErrorResult(errorMessage, this.name, 'VALIDATION_ERROR');
    }
  }
}
