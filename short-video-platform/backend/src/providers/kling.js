/**
 * Kling AI (可灵) API 提供商
 * 快手出品的 AI 视频生成服务
 * 
 * 文档: https://klingai.com/
 */

const BaseProvider = require('./base');
const axios = require('axios');

class KlingProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'Kling AI (可灵)';
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.klingai.com/v1';
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('可灵 AI 需要 API 密钥');
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
      
      const requestBody = {
        prompt: prompt,
        duration: Math.min(duration, 10), // 可灵最大支持 10 秒
        resolution: resolution === '1080p' ? '1080p' : '720p'
      };

      if (image) {
        onProgress?.(20, '处理参考图片...');
        requestBody.image_url = image;
      }

      onProgress?.(30, '提交生成请求...');
      
      // 创建生成任务
      // 注意：这是根据常见 API 设计的模拟实现
      // 请参考可灵官方文档获取准确的 API 调用方式
      const response = await axios.post(
        `${this.baseURL}/videos/generations`,
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
      
      // 轮询任务状态
      const result = await this.pollTaskStatus(taskId, onProgress);
      
      return {
        success: true,
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration || duration,
        taskId: taskId
      };
      
    } catch (error) {
      console.error('可灵生成失败:', error.message);
      throw new Error(`可灵生成失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, onProgress) {
    const maxAttempts = 60;
    const interval = 5000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseURL}/videos/generations/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        );
        
        const task = response.data;
        
        if (task.progress) {
          const progressPercent = 40 + Math.floor(task.progress * 0.5);
          onProgress?.(progressPercent, task.status);
        }
        
        if (task.status === 'completed' || task.status === 'success') {
          onProgress?.(100, '生成完成！');
          return task;
        }
        
        if (task.status === 'failed') {
          throw new Error(task.error || '生成失败');
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
        
      } catch (error) {
        throw error;
      }
    }
    
    throw new Error('生成超时');
  }

  /**
   * 查询任务状态
   */
  async queryTaskStatus(taskId) {
    this.validateConfig();
    
    try {
      const response = await axios.get(
        `${this.baseURL}/videos/generations/${taskId}`,
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

  async cancelTask(taskId) {
    this.validateConfig();
    
    try {
      await axios.post(
        `${this.baseURL}/videos/generations/${taskId}/cancel`,
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
      maxDuration: 10,
      supportedResolutions: ['720p', '1080p'],
      pricing: '¥0.05/秒'
    };
  }
}

module.exports = KlingProvider;
