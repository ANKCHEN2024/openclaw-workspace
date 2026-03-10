/**
 * Stable Video Diffusion（SVD）本地部署提供商
 * 
 * Stability AI 的开源视频生成模型
 * 文档：https://github.com/Stability-AI/generative-models
 * 
 * 部署说明：
 * 1. 需要本地部署 SVD 模型（使用 ComfyUI、Automatic1111 或独立 API 服务）
 * 2. 默认地址：http://localhost:7860（可根据实际部署修改）
 * 3. 需要 GPU 支持（推荐 NVIDIA GPU，8GB+ 显存）
 * 
 * 主要功能：
 * - 图像到视频生成（SVD 主要支持 img2vid）
 * - 本地运行，无 API 费用
 * - 可自定义模型参数
 */

import { BaseVideoProvider } from './base-provider';
import { VideoGenerationOptions, ApiResult, TaskStatusInfo, VideoInfo, TaskStatus } from '../types';
import { providerConfigs } from '../config/providers.config';
import { validatePrompt, safeFetch, createErrorResult, delay } from '../utils';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * SVD 本地部署视频提供商
 */
export class SVDProvider extends BaseVideoProvider {
  readonly name = 'Stable Video Diffusion';

  // 本地任务存储
  private localTasks: Map<string, LocalTaskInfo> = new Map();

  constructor() {
    super(providerConfigs.svd);
  }

