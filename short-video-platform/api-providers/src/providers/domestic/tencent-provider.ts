/**
 * 腾讯云 - 混元大模型视频生成 API
 * 文档：https://cloud.tencent.com/document/product/1729
 */

import { BaseVideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoStatus } from '../base-provider';
import { APIError, RetryError } from '../../utils';
import * as crypto from 'crypto';

export interface TencentConfig {
  secretId: string;
  secretKey: string;
  region?: string;
}

export class TencentProvider extends BaseVideoProvider {
  name = 'tencent';
  displayName = '腾讯云 - 混元大模型';
  baseUrl = 'https://hunyuan.tencentcloudapi.com';
  
  private secretId: string;
  private secretKey: string;
  private region: string;

  constructor(config: TencentConfig) {
    super();
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
    this.region = config.region || 'ap-guangzhou';
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.request('DescribeHunyuanVideoGenerationJobs', {});
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
      const params = {
        Prompt: prompt,
        NegativePrompt: negativePrompt || '',
        Duration: Math.min(duration, 10), // 腾讯云支持最长 10 秒
        Resolution: this.mapResolution(resolution),
        Style: style,
        GeneratorType: 'HUNYUAN_VIDEO_STANDARD'
      };

      const response = await this.request('SubmitHunyuanVideoGenerationJob', params);
      const data = await response.json();

      return {
        taskId: data.Response?.JobId,
        status: 'processing',
        provider: this.name,
        createdAt: new Date().toISOString(),
        estimatedTime: 90 // 预估 90 秒完成
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new RetryError(`腾讯云视频生成失败：${error.message}`, 3);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(taskId: string): Promise<VideoStatus> {
    try {
      const response = await this.request('DescribeHunyuanVideoGenerationJob', { JobId: taskId });
      const data = await response.json();

      const job = data.Response;
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'PENDING': 'pending',
        'RUNNING': 'processing',
        'SUCCESS': 'completed',
        'FAILED': 'failed'
      };

      return {
        taskId,
        status: statusMap[job?.JobStatus] || 'processing',
        progress: job?.Progress || 0,
        provider: this.name,
        videoUrl: job?.VideoUrl,
        errorMessage: job?.Message
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
   * 腾讯云 API 签名请求
   */
  private async request(action: string, params: any): Promise<Response> {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];

    const canonicalRequest = [
      'POST',
      '/',
      '',
      'content-type:application/json; charset=utf-8',
      `host:hunyuan.tencentcloudapi.com`,
      '',
      'content-type;host',
      this.hash(JSON.stringify(params))
    ].join('\n');

    const stringToSign = [
      'TC3-HMAC-SHA256',
      timestamp.toString(),
      `${date}/hunyuan/tc3_request`,
      this.hash(canonicalRequest)
    ].join('\n');

    const secretDate = this.hmacSha256(date, 'TC3' + this.secretKey);
    const secretService = this.hmacSha256('hunyuan', secretDate);
    const secretSigning = this.hmacSha256('tc3_request', secretService);
    const signature = this.hmacSha256(stringToSign, secretSigning, 'hex');

    const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/hunyuan/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

    const response = await fetch(`https://${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Host': 'hunyuan.tencentcloudapi.com',
        'X-TC-Action': action,
        'X-TC-Version': '2023-09-01',
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Region': this.region,
        'Authorization': authorization
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(`腾讯云 API 错误：${error.Response?.Error?.Message || response.statusText}`, response.status);
    }

    return response;
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
   * 工具函数：SHA256 哈希
   */
  private hash(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * 工具函数：HMAC-SHA256
   */
  private hmacSha256(message: string, key: string, encoding: 'hex' | 'buffer' = 'buffer'): string | Buffer {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    return encoding === 'hex' ? hmac.digest('hex') : hmac.digest();
  }

  /**
   * 获取定价信息
   */
  getPricing(): { currency: string; pricePerSecond: number } {
    return {
      currency: 'CNY',
      pricePerSecond: 0.6 // 约 0.6 元/秒
    };
  }
}
