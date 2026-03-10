/**
 * 百度智能云 - 文心一格视频生成 API
 * 文档：https://cloud.baidu.com/doc/WENXINWORKSHOP
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';

export interface BaiduConfig {
  apiKey: string;
  secretKey: string;
}

export class BaiduProvider extends BaseVideoProvider {
  name = 'baidu';
  displayName = '百度智能云 - 文心一格';
  baseUrl = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1';
  
  private apiKey: string;
  private secretKey: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: BaiduConfig) {
    super();
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`
    );

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000; // 提前 5 分钟刷新

    return this.accessToken;
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
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
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.baseUrl}/wenxinvideo/v1/text2video?access_token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negativePrompt,
            duration: Math.min(duration, 10),
            resolution: this.mapResolution(resolution),
            style: style,
            seed: options.seed || Math.floor(Math.random() * 1000000)
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(`百度 API 错误：${error.error_msg || response.statusText}`, response.status);
      }

      const data = await response.json();
      
      return {
        taskId: data.task_id || data.id,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 90
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`百度视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.baseUrl}/wenxinvideo/v1/task/${taskId}?access_token=${token}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new APIError(`查询任务失败：${response.statusText}`, response.status);
      }

      const data = await response.json();
      
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'RUNNING': 'processing',
        'SUCCESS': 'completed',
        'FAILED': 'failed',
        'PENDING': 'pending'
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
      pricePerSecond: 0.45
    };
  }
}