  /**
   * 生成视频
   * 
   * 注意：SVD 主要是图像到视频模型
   * 如果只提供文本提示，需要先使用文生图模型生成图像
   * 
   * @param prompt 文本提示词（或图像路径）
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

    // 检查服务是否可用
    if (!await this.isServiceAvailable()) {
      return createErrorResult(
        'SVD 服务不可用，请确保本地服务已启动',
        this.name,
        'SERVICE_UNAVAILABLE'
      );
    }

    try {
      // 生成任务 ID
      const taskId = this.generateLocalTaskId();
      
      // 构建请求体
      const requestBody = this.buildGenerationRequest(prompt, options);
      
      // 创建本地任务记录
      this.localTasks.set(taskId, {
        taskId,
        status: 'pending',
        progress: 0,
        prompt,
        options: options || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 发送请求到本地服务
      const result = await this.executeWithRetry(
        async () => {
          return await safeFetch(
            this.buildUrl('/sdapi/v1/txt2vid'),  // 或 /sdapi/v1/img2vid
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
        // 更新任务状态为失败
        this.updateLocalTask(taskId, { status: 'failed', message: result.error });
        return result;
      }

      // 解析响应
      const responseData = result.data as any;
      
      // SVD 可能直接返回视频数据或任务 ID
      if (responseData.video || responseData.output) {
        // 直接返回视频
        const videoInfo = await this.processVideoData(taskId, responseData);
        this.updateLocalTask(taskId, { status: 'completed', videoInfo });
        
        return {
          success: true,
          data: videoInfo,
          provider: this.name,
          requestId: result.requestId,
        };
      } else if (responseData.task_id) {
        // 异步任务
        this.updateLocalTask(taskId, { 
          status: 'processing',
          remoteTaskId: responseData.task_id 
        });
        
        return {
          success: true,
          data: taskId,
          provider: this.name,
          requestId: result.requestId,
        };
      } else {
        // 假设是异步任务，使用生成的 taskId
        this.updateLocalTask(taskId, { status: 'processing' });
        
        return {
          success: true,
          data: taskId,
          provider: this.name,
          requestId: result.requestId,
        };
      }

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

    // 检查本地任务记录
    const localTask = this.localTasks.get(taskId);
    if (!localTask) {
      return createErrorResult('未找到任务', this.name, 'TASK_NOT_FOUND');
    }

    try {
      // 如果有远程任务 ID，检查远程状态
      if (localTask.remoteTaskId) {
        const remoteResult = await safeFetch(
          this.buildUrl(`/sdapi/v1/tasks/${localTask.remoteTaskId}`),
          {
            method: 'GET',
            headers: this.getHeaders(),
          },
          this.config,
          'checkRemoteStatus'
        );

        if (remoteResult.success) {
          const remoteData = remoteResult.data as any;
          const status = this.mapStatus(remoteData.status);
          
          this.updateLocalTask(taskId, {
            status,
            progress: remoteData.progress,
            message: remoteData.message,
          });
        }
      }

      // 返回本地任务状态
      const statusInfo: TaskStatusInfo = {
        taskId,
        status: localTask.status,
        progress: localTask.progress,
        message: localTask.message,
        createdAt: localTask.createdAt,
        updatedAt: localTask.updatedAt,
      };

      return {
        success: true,
        data: statusInfo,
        provider: this.name,
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

    // 检查本地任务记录
    const localTask = this.localTasks.get(videoId);
    if (!localTask) {
      return createErrorResult('未找到任务', this.name, 'TASK_NOT_FOUND');
    }

    if (localTask.status !== 'completed') {
      return createErrorResult(
        '视频尚未生成完成',
        this.name,
        'VIDEO_NOT_READY'
      );
    }

    // 如果已经有视频信息，直接返回
    if (localTask.videoInfo) {
      return {
        success: true,
        data: localTask.videoInfo,
        provider: this.name,
      };
    }

    try {
      // 从本地服务获取视频
      const result = await safeFetch(
        this.buildUrl(`/sdapi/v1/videos/${videoId}`),
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
        this.config,
        'getVideo'
      );

      if (!result.success) {
        return result as ApiResult<VideoInfo>;
      }

      const responseData = result.data as any;
      const videoInfo = await this.processVideoData(videoId, responseData, savePath);
      
      // 更新本地任务
      this.updateLocalTask(videoId, { videoInfo });

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
    
    // 检查是否是图像路径（SVD 主要是 img2vid）
    const isImagePath = prompt.startsWith('/') || prompt.startsWith('./') || prompt.includes('.png') || prompt.includes('.jpg');
    
    if (isImagePath) {
      // 图像到视频
      return {
        init_image: prompt,
        video_length: options?.duration || 25,  // 帧数
        motion_bucket_id: options?.extra?.motionBucket || defaultOptions.defaultMotionBucket || 127,
        fps: options?.fps || 6,
        min_cfg: options?.extra?.minCfg || 1.0,
        max_cfg: options?.extra?.maxCfg || 2.5,
        seed: options?.seed || -1,
        ...options?.extra,
      };
    } else {
      // 文本到视频（需要支持 txt2vid 的服务）
      return {
        prompt,
        negative_prompt: options?.negativePrompt || 'worst quality, low quality, blurry',
        video_length: options?.duration || 25,
        frames: options?.extra?.frames || defaultOptions.defaultFrames || 25,
        motion_bucket_id: options?.extra?.motionBucket || defaultOptions.defaultMotionBucket || 127,
        fps: options?.fps || 6,
        seed: options?.seed || -1,
        ...options?.extra,
      };
    }
  }

  /**
   * 处理视频数据
   */
  private async processVideoData(
    taskId: string,
    responseData: any,
    savePath?: string
  ): Promise<VideoInfo> {
    // 提取视频数据
    const videoData = responseData.video || responseData.output || responseData.result;
    const videoUrl = responseData.url || responseData.video_url;
    
    // 确定保存路径
    const finalSavePath = savePath || this.getDefaultSavePath(taskId);
    
    // 确保目录存在
    const dir = finalSavePath.substring(0, finalSavePath.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // 如果是 base64 数据
    if (videoData && typeof videoData === 'string') {
      const buffer = Buffer.from(videoData, 'base64');
      writeFileSync(finalSavePath, buffer);
    } else if (videoUrl) {
      // 如果是 URL，下载
      // 这里简化处理，实际应该下载
      console.log(`[SVD] 视频 URL: ${videoUrl}`);
    }

    // 构建视频信息
    const videoInfo: VideoInfo = {
      videoId: taskId,
      downloadUrl: videoUrl || `file://${finalSavePath}`,
      previewUrl: responseData.preview_url,
      duration: responseData.duration || 4,
      resolution: responseData.resolution || '720p',
      fileSize: responseData.file_size,
      format: responseData.format || 'mp4',
      createdAt: new Date(),
    };

    return videoInfo;
  }

  /**
   * 获取默认保存路径
   */
  private getDefaultSavePath(taskId: string): string {
    const outputDir = process.env.SVD_OUTPUT_DIR || './output/svd';
    return join(outputDir, `${taskId}.mp4`);
  }

  /**
   * 生成本地任务 ID
   */
  private generateLocalTaskId(): string {
    return `svd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新本地任务
   */
  private updateLocalTask(taskId: string, updates: Partial<LocalTaskInfo>): void {
    const task = this.localTasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      task.updatedAt = new Date();
      this.localTasks.set(taskId, task);
    }
  }

  /**
   * 检查服务是否可用
   */
  private async isServiceAvailable(): Promise<boolean> {
    try {
      const result = await safeFetch(
        this.buildUrl('/sdapi/v1/cmd-flags'),
        {
          method: 'GET',
        },
        this.config,
        'checkService'
      );
      
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * 映射 API 状态到统一状态
   */
  private mapStatus(apiStatus: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      'pending': 'pending',
      'queued': 'pending',
      'running': 'processing',
      'processing': 'processing',
      'completed': 'completed',
      'success': 'completed',
      'done': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'cancelled',
    };
    
    return statusMap[apiStatus?.toLowerCase()] || 'pending';
  }

  /**
   * 验证 API 密钥（本地部署可选）
   */
  async validateApiKey(): Promise<ApiResult<boolean>> {
    // 本地部署不需要 API 密钥
    const isAvailable = await this.isServiceAvailable();
    
    if (isAvailable) {
      return {
        success: true,
        data: true,
        provider: this.name,
      };
    } else {
      return createErrorResult(
        'SVD 服务不可用',
        this.name,
        'SERVICE_UNAVAILABLE'
      );
    }
  }

  /**
   * 清理旧任务（防止内存泄漏）
   */
  cleanupOldTasks(maxAgeHours: number = 24): void {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    for (const [taskId, task] of this.localTasks.entries()) {
      if (now - task.updatedAt.getTime() > maxAgeMs) {
        this.localTasks.delete(taskId);
      }
    }
  }
}

/**
 * 本地任务信息
 */
interface LocalTaskInfo {
  taskId: string;
  status: TaskStatus;
  progress: number;
  prompt: string;
  options: VideoGenerationOptions;
  remoteTaskId?: string;
  videoInfo?: VideoInfo;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}
