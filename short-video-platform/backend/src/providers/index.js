/**
 * API 提供商管理器
 * 统一管理和创建各种视频生成提供商
 */

const RunwayProvider = require('./runway');
const KlingProvider = require('./kling');
const AliyunProvider = require('./aliyun');
const VolcengineProvider = require('./volcengine');
const PikaProvider = require('./pika');
const MockProvider = require('./mock');
const configManager = require('../utils/configManager');

// 提供商映射表
const providerMap = {
  'runway': RunwayProvider,
  'kling': KlingProvider,
  'aliyun': AliyunProvider,
  'volcengine': VolcengineProvider,
  'pika': PikaProvider,
  'mock': MockProvider
};

// 提供商信息（用于前端展示）
const providerInfo = {
  'runway': {
    name: 'Runway ML',
    region: 'international',
    price: '$0.05/秒',
    features: ['专业级', '最长16秒'],
    logo: '🎬'
  },
  'kling': {
    name: 'Kling AI (可灵)',
    region: 'international',
    price: '¥0.05/秒',
    features: ['真实感强', '新兴平台'],
    logo: '🔪'
  },
  'aliyun': {
    name: '阿里云 - 通义万相',
    region: 'domestic',
    price: '¥0.5/秒',
    features: ['中文优化', '高质量'],
    logo: '☁️'
  },
  'volcengine': {
    name: '火山引擎 - 即梦 AI',
    region: 'domestic',
    price: '¥0.4/秒',
    features: ['速度快', '性价比高'],
    logo: '🚀'
  },
  'pika': {
    name: 'Pika Labs',
    region: 'international',
    price: '$0.03/秒',
    features: ['创意强', '风格多样'],
    logo: '🎭'
  },
  'mock': {
    name: 'Mock (测试模式)',
    region: 'local',
    price: '免费',
    features: ['无需密钥', '快速测试'],
    logo: '🧪'
  }
};

class ProviderManager {
  constructor() {
    this.providers = new Map();
  }

  /**
   * 创建提供商实例
   * @param {string} providerId - 提供商 ID
   * @returns {BaseProvider} - 提供商实例
   */
  createProvider(providerId) {
    // 如果已存在，返回缓存的实例
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId);
    }

    const ProviderClass = providerMap[providerId];
    
    if (!ProviderClass) {
      throw new Error(`不支持的提供商: ${providerId}`);
    }

    // 获取提供商配置
    const apiKey = configManager.getApiKey(providerId);
    const providerConfig = configManager.getProviders().find(p => p.id === providerId);
    
    const config = {
      apiKey,
      endpoint: providerConfig?.endpoint,
      ...providerConfig
    };

    const provider = new ProviderClass(config);
    
    // 缓存实例
    this.providers.set(providerId, provider);
    
    return provider;
  }

  /**
   * 获取所有可用的提供商
   */
  getAvailableProviders() {
    return Object.keys(providerMap).filter(id => {
      // Mock 始终可用
      if (id === 'mock') return true;
      
      // 检查是否配置了 API 密钥
      return !!configManager.getApiKey(id);
    });
  }

  /**
   * 获取提供商信息
   */
  getProviderInfo(providerId) {
    try {
      const provider = this.createProvider(providerId);
      const info = provider.getInfo();
      const meta = providerInfo[providerId] || {};
      
      return {
        ...info,
        ...meta,
        id: providerId,
        available: true,
        hasApiKey: !!configManager.getApiKey(providerId)
      };
    } catch (error) {
      return {
        id: providerId,
        ...providerInfo[providerId],
        available: false,
        hasApiKey: !!configManager.getApiKey(providerId),
        error: error.message
      };
    }
  }

  /**
   * 获取所有支持的提供商列表
   */
  getSupportedProviders() {
    return Object.keys(providerMap).map(id => this.getProviderInfo(id));
  }

  /**
   * 按地区获取提供商
   */
  getProvidersByRegion(region) {
    return this.getSupportedProviders().filter(p => {
      const meta = providerInfo[p.id];
      return meta && meta.region === region;
    });
  }

  /**
   * 获取国内提供商
   */
  getDomesticProviders() {
    return this.getProvidersByRegion('domestic');
  }

  /**
   * 获取国际提供商
   */
  getInternationalProviders() {
    return this.getProvidersByRegion('international');
  }
}

// 导出单例
module.exports = new ProviderManager();
