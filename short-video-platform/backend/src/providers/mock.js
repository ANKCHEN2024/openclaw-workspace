/**
 * Mock 提供商（用于测试）
 * 模拟视频生成过程，不调用真实 API
 */

const BaseProvider = require('./base');
const path = require('path');

class MockProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'Mock (测试模式)';
  }

  validateConfig() {
    return true; // Mock 不需要配置
  }

  /**
   * 模拟生成视频
   */
  async generateVideo(params, onProgress) {
    const { prompt, duration = 10 } = params;
    
    console.log(`[MockProvider] 开始生成视频: "${prompt.substring(0, 50)}..."`);
    
    // 模拟进度
    const stages = [
      { progress: 10, message: '准备素材...', delay: 1000 },
      { progress: 25, message: '分析提示词...', delay: 1500 },
      { progress: 40, message: '生成关键帧...', delay: 2000 },
      { progress: 60, message: '渲染视频...', delay: 3000 },
      { progress: 80, message: '后期处理...', delay: 2000 },
      { progress: 95, message: '封装输出...', delay: 1000 },
      { progress: 100, message: '生成完成！', delay: 500 }
    ];
    
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      onProgress?.(stage.progress, stage.message);
    }
    
    // 生成模拟的视频 URL
    // 实际使用时，这里应该返回一个真实的视频文件路径
    const taskId = `mock_${Date.now()}`;
    
    return {
      success: true,
      videoUrl: `/downloads/${taskId}/video.mp4`,
      thumbnailUrl: `/downloads/${taskId}/thumbnail.jpg`,
      duration: duration,
      taskId: taskId
    };
  }

  async queryTaskStatus(taskId) {
    return {
      status: 'completed',
      progress: 100,
      videoUrl: `/downloads/${taskId}/video.mp4`,
      error: null
    };
  }

  async cancelTask(taskId) {
    return { success: true };
  }

  getInfo() {
    return {
      name: this.name,
      supportedFeatures: ['text-to-video', 'image-to-video'],
      maxDuration: 60,
      supportedResolutions: ['720p', '1080p'],
      pricing: '免费（测试模式）'
    };
  }
}

module.exports = MockProvider;
