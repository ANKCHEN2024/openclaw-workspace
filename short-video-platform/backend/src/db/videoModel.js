/**
 * 视频数据模型
 */

const database = require('./database');

class VideoModel {
  constructor() {
    this.db = database.getDb();
  }

  /**
   * 创建视频记录
   */
  create(videoData) {
    const {
      id,
      task_id,
      user_id,
      title,
      prompt,
      provider,
      duration,
      resolution,
      style,
      video_url,
      thumbnail_url,
      local_path,
      file_size,
      status = 'completed'
    } = videoData;

    const stmt = this.db.prepare(`
      INSERT INTO videos (
        id, task_id, user_id, title, prompt, provider, duration, 
        resolution, style, video_url, thumbnail_url, local_path, 
        file_size, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, task_id, user_id, title, prompt, provider, duration,
      resolution, style, video_url, thumbnail_url, local_path,
      file_size, status
    );

    return this.findById(id);
  }

  /**
   * 根据ID查找视频
   */
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 获取用户的视频列表
   */
  findByUserId(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const stmt = this.db.prepare(`
      SELECT * FROM videos 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    return stmt.all(userId, limit, offset);
  }

  /**
   * 更新视频
   */
  update(id, updates) {
    const allowedFields = [
      'title', 'video_url', 'thumbnail_url', 'local_path',
      'file_size', 'status', 'views'
    ];
    
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE videos SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * 删除视频
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM videos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 获取用户视频统计
   */
  getUserStats(userId) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(file_size) as total_size,
        SUM(views) as total_views
      FROM videos 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }
}

module.exports = new VideoModel();
