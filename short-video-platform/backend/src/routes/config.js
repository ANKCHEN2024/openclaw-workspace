/**
 * 配置路由
 * POST /api/config - 配置 API 密钥
 */

const express = require('express');
const router = express.Router();
const configManager = require('../utils/configManager');

/**
 * POST /api/config
 * 配置 API 密钥
 * 
 * 请求体:
 * {
 *   "provider": "aliyun",
 *   "apiKey": "your-api-key-here"
 * }
 */
router.post('/', (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;
    
    // 验证必要参数
    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: '缺少必要参数：provider 和 apiKey'
      });
    }
    
    // 验证提供商是否支持
    const providers = configManager.getProviders();
    const providerExists = providers.some(p => p.id === provider);
    
    if (!providerExists) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: `不支持的提供商：${provider}。支持的提供商：${providers.map(p => p.id).join(', ')}`
      });
    }
    
    // 保存 API 密钥
    const success = configManager.setApiKey(provider, apiKey);
    
    if (!success) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: '保存配置失败'
      });
    }
    
    res.json({
      success: true,
      message: 'API 密钥配置成功',
      data: {
        provider,
        configured: true
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config
 * 获取当前配置（不包含敏感信息）
 */
router.get('/', (req, res, next) => {
  try {
    const config = configManager.getConfig();
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
