/**
 * 短视频生成平台 - 主服务器入口
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入数据库（初始化）
require('./db/database');

// 导入路由
const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const videoRoutes = require('./routes/videos');
const providerRoutes = require('./routes/providers');
const configRoutes = require('./routes/config');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

// 导入错误处理中间件
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 中间件配置
// ============================================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// 静态文件服务
// ============================================

app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// ============================================
// API 路由
// ============================================

// 认证路由
app.use('/api/auth', authRoutes);

// 视频生成路由
app.use('/api/generate', generateRoutes);

// 视频管理路由
app.use('/api/videos', videoRoutes);

// 任务路由
app.use('/api/tasks', taskRoutes);

// 管理员路由
app.use('/api/admin', adminRoutes);

// 提供商路由
app.use('/api/providers', providerRoutes);

// 配置路由
app.use('/api/config', configRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'short-video-platform',
    version: '2.0.0'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `无法找到资源：${req.path}`,
    path: req.path
  });
});

// 错误处理
app.use(errorHandler);

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎬 短视频生成平台后端服务 v2.0');
  console.log('='.repeat(60));
  console.log(`服务地址：http://localhost:${PORT}`);
  console.log(`环境：${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  console.log('可用端点:');
  console.log('');
  console.log('📱 认证:');
  console.log('  POST   /api/auth/register   - 用户注册');
  console.log('  POST   /api/auth/login      - 用户登录');
  console.log('  GET    /api/auth/me         - 获取当前用户');
  console.log('');
  console.log('🎬 视频:');
  console.log('  POST   /api/generate        - 生成视频');
  console.log('  GET    /api/tasks           - 获取任务列表');
  console.log('  GET    /api/tasks/:id       - 获取任务状态');
  console.log('  GET    /api/videos          - 获取视频列表');
  console.log('  GET    /api/videos/:id      - 获取单个视频');
  console.log('  DELETE /api/videos/:id      - 删除视频');
  console.log('');
  console.log('⚙️  配置:');
  console.log('  GET    /api/providers       - 获取提供商列表');
  console.log('  POST   /api/config          - 配置 API 密钥');
  console.log('='.repeat(60));
});

module.exports = app;
