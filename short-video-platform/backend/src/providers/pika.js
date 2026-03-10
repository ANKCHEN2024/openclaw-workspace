/**
 * Pika Labs API 提供商
 * 
 * 文档: https://pika.art/
 */

const BaseProvider = require('./base');
const axios = require('axios');

class PikaProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'Pika Labs';
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.pika.art/v1';
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('Pika Labs 需要 API 密钥');
    }
    return true;
  }

  /**
   * 生成视频
   */
  async generateVideo(params, onProgress) {
    this.validateConfig();
    
    const { prompt, image, duration = 3, resolution = '1080p' } = params;
    
    try {
      onProgress?.(10, '正在创建任务...');
      
      // Pika 通常使用较短的时长
      const requestBody = {
        prompt: prompt,
        duration: Math.min(duration, 4), // Pika 通常支持 3-4 秒
        resolution: resolution === '1080p' ? '1080p' : '720p'
      };

      if (image) {
        onProgress?.(20, '处理参考图片...');
        requestBody.image = image;
      }

      onProgress?.(30, '提交生成请求...');
      
      const response = await axios.post(
        `${this.baseURL}/generations`,
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
        videoUrl: result.video?.url || result.video_url,
        thumbnailUrl: result.thumbnail?.url || result.thumbnail_url,
        duration: result.duration || duration,
        taskId: taskId
      };
      
    } catch (error) {
      console.error('Pika 生成失败:', error.message);
      throw new Error(`Pika 生成失败: ${error.response?.data?.message || error.message}`);
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
          `${this.baseURL}/generations/${taskId}`,
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
        
        if (task.status === 'completed' || task.status === 'succeeded') {
          onProgress?.(100, '生成完成！');
          return task;
        }
        
        if (task.status === 'failed' || task.status === 'error') {
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
        `${this.baseURL}/generations/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return {
        status: response.data.status,
        progress: response.data.progress,
        videoUrl: response.data.video?.url,
        error: response.data.error
      };
    } catch (error) {
      throw new Error(`查询失败: ${error.message}`);
    }
  }

  async cancelTask(taskId) {
    this.validateConfig();
    
    try {
      await axios.delete(
        `${this.baseURL}/generations/${taskId}`,
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
      maxDuration: 4,
      supportedResolutions: ['720p', '1080p'],
      pricing: '$0.03/秒',
      features: ['创意强', '风格多样']
    };
  }
}

module.exports = PikaProvider;
