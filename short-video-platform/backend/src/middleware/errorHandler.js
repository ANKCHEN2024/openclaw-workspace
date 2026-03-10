/**
 * 全局错误处理中间件
 * 统一处理所有路由中的错误
 */

/**
 * 错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error('[错误]', new Date().toISOString());
  console.error('路径:', req.path);
  console.error('方法:', req.method);
  console.error('错误:', err.message);
  console.error('堆栈:', err.stack);
  
  // 确定 HTTP 状态码
  let statusCode = err.statusCode || err.status || 500;
  
  // 确保状态码在有效范围内
  if (statusCode < 400 || statusCode >= 600) {
    statusCode = 500;
  }
  
  // 构建错误响应
  const errorResponse = {
    error: getErrorName(statusCode),
    message: err.message || '服务器内部错误',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // 开发环境显示堆栈信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // 发送错误响应
  res.status(statusCode).json(errorResponse);
};

/**
 * 根据状态码获取错误名称
 */
function getErrorName(statusCode) {
  const errorNames = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    408: 'REQUEST_TIMEOUT',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };
  
  return errorNames[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * 创建自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
