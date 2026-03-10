/**
 * 阿里云 - 通义万相视频生成 API
 * 文档：https://help.aliyun.com/zh/dashscope/developer-reference/api-details
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface AliyunConfig {
  apiKey: string;
  region?: string;
}

export class AliyunProvider extends BaseVideoProvider {
  name = 'aliyun';
  displayName = '阿里云 - 通义万相';
  baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  
  private apiKey: string;
  private region: string;

  constructor(config: AliyunConfig) {
    super();
    this.apiKey = config.apiKey;
    this.region = config.region || 'cn-shanghai';
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: { prompt: 'test' }
        })
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成视频（文本生成视频）
   */
  async generateVideo(prompt: string, options: VideoGenerateOptions = {}): Promise<VideoGenerateResult> {
    const {
      duration = 5,
      resolution = '720p',
      style = 'realistic',
      negativePrompt
    } = options;

    try {
      // 调用通义万相视频生成 API
      const response = await fetch(`${this.baseUrl}/services/aigc/video-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'wanx-video-v1',
          input: {
            prompt: prompt,
            negative_prompt: negativePrompt
          },
          parameters: {
            duration: Math.min(duration, 10), // 阿里云支持最长 10 秒
            resolution: this.mapResolution(resolution),
            style: style
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`阿里云 API 错误：${error.message || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.output?.task_id || data.request_id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 60 // 预估 60 秒完成
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`阿里云视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new APIError(`查询任务失败：${response.statusText}`, response.status);
      }

      const data = await response.json();
      
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'PENDING': 'pending',
        'RUNNING': 'processing',
        'SUCCEEDED': 'completed',
        'FAILED': 'failed'
      };

      return {
        taskId,
        status: statusMap[data.output?.task_status] || 'processing',
        progress: data.output?.task_metrics?.TOTAL || 0,
        provider: this.name,
        videoUrl: data.output?.video_url,
        errorMessage: data.output?.message
      };
    } catch (error) {
      throw new APIError(`检查任务状态失败：${error.message}`);
    }
  }

  /**
   * 下载视频
   */
  async downloadVideo(videoUrl: string, outputPath: string): Promise<string> {
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    
    const fs = await import('fs');
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    return outputPath;
  }

  /**
   * 映射分辨率
   */
  private mapResolution(resolution: string): string {
    const map: Record<string, string> = {
      '480p': '480p',
      '720p': '720p',
      '1080p': '1080p',
      '4k': '1080p' // 阿里云最高支持 1080p
    };
    return map[resolution] || '720p';
  }

  /**
   * 获取定价信息
   */
  getPricing(): { currency: string; pricePerSecond: number } {
    return {
      currency: 'CNY',
      pricePerSecond: 0.5 // 约 0.5 元/秒
    };
  }
}
