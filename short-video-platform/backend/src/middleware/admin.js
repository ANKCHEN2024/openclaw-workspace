/**
 * 管理员权限中间件
 */

const userModel = require('../db/userModel');

class AdminMiddleware {
  /**
   * 检查是否为管理员
   */
  static async requireAdmin(req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: '请先登录'
        });
      }

      const user = userModel.findById(req.user.userId);
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: '需要管理员权限'
        });
      }

      // 将完整用户信息附加到请求
      req.adminUser = user;
      next();
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: '权限检查失败'
      });
    }
  }

  /**
   * 可选管理员检查（记录但不阻止）
   */
  static async checkAdmin(req, res, next) {
    try {
      if (req.user && req.user.userId) {
        const user = userModel.findById(req.user.userId);
        req.isAdmin = user && user.is_admin;
      }
      next();
    } catch (error) {
      next();
    }
  }
}

module.exports = AdminMiddleware;
