/**
 * 提供商路由
 */

const express = require('express');
const router = express.Router();
const providerManager = require('../providers');

/**
 * GET /api/providers
 * 获取所有支持的提供商
 */
router.get('/', (req, res) => {
  try {
    const providers = providerManager.getSupportedProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/providers/domestic
 * 获取国内提供商
 */
router.get('/domestic', (req, res) => {
  try {
    const providers = providerManager.getDomesticProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/providers/international
 * 获取国际提供商
 */
router.get('/international', (req, res) => {
  try {
    const providers = providerManager.getInternationalProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
