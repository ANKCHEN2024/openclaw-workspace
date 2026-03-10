/**
 * 视频服务
 * 处理视频生成、下载和存储
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const providerManager = require('../providers');
const videoModel = require('../db/videoModel');

// 下载目录
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');

// 确保下载目录存在
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

class VideoService {
  constructor() {}

  /**
   * 生成视频
   * @param {Object} params - 生成参数
   * @param {number} userId - 用户ID
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} - 视频信息
   */
  async generateVideo(params, userId = null, onProgress) {
    const { prompt, provider: providerId, image, duration, style } = params;
    
    // 选择提供商
    let selectedProvider = providerId;
    const availableProviders = providerManager.getAvailableProviders();
    
    if (!selectedProvider || !availableProviders.includes(selectedProvider)) {
      const realProvider = availableProviders.find(p => p !== 'mock');
      selectedProvider = realProvider || 'mock';
    }

    console.log(`[VideoService] 使用提供商: ${selectedProvider}, 用户: ${userId || '游客'}`);
    
    const provider = providerManager.createProvider(selectedProvider);
    
    // 验证配置
    try {
      provider.validateConfig();
    } catch (error) {
      console.log(`[VideoService] ${selectedProvider} 配置无效，切换到 Mock 模式`);
      const mockProvider = providerManager.createProvider('mock');
      return this.executeGeneration(mockProvider, params, userId, onProgress);
    }
    
    return this.executeGeneration(provider, params, userId, onProgress);
  }

  /**
   * 执行视频生成
   */
  async executeGeneration(provider, params, userId, onProgress) {
    const result = await provider.generateVideo(params, (progress, message) => {
      onProgress?.(progress, message);
    });

    // 如果提供商返回了真实的视频 URL，下载到本地
    if (result.success && result.videoUrl && result.videoUrl.startsWith('http')) {
      console.log('[VideoService] 下载视频到本地...');
      const localPaths = await this.downloadVideo(result.videoUrl, result.taskId);
      result.videoUrl = localPaths.videoUrl;
      result.thumbnailUrl = localPaths.thumbnailUrl;
    }

    // 保存视频信息到数据库
    const videoInfo = {
      id: result.taskId,
      user_id: userId,
      title: params.prompt.substring(0, 100),
      prompt: params.prompt,
      provider: provider.name,
      duration: result.duration,
      resolution: params.resolution || '1080p',
      style: params.style || 'default',
      video_url: result.videoUrl,
      thumbnail_url: result.thumbnailUrl,
      local_path: result.videoUrl.replace('/downloads/', ''),
      status: 'completed'
    };
    
    videoModel.create(videoInfo);
    
    return videoInfo;
  }

  /**
   * 下载视频到本地
   */
  async downloadVideo(videoUrl, taskId) {
    const taskDir = path.join(DOWNLOADS_DIR, taskId);
    
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    const videoPath = path.join(taskDir, 'video.mp4');
    const thumbnailPath = path.join(taskDir, 'thumbnail.jpg');

    try {
      console.log(`[VideoService] 下载视频: ${videoUrl}`);
      const videoResponse = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 120000
      });

      const videoWriter = fs.createWriteStream(videoPath);
      videoResponse.data.pipe(videoWriter);

      await new Promise((resolve, reject) => {
        videoWriter.on('finish', resolve);
        videoWriter.on('error', reject);
      });

      console.log(`[VideoService] 视频已下载: ${videoPath}`);
      
      // 获取文件大小
      const stats = fs.statSync(videoPath);
      
      // 创建占位缩略图
      await this.createPlaceholderThumbnail(thumbnailPath);

      return {
        videoUrl: `/downloads/${taskId}/video.mp4`,
        thumbnailUrl: `/downloads/${taskId}/thumbnail.jpg`,
        localPath: videoPath,
        fileSize: stats.size
      };
      
    } catch (error) {
      console.error('[VideoService] 下载视频失败:', error.message);
      return {
        videoUrl: videoUrl,
        thumbnailUrl: null,
        localPath: null,
        fileSize: 0
      };
    }
  }

  /**
   * 创建占位缩略图
   */
  async createPlaceholderThumbnail(thumbnailPath) {
    const svgContent = `<svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#667eea" text-anchor="middle" dy=".3em">
        🎬 Video
      </text>
    </svg>`;
    
    fs.writeFileSync(thumbnailPath.replace('.jpg', '.svg'), svgContent);
  }

  /**
   * 获取视频列表
   */
  getVideoList(userId = null, options = {}) {
    if (userId) {
      return videoModel.findByUserId(userId, options);
    }
    return videoModel.findAll(options);
  }

  /**
   * 获取单个视频
   */
  getVideo(videoId, userId = null) {
    const video = videoModel.findById(videoId);
    
    if (!video) return null;
    
    // 如果指定了用户ID，检查权限
    if (userId && video.user_id !== userId) {
      return null;
    }
    
    return video;
  }

  /**
   * 删除视频
   */
  deleteVideo(videoId, userId = null) {
    const video = videoModel.findById(videoId);
    if (!video) {
      return false;
    }

    // 检查权限
    if (userId && video.user_id !== userId) {
      return false;
    }

    // 删除本地文件
    const taskDir = path.join(DOWNLOADS_DIR, videoId);
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }

    // 删除记录
    videoModel.delete(videoId);
    
    return true;
  }

  /**
   * 获取用户视频统计
   */
  getUserStats(userId) {
    return videoModel.getUserStats(userId);
  }
}

module.exports = new VideoService();
