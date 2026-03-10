/**
 * 视频生成路由
 */

const express = require('express');
const router = express.Router();
const taskQueue = require('../utils/taskQueue');
const providerManager = require('../providers');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * POST /api/generate
 * 生成视频
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { prompt, provider, duration, resolution, style, image } = req.body;
    const userId = req.user ? req.user.userId : null;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: '缺少必要参数：prompt（视频描述）'
      });
    }
    
    const availableProviders = providerManager.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: '没有配置可用的 API 提供商'
      });
    }
    
    let selectedProvider = provider;
    if (selectedProvider) {
      if (!availableProviders.includes(selectedProvider)) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: `不支持的提供商：${selectedProvider}`
        });
      }
    } else {
      const realProvider = availableProviders.find(p => p !== 'mock');
      selectedProvider = realProvider || 'mock';
    }
    
    // 创建任务（关联用户ID）
    const task = taskQueue.createTask({
      type: 'video_generation',
      data: {
        prompt,
        provider: selectedProvider,
        duration: duration || 10,
        resolution: resolution || '1080p',
        style: style || 'realistic',
        image
      }
    }, userId);
    
    res.status(202).json({
      success: true,
      message: '视频生成任务已创建',
      data: {
        taskId: task.id,
        status: task.status,
        provider: selectedProvider,
        estimatedTime: selectedProvider === 'mock' ? '30 秒' : '2-5 分钟',
        createdAt: task.created_at
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
