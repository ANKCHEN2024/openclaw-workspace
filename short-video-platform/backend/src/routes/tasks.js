/**
 * 任务路由
 */

const express = require('express');
const router = express.Router();
const taskQueue = require('../utils/taskQueue');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/tasks
 * 获取任务列表
 */
router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { page = 1, limit = 20 } = req.query;
    
    let tasks;
    if (userId) {
      tasks = taskQueue.getUserTasks(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } else {
      tasks = taskQueue.getAllTasks({
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }
    
    res.json({
      success: true,
      data: tasks
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
 * GET /api/tasks/:id
 * 获取任务状态
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;
    
    const task = taskQueue.getTask(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'TASK_NOT_FOUND',
        message: '任务不存在'
      });
    }
    
    // 检查权限
    if (task.user_id && task.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: '无权访问此任务'
      });
    }
    
    res.json({
      success: true,
      data: task
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
 * GET /api/tasks/stats/overview
 * 获取任务统计
 */
router.get('/stats/overview', authenticate, (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const stats = taskQueue.getStats(userId);
    
    res.json({
      success: true,
      data: stats
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
