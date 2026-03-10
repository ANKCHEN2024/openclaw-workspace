/**
 * 管理员路由
 * 提供管理员专属功能
 */

const express = require('express');
const router = express.Router();
const userModel = require('../db/userModel');
const videoModel = require('../db/videoModel');
const taskModel = require('../db/taskModel');
const { requireAdmin } = require('../middleware/admin');

// 所有路由都需要管理员权限
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * 管理仪表盘数据
 */
router.get('/dashboard', (req, res) => {
  try {
    // 获取统计数据
    const userStats = { count: 0 }; // 简化处理
    const videoStats = videoModel.getGlobalStats ? videoModel.getGlobalStats() : { total_videos: 0 };
    const taskStats = taskModel.getStats ? taskModel.getStats() : { total: 0 };
    
    res.json({
      success: true,
      data: {
        users: userStats,
        videos: videoStats,
        tasks: taskStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users
 * 获取所有用户列表
 */
router.get('/users', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const db = require('../db/database').getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const users = db.prepare(`
      SELECT id, username, email, is_admin, avatar_url, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total.count,
          pages: Math.ceil(total.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/videos
 * 获取所有视频（管理员视角）
 */
router.get('/videos', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const videos = videoModel.findAll({
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
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/tasks
 * 获取所有任务（管理员视角）
 */
router.get('/tasks', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const tasks = taskModel.findAll({
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 不能删除自己
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_DELETE_SELF',
        message: '不能删除自己的账号'
      });
    }
    
    const success = userModel.delete(parseInt(id));
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/videos/:id
 * 删除任何视频（管理员权限）
 */
router.delete('/videos/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const video = videoModel.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '视频不存在'
      });
    }
    
    // 删除本地文件
    const fs = require('fs');
    const path = require('path');
    const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');
    const taskDir = path.join(DOWNLOADS_DIR, id);
    
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }
    
    // 删除记录
    videoModel.delete(id);
    
    res.json({
      success: true,
      message: '视频已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
