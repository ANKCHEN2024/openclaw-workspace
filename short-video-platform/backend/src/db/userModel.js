/**
 * 用户数据模型
 */

const database = require('./database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class UserModel {
  constructor() {
    this.db = database.getDb();
  }

  /**
   * 创建用户
   */
  async create(userData) {
    const { username, email, password, avatar_url } = userData;
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, avatar_url)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(username, email, passwordHash, avatar_url || null);
    
    return this.findById(result.lastInsertRowid);
  }

  /**
   * 根据ID查找用户
   */
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 根据用户名查找用户
   */
  findByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  /**
   * 验证密码
   */
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * 更新用户信息
   */
  update(id, updates) {
    const allowedFields = ['username', 'email', 'avatar_url'];
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return null;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * 删除用户
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 获取用户列表（分页）
   */
  findAll(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const stmt = this.db.prepare(`
      SELECT id, username, email, avatar_url, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset);
  }
}

module.exports = new UserModel();
