/**
 * 腾讯智影 - 智能视频创作平台 API
 * 文档：https://zenvideo.qq.com/
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface TencentZhiYingConfig {
  apiKey: string;
}

export class TencentZhiYingProvider extends BaseVideoProvider {
  name = 'tencent_zhiying';
  displayName = '腾讯智影';
  baseUrl = 'https://api.zenvideo.qq.com/v1';
  
  private apiKey: string;

  constructor(config: TencentZhiYingConfig) {
    super();
    this.apiKey = config.apiKey;
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
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
      const response = await fetch(`${this.baseUrl}/ai/create_video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_prompt: prompt,
          negative_prompt: negativePrompt,
          video_length: Math.min(duration, 10),
          resolution: this.mapResolution(resolution),
          style: style,
          creative_strength: options.creativity || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`腾讯智影 API 错误：${error.message || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.task_id || data.request_id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 100
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`腾讯智影视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/task_status/${taskId}`, {
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
        'pending': 'pending',
        'processing': 'processing',
        'success': 'completed',
        'fail': 'failed'
      };

      return {
        taskId,
        status: statusMap[data.status] || 'processing',
        progress: data.progress || 0,
        provider: this.name,
        videoUrl: data.result?.video_url,
        errorMessage: data.error?.message
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
      '1080p': '1080p'
    };
    return map[resolution] || '720p';
  }

  /**
   * 获取定价信息
   */
  getPricing(): { currency: string; pricePerSecond: number } {
    return {
      currency: 'CNY',
      pricePerSecond: 0.5
    };
  }
}
