/**
 * 商汤科技 - 日日新视频生成 API
 * 文档：https://www.sensetime.com/cn/technology
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface SenseTimeConfig {
  apiKey: string;
  apiSecret: string;
}

export class SenseTimeProvider extends BaseVideoProvider {
  name = 'sensetime';
  displayName = '商汤科技 - 日日新';
  baseUrl = 'https://api.sensetime.com/v1';
  
  private apiKey: string;
  private apiSecret: string;

  constructor(config: SenseTimeConfig) {
    super();
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          api_secret: this.apiSecret
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
      const response = await fetch(`${this.baseUrl}/video/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret
        },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: negativePrompt,
          duration: Math.min(duration, 15), // 商汤支持最长 15 秒
          resolution: this.mapResolution(resolution),
          style: style,
          model_version: 'v2.0'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`商汤 API 错误：${error.message || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.task_id || data.request_id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 120
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`商汤视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/video/status/${taskId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret
        }
      });

      if (!response.ok) {
        throw new APIError(`查询任务失败：${response.statusText}`, response.status);
      }

      const data = await response.json();
      
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'queued': 'pending',
        'processing': 'processing',
        'completed': 'completed',
        'failed': 'failed'
      };

      return {
        taskId,
        status: statusMap[data.status] || 'processing',
        progress: data.progress || 0,
        provider: this.name,
        videoUrl: data.output?.video_url,
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
      '1080p': '1080p',
      '4k': '1080p' // 商汤最高支持 1080p
    };
    return map[resolution] || '720p';
  }

  /**
   * 获取定价信息
   */
  getPricing(): { currency: string; pricePerSecond: number } {
    return {
      currency: 'CNY',
      pricePerSecond: 0.8 // 商汤定位高端，价格稍高
    };
  }
}
