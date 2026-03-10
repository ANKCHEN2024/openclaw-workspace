/**
 * 火山引擎 - 即梦 AI 视频生成 API
 * 文档：https://www.volcengine.com/docs/6822
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface VolcengineConfig {
  apiKey: string;
  accessKey?: string;
  secretKey?: string;
}

export class VolcengineProvider extends BaseVideoProvider {
  name = 'volcengine';
  displayName = '火山引擎 - 即梦 AI';
  baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  
  private apiKey: string;

  constructor(config: VolcengineConfig) {
    super();
    this.apiKey = config.apiKey;
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
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
      // 调用即梦 AI 视频生成 API
      const response = await fetch(`${this.baseUrl}/videos/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dreamina-video-1.0',
          prompt: prompt,
          negative_prompt: negativePrompt,
          duration: Math.min(duration, 10), // 支持最长 10 秒
          resolution: this.mapResolution(resolution),
          style: style,
          seed: options.seed || Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`火山引擎 API 错误：${error.message || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.id || data.request_id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 60 // 预估 60 秒完成
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`火山引擎视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/generations/${taskId}`, {
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
        'succeeded': 'completed',
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
      pricePerSecond: 0.4 // 约 0.4 元/秒
    };
  }
}
