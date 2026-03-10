/**
 * API 提供商基类
 * 定义统一的视频生成接口
 */

class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'BaseProvider';
  }

  /**
   * 验证配置是否完整
   */
  validateConfig() {
    throw new Error('子类必须实现 validateConfig 方法');
  }

  /**
   * 生成视频
   * @param {Object} params - 生成参数
   * @param {string} params.prompt - 视频描述
   * @param {string} params.image - 参考图片（可选）
   * @param {number} params.duration - 视频时长
   * @param {string} params.resolution - 分辨率
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} - 生成结果
   */
  async generateVideo(params, onProgress) {
    throw new Error('子类必须实现 generateVideo 方法');
  }

  /**
   * 查询任务状态
   */
  async queryTaskStatus(taskId) {
    throw new Error('子类必须实现 queryTaskStatus 方法');
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId) {
    throw new Error('子类必须实现 cancelTask 方法');
  }

  /**
   * 获取提供商信息
   */
  getInfo() {
    return {
      name: this.name,
      supportedFeatures: ['text-to-video'],
      maxDuration: 30,
      supportedResolutions: ['720p', '1080p']
    };
  }
}

module.exports = BaseProvider;
