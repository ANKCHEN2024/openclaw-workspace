/**
 * SQLite 数据库管理
 * 使用 better-sqlite3 进行同步操作
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'shortvideo.db');

// 确保数据目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

class DatabaseManager {
  constructor() {
    this.db = null;
    this.init();
  }

  /**
   * 初始化数据库
   */
  init() {
    try {
      this.db = new Database(DB_PATH);
      console.log('[Database] 数据库连接成功');
      
      // 启用外键
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      // 创建表
      this.createTables();
      
    } catch (error) {
      console.error('[Database] 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据表
   */
  createTables() {
    // 用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 迁移：添加 is_admin 字段（如果表已存在）
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // 任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        type TEXT NOT NULL DEFAULT 'video_generation',
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        progress_message TEXT,
        data TEXT,
        result TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 视频表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        user_id INTEGER,
        title TEXT,
        prompt TEXT NOT NULL,
        provider TEXT,
        duration INTEGER,
        resolution TEXT,
        style TEXT,
        video_url TEXT,
        thumbnail_url TEXT,
        local_path TEXT,
        file_size INTEGER,
        status TEXT DEFAULT 'completed',
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
      CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
    `);

    console.log('[Database] 数据表创建完成');
  }

  /**
   * 获取数据库实例
   */
  getDb() {
    return this.db;
  }

  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('[Database] 数据库连接已关闭');
    }
  }
}

// 导出单例
module.exports = new DatabaseManager();
