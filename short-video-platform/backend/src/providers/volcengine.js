/**
 * 火山引擎 - 即梦 AI API 提供商
 * 
 * 文档: https://www.volcengine.com/docs/
 */

const BaseProvider = require('./base');
const axios = require('axios');

class VolcengineProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = '火山引擎 - 即梦 AI';
    this.apiKey = config.apiKey;
    this.baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('火山引擎需要 API 密钥');
    }
    return true;
  }

  /**
   * 生成视频
   */
  async generateVideo(params, onProgress) {
    this.validateConfig();
    
    const { prompt, image, duration = 5, resolution = '1080p' } = params;
    
    try {
      onProgress?.(10, '正在创建任务...');
      
      const requestBody = {
        model: 'jimeng-video', // 即梦视频生成模型
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        parameters: {
          duration: Math.min(duration, 10),
          resolution: resolution === '1080p' ? '1080p' : '720p'
        }
      };

      if (image) {
        onProgress?.(20, '处理参考图片...');
        requestBody.parameters.image_url = image;
      }

      onProgress?.(30, '提交生成请求...');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // 火山引擎可能使用不同的响应格式
      const taskId = response.data.id || response.data.task_id;
      
      if (!taskId) {
        // 如果是同步返回视频URL
        if (response.data.video_url || response.data.url) {
          onProgress?.(100, '生成完成！');
          return {
            success: true,
            videoUrl: response.data.video_url || response.data.url,
            thumbnailUrl: response.data.thumbnail_url,
            duration: duration,
            taskId: `ve_${Date.now()}`
          };
        }
        throw new Error('创建任务失败');
      }
      
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
      console.error('火山引擎生成失败:', error.message);
      throw new Error(`火山引擎生成失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, onProgress) {
    const maxAttempts = 120;
    const interval = 5000;
    
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
      maxDuration: 10,
      supportedResolutions: ['720p', '1080p'],
      pricing: '¥0.4/秒',
      features: ['速度快', '性价比高']
    };
  }
}

module.exports = VolcengineProvider;
