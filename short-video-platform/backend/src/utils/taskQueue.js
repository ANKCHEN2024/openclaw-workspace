/**
 * 任务队列管理器
 * 负责管理视频生成任务的队列、状态和调度
 */

const { v4: uuidv4 } = require('uuid');
const videoService = require('../services/videoService');
const taskModel = require('../db/taskModel');

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

class TaskQueue {
  constructor() {
    this.processingCount = 0;
    this.maxConcurrent = 2;
    this.startProcessor();
  }

  /**
   * 创建新任务
   */
  createTask(taskData, userId = null) {
    const taskId = uuidv4();
    
    // 保存到数据库
    const task = taskModel.create({
      id: taskId,
      user_id: userId,
      type: 'video_generation',
      status: TaskStatus.PENDING,
      progress: 0,
      progress_message: '等待中...',
      data: taskData
    });
    
    console.log(`[任务队列] 创建新任务：${taskId}`);
    
    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId) {
    return taskModel.findById(taskId);
  }

  /**
   * 获取用户的所有任务
   */
  getUserTasks(userId, options = {}) {
    return taskModel.findByUserId(userId, options);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(options = {}) {
    return taskModel.findAll(options);
  }

  /**
   * 启动队列处理器
   */
  startProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 2000);
  }

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.processingCount >= this.maxConcurrent) {
      return;
    }

    // 获取待处理任务
    const pendingTasks = taskModel.findAll({ status: 'pending', limit: 10 });
    
    for (const task of pendingTasks) {
      if (this.processingCount >= this.maxConcurrent) break;
      
      this.processingCount++;
      
      this.executeTask(task).catch(error => {
        console.error(`[任务队列] 任务执行失败：${task.id}`, error);
        taskModel.updateStatus(task.id, {
          status: TaskStatus.FAILED,
          error: error.message,
          progress: 0
        });
        this.processingCount--;
      });
    }
  }

  /**
   * 执行任务
   */
  async executeTask(task) {
    console.log(`[任务队列] 开始执行任务：${task.id}`);
    
    try {
      // 更新状态为处理中
      taskModel.updateStatus(task.id, {
        status: TaskStatus.PROCESSING,
        progress: 5,
        progress_message: '初始化...'
      });
      
      // 调用视频服务生成视频
      const videoInfo = await videoService.generateVideo(
        task.data,
        task.user_id,
        (progress, message) => {
          taskModel.updateStatus(task.id, {
            progress: progress,
            progress_message: message
          });
        }
      );
      
      // 更新任务为完成状态
      taskModel.updateStatus(task.id, {
        status: TaskStatus.COMPLETED,
        progress: 100,
        progress_message: '完成',
        result: videoInfo
      });
      
      this.processingCount--;
      console.log(`[任务队列] 任务完成：${task.id}`);
      
    } catch (error) {
      console.error(`[任务队列] 任务执行错误：${task.id}`, error);
      taskModel.updateStatus(task.id, {
        status: TaskStatus.FAILED,
        error: error.message,
        progress: 0,
        progress_message: '失败'
      });
      this.processingCount--;
    }
  }

  /**
   * 获取队列统计信息
   */
  getStats(userId = null) {
    return taskModel.getStats(userId);
  }
}

// 导出单例
module.exports = new TaskQueue();
module.exports.TaskStatus = TaskStatus;
