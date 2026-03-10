/**
 * 任务数据模型
 */

const database = require('./database');

class TaskModel {
  constructor() {
    this.db = database.getDb();
  }

  /**
   * 创建任务
   */
  create(taskData) {
    const {
      id,
      user_id,
      type = 'video_generation',
      status = 'pending',
      progress = 0,
      progress_message,
      data,
      result,
      error
    } = taskData;

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, user_id, type, status, progress, progress_message, data, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      user_id,
      type,
      status,
      progress,
      progress_message || null,
      data ? JSON.stringify(data) : null,
      result ? JSON.stringify(result) : null,
      error || null
    );

    return this.findById(id);
  }

  /**
   * 根据ID查找任务
   */
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const task = stmt.get(id);
    
    if (task) {
      if (task.data) task.data = JSON.parse(task.data);
      if (task.result) task.result = JSON.parse(task.result);
    }
    
    return task;
  }

  /**
   * 获取用户的任务列表
   */
  findByUserId(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const stmt = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const tasks = stmt.all(userId, limit, offset);

    return tasks.map(task => {
      if (task.data) task.data = JSON.parse(task.data);
      if (task.result) task.result = JSON.parse(task.result);
      return task;
    });
  }

  /**
   * 获取所有任务
   */
  findAll(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const stmt = this.db.prepare(`
      SELECT * FROM tasks
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const tasks = stmt.all(limit, offset);

    return tasks.map(task => {
      if (task.data) task.data = JSON.parse(task.data);
      if (task.result) task.result = JSON.parse(task.result);
      return task;
    });
  }

  /**
   * 更新任务状态
   */
  updateStatus(id, updates) {
    const allowedFields = ['status', 'progress', 'progress_message', 'result', 'error'];
    
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if ((key === 'data' || key === 'result') && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return null;

    if (updates.status === 'completed' || updates.status === 'failed') {
      fields.push('completed_at = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE tasks SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * 删除任务
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 获取统计信息
   */
  getStats(userId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM tasks
    `;
    
    const params = [];
    
    if (userId) {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }

    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }
}

module.exports = new TaskModel();
