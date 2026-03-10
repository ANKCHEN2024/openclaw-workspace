/**
 * API 集成示例
 * 
 * 这个文件展示了如何接入真实的视频生成 API
 * 实际使用时，需要根据具体提供商的 API 文档进行调整
 */

const axios = require('axios');

class VideoAPI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl;
    this.provider = config.provider;
  }

  /**
   * 生成视频
   * @param {string} prompt - 视频提示词
   * @param {object} options - 生成选项
   * @returns {Promise<object>} - 任务信息
   */
  async generateVideo(prompt, options = {}) {
    const {
      duration = 15,
      resolution = '1080p',
      style = 'realistic'
    } = options;

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/videos/generate`,
        {
          prompt,
          duration,
          resolution,
          style,
          provider: this.provider
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        taskId: response.data.taskId,
        estimatedTime: response.data.estimatedTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 查询任务状态
   * @param {string} taskId - 任务 ID
   * @returns {Promise<object>} - 任务状态
   */
  async getTaskStatus(taskId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status, // pending, processing, completed, failed
        progress: response.data.progress,
        videoUrl: response.data.videoUrl,
        thumbnailUrl: response.data.thumbnailUrl,
        metadata: response.data.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 下载视频
   * @param {string} videoId - 视频 ID
   * @param {string} outputPath - 保存路径
   * @returns {Promise<object>} - 下载结果
   */
  async downloadVideo(videoId, outputPath) {
    const fs = require('fs');
    const path = require('path');

    try {
      // 先获取视频 URL
      const statusResult = await this.getTaskStatus(videoId);
      if (!statusResult.success || !statusResult.videoUrl) {
        throw new Error('视频不可用');
      }

      // 下载视频文件
      const response = await axios.get(statusResult.videoUrl, {
        responseType: 'stream',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      const writer = fs.createWriteStream(outputPath);
      
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          resolve({
            success: true,
            path: outputPath,
            size: fs.statSync(outputPath).size
          });
        });

        writer.on('error', (error) => {
          reject({
            success: false,
            error: error.message
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除视频
   * @param {string} videoId - 视频 ID
   * @returns {Promise<object>} - 删除结果
   */
  async deleteVideo(videoId) {
    try {
      await axios.delete(
        `${this.baseUrl}/v1/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 列出所有视频
   * @param {object} options - 查询选项
   * @returns {Promise<object>} - 视频列表
   */
  async listVideos(options = {}) {
    const {
      status,
      limit = 10,
      page = 1
    } = options;

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/videos`,
        {
          params: { status, limit, page },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        videos: response.data.videos,
        total: response.data.total,
        page: response.data.page
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 获取视频详情
   * @param {string} videoId - 视频 ID
   * @returns {Promise<object>} - 视频详情
   */
  async getVideo(videoId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        video: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// 使用示例
async function example() {
  // 初始化 API 客户端
  const api = new VideoAPI({
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    baseUrl: 'https://api.shortvideo.com',
    provider: 'aliyun'
  });

  // 生成视频
  console.log('生成视频...');
  const generateResult = await api.generateVideo(
    '一只可爱的小猫在草地上玩耍',
    { duration: 30, resolution: '1080p' }
  );
  
  if (generateResult.success) {
    console.log('任务 ID:', generateResult.taskId);
    
    // 轮询任务状态
    let status;
    do {
      await new Promise(resolve => setTimeout(resolve, 3000));
      status = await api.getTaskStatus(generateResult.taskId);
      console.log('状态:', status.status, '进度:', status.progress + '%');
    } while (status.status === 'processing');

    // 下载视频
    if (status.status === 'completed') {
      console.log('下载视频...');
      const downloadResult = await api.downloadVideo(
        generateResult.taskId,
        './output/video.mp4'
      );
      
      if (downloadResult.success) {
        console.log('下载成功:', downloadResult.path);
      }
    }
  }
}

module.exports = VideoAPI;

// 如果直接运行此文件，执行示例
if (require.main === module) {
  example().catch(console.error);
}
