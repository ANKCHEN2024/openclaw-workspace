/**
 * MiniMax - 海螺 AI 视频生成 API
 * 文档：https://api.minimax.chat/
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface MiniMaxConfig {
  apiKey: string;
  groupId?: string;
}

export class MiniMaxProvider extends BaseVideoProvider {
  name = 'minimax';
  displayName = 'MiniMax - 海螺 AI';
  baseUrl = 'https://api.minimax.chat/v1';
  
  private apiKey: string;
  private groupId: string;

  constructor(config: MiniMaxConfig) {
    super();
    this.apiKey = config.apiKey;
    this.groupId = config.groupId || '';
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
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
      const response = await fetch(`${this.baseUrl}/video/text2video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: negativePrompt,
          duration: Math.min(duration, 10),
          resolution: this.mapResolution(resolution),
          style: style,
          model: 'hailuo-video-v1',
          seed: options.seed || Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`MiniMax API 错误：${error.message || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.task_id || data.request_id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 80
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`MiniMax 视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/video/task/${taskId}`, {
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
        'submitted': 'pending',
        'running': 'processing',
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
      pricePerSecond: 0.35 // 性价比高
    };
  }
}
