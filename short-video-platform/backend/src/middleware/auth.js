/**
 * JWT 认证中间件
 */

const jwt = require('jsonwebtoken');
const userModel = require('../db/userModel');

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'shortvideo-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthMiddleware {
  /**
   * 生成 JWT Token
   */
  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * 验证 Token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * 认证中间件
   */
  static authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: '请先登录'
        });
      }

      const token = authHeader.substring(7);
      const decoded = AuthMiddleware.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: '登录已过期，请重新登录'
        });
      }

      // 将用户信息附加到请求对象
      req.user = decoded;
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_ERROR',
        message: '认证失败'
      });
    }
  }

  /**
   * 可选认证（用于公开接口但支持登录用户）
   */
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = AuthMiddleware.verifyToken(token);
        
        if (decoded) {
          req.user = decoded;
        }
      }
      
      next();
      
    } catch (error) {
      next();
    }
  }

  /**
   * 获取当前用户完整信息
   */
  static async getCurrentUser(req, res, next) {
    if (req.user && req.user.userId) {
      const user = userModel.findById(req.user.userId);
      if (user) {
        // 移除敏感信息
        delete user.password_hash;
        req.currentUser = user;
      }
    }
    next();
  }
}

module.exports = AuthMiddleware;
