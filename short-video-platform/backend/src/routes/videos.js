/**
 * 视频管理路由
 */

const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const videoModel = require('../db/videoModel');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/videos
 * 获取视频列表
 */
router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { page = 1, limit = 20 } = req.query;
    
    const videos = videoService.getVideoList(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/videos/:id
 * 获取单个视频详情
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;
    
    const video = videoService.getVideo(id, userId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '视频不存在或无权访问'
      });
    }
    
    // 增加浏览次数
    videoModel.update(id, { views: (video.views || 0) + 1 });
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * DELETE /api/videos/:id
 * 删除视频（需要登录）
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const success = videoService.deleteVideo(id, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '视频不存在或无权删除'
      });
    }
    
    res.json({
      success: true,
      message: '视频已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
