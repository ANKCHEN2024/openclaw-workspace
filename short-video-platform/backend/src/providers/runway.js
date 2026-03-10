/**
 * Runway ML API 提供商
 * 支持文本生成视频和图片生成视频
 * 
 * 文档: https://dev.runwayml.com/docs
 */

const BaseProvider = require('./base');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RunwayProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'Runway ML';
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.runwayml.com/v1';
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('Runway ML 需要 API 密钥');
    }
    return true;
  }

  /**
   * 生成视频
   */
  async generateVideo(params, onProgress) {
    this.validateConfig();
    
    const { prompt, image, duration = 10, resolution = '1080p' } = params;
    
    try {
      onProgress?.(10, '正在创建任务...');
      
      // 准备请求体
      const requestBody = {
        prompt: prompt,
        duration: Math.min(duration, 16), // Runway 最大支持 16 秒
        ratio: resolution === '1080p' ? '1920:1080' : '1280:720'
      };

      // 如果有参考图片，需要上传到 Runway
      if (image) {
        onProgress?.(20, '上传参考图片...');
        // 这里简化处理，实际应该上传到 Runway 的图片服务
        requestBody.image_url = image;
      }

      onProgress?.(30, '提交生成请求...');
      
      // 创建生成任务
      // 注意：这是模拟实现，实际的 Runway API 调用方式可能不同
      // 请参考官方文档：https://dev.runwayml.com/docs
      const response = await axios.post(
        `${this.baseURL}/text-to-video`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const taskId = response.data.id;
      
      onProgress?.(40, '等待生成完成...');
      
      // 轮询任务状态直到完成
      const result = await this.pollTaskStatus(taskId, onProgress);
      
      return {
        success: true,
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        taskId: taskId
      };
      
    } catch (error) {
      console.error('Runway 生成失败:', error.message);
      throw new Error(`Runway 生成失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, onProgress) {
    const maxAttempts = 60; // 最多轮询 60 次（约 5 分钟）
    const interval = 5000; // 每 5 秒检查一次
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseURL}/tasks/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        );
        
        const task = response.data;
        
        // 更新进度
        if (task.progress) {
          const progressPercent = 40 + Math.floor(task.progress * 0.5); // 40-90%
          onProgress?.(progressPercent, task.status);
        }
        
        if (task.status === 'completed') {
          onProgress?.(100, '生成完成！');
          return task;
        }
        
        if (task.status === 'failed') {
          throw new Error(task.error || '生成失败');
        }
        
        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));
        
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('任务不存在');
        }
        throw error;
      }
    }
    
    throw new Error('生成超时，请稍后查询结果');
  }

  /**
   * 查询任务状态
   */
  async queryTaskStatus(taskId) {
    this.validateConfig();
    
    try {
      const response = await axios.get(
        `${this.baseURL}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return {
        status: response.data.status,
        progress: response.data.progress,
        videoUrl: response.data.video_url,
        error: response.data.error
      };
    } catch (error) {
      throw new Error(`查询失败: ${error.message}`);
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId) {
    this.validateConfig();
    
    try {
      await axios.post(
        `${this.baseURL}/tasks/${taskId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      throw new Error(`取消失败: ${error.message}`);
    }
  }

  getInfo() {
    return {
      name: this.name,
      supportedFeatures: ['text-to-video', 'image-to-video'],
      maxDuration: 16,
      supportedResolutions: ['720p', '1080p'],
      pricing: '$0.05/秒'
    };
  }
}

module.exports = RunwayProvider;
