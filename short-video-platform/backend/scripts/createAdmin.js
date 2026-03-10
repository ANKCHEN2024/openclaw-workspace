#!/usr/bin/env node

/**
 * 创建超级管理员账号脚本
 * 
 * 用法: node createAdmin.js [用户名] [密码]
 * 默认: 用户名: admin, 密码: admin123
 */

const path = require('path');

const database = require('../src/db/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function createAdmin() {
  // 从命令行参数获取用户名和密码
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const email = `${username}@admin.local`;

  console.log('='.repeat(50));
  console.log('🎬 短视频平台 - 创建超级管理员');
  console.log('='.repeat(50));
  console.log(`用户名: ${username}`);
  console.log(`邮箱: ${email}`);
  console.log(`密码: ${password}`);
  console.log('='.repeat(50));

  try {
    const db = database.getDb();
    
    // 检查是否已存在
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      console.log('⚠️  用户已存在，更新为管理员权限...');
      
      // 更新为管理员
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existingUser.id);
      
      console.log('✅ 已更新为超级管理员！');
      console.log('');
      console.log('登录信息:');
      console.log(`  用户名: ${username}`);
      console.log(`  密码: ${existingUser.password_hash ? '(原密码)' : password}`);
      console.log('');
      console.log('登录地址: http://localhost:8080/login.html');
      return;
    }

    // 创建管理员用户
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES (?, ?, ?, 1)
    `);
    
    stmt.run(username, email, passwordHash);
    
    console.log('✅ 超级管理员创建成功！');
    console.log('');
    console.log('登录信息:');
    console.log(`  用户名: ${username}`);
    console.log(`  密码: ${password}`);
    console.log('');
    console.log('登录地址: http://localhost:8080/login.html');
    console.log('');
    console.log('管理员权限:');
    console.log('  - 查看所有用户');
    console.log('  - 查看所有视频');
    console.log('  - 查看所有任务');
    console.log('  - 删除任何视频');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createAdmin();
