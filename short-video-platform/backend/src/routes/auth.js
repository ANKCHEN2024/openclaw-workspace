/**
 * 用户认证路由
 */

const express = require('express');
const router = express.Router();
const userModel = require('../db/userModel');
const AuthMiddleware = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: '请填写用户名、邮箱和密码'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: '密码至少需要6个字符'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: '邮箱格式不正确'
      });
    }

    // 检查用户名是否已存在
    const existingUser = userModel.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_EXISTS',
        message: '用户名已被使用'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: '邮箱已被注册'
      });
    }

    // 创建用户
    const user = await userModel.create({
      username,
      email,
      password
    });

    // 生成 Token
    const token = AuthMiddleware.generateToken(user);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: 'REGISTER_ERROR',
      message: '注册失败，请稍后重试'
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: '请填写用户名和密码'
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    let user = userModel.findByUsername(username);
    if (!user) {
      user = userModel.findByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await userModel.verifyPassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      });
    }

    // 生成 Token
    const token = AuthMiddleware.generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: '登录失败，请稍后重试'
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = userModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: '获取用户信息失败'
    });
  }
});

/**
 * PUT /api/auth/profile
 * 更新用户信息
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, email, avatar_url } = req.body;
    const userId = req.user.userId;

    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (avatar_url) updates.avatar_url = avatar_url;

    const user = userModel.update(userId, updates);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_ERROR',
      message: '更新失败'
    });
  }
});

/**
 * POST /api/auth/change-password
 * 修改密码
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: '请填写当前密码和新密码'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: '新密码至少需要6个字符'
      });
    }

    // 获取用户
    const user = userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await userModel.verifyPassword(user, currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: '当前密码错误'
      });
    }

    // 更新密码
    await userModel.updatePassword(userId, newPassword);

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: 'CHANGE_PASSWORD_ERROR',
      message: '修改密码失败'
    });
  }
});

module.exports = router;
