/**
 * 阿里云 - 通义万相 API 提供商
 * 
 * 文档: https://help.aliyun.com/document_detail/2587491.html
 */

const BaseProvider = require('./base');
const axios = require('axios');

class AliyunProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = '阿里云 - 通义万相';
    this.apiKey = config.apiKey;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1';
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('阿里云需要 API 密钥 (DashScope)');
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
      
      // 通义万相视频生成 API
      // 注意：这是根据阿里云文档设计的实现
      // 请参考 https://help.aliyun.com/document_detail/2587491.html 获取最新信息
      
      const requestBody = {
        model: 'wanx-video-generation',
        input: {
          prompt: prompt,
          // 通义万相支持 5 秒视频
          duration: Math.min(duration, 5),
          resolution: resolution === '1080p' ? '1080P' : '720P'
        }
      };

      if (image) {
        onProgress?.(20, '处理参考图片...');
        requestBody.input.image_url = image;
      }

      onProgress?.(30, '提交生成请求...');
      
      // 提交异步任务
      const response = await axios.post(
        `${this.baseURL}/services/aigc/video-generation/generation`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable'  // 启用异步模式
          },
          timeout: 30000
        }
      );

      const taskId = response.data.output?.task_id;
      
      if (!taskId) {
        throw new Error('创建任务失败：未返回 task_id');
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
      console.error('阿里云生成失败:', error.message);
      throw new Error(`阿里云生成失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, onProgress) {
    const maxAttempts = 120; // 最多轮询 10 分钟
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
        
        const task = response.data.output;
        const status = task?.task_status;
        
        // 更新进度
        if (task?.progress) {
          const progressPercent = 40 + Math.floor(task.progress * 0.5);
          onProgress?.(progressPercent, `生成中... ${task.progress}%`);
        }
        
        if (status === 'SUCCEEDED') {
          onProgress?.(100, '生成完成！');
          return {
            video_url: task?.video_url || task?.results?.[0]?.url,
            thumbnail_url: task?.thumbnail_url,
            duration: task?.duration
          };
        }
        
        if (status === 'FAILED') {
          throw new Error(task?.message || '生成失败');
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
      
      const task = response.data.output;
      
      return {
        status: task?.task_status?.toLowerCase(),
        progress: task?.progress,
        videoUrl: task?.video_url,
        error: task?.message
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
      maxDuration: 5,
      supportedResolutions: ['720p', '1080p'],
      pricing: '¥0.5/秒',
      features: ['中文提示词优化', '高质量生成']
    };
  }
}

module.exports = AliyunProvider;
