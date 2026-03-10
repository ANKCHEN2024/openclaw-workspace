/**
 * 配置管理器
 * 负责管理 API 密钥和其他配置信息
 * 使用本地 JSON 文件存储配置（生产环境应使用加密存储）
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    // 配置文件路径
    this.configPath = path.join(__dirname, '../config/config.json');
    // 默认配置
    this.defaultConfig = {
      apiKeys: {},
      providers: {
        'aliyun': {
          name: '阿里云',
          enabled: true,
          endpoint: 'https://dashscope.aliyuncs.com'
        },
        'tencent': {
          name: '腾讯云',
          enabled: true,
          endpoint: 'https://api.tencentcloudapi.com'
        },
        'volcengine': {
          name: '火山引擎',
          enabled: true,
          endpoint: 'https://api.volcengine.com'
        }
      },
      settings: {
        maxConcurrentTasks: 5,
        taskTimeout: 300000, // 5 分钟
        retryAttempts: 3
      }
    };
    
    // 确保配置目录存在
    this.ensureConfigDir();
    
    // 加载配置
    this.config = this.loadConfig();
  }

  /**
   * 确保配置目录存在
   */
  ensureConfigDir() {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loaded = JSON.parse(data);
        // 合并默认配置
        return {
          ...this.defaultConfig,
          ...loaded,
          providers: {
            ...this.defaultConfig.providers,
            ...(loaded.providers || {})
          },
          settings: {
            ...this.defaultConfig.settings,
            ...(loaded.settings || {})
          }
        };
      } else {
        // 创建默认配置文件
        this.saveConfig(this.defaultConfig);
        return this.defaultConfig;
      }
    } catch (error) {
      console.error('加载配置失败:', error.message);
      return this.defaultConfig;
    }
  }

  /**
   * 保存配置到文件
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('保存配置失败:', error.message);
      return false;
    }
  }

  /**
   * 获取 API 密钥
   */
  getApiKey(provider) {
    return this.config.apiKeys[provider] || null;
  }

  /**
   * 设置 API 密钥
   */
  setApiKey(provider, key) {
    this.config.apiKeys[provider] = key;
    return this.saveConfig(this.config);
  }

  /**
   * 获取所有提供商配置
   */
  getProviders() {
    return Object.entries(this.config.providers).map(([key, value]) => ({
      id: key,
      name: value.name,
      enabled: value.enabled,
      endpoint: value.endpoint,
      hasApiKey: !!this.config.apiKeys[key]
    }));
  }

  /**
   * 获取启用的提供商
   */
  getEnabledProviders() {
    return this.getProviders().filter(p => p.enabled && p.hasApiKey);
  }

  /**
   * 获取设置
   */
  getSetting(key) {
    return this.config.settings[key];
  }

  /**
   * 更新设置
   */
  updateSetting(key, value) {
    this.config.settings[key] = value;
    return this.saveConfig(this.config);
  }

  /**
   * 获取完整配置（用于调试，不返回敏感信息）
   */
  getConfig() {
    const safeConfig = { ...this.config };
    // 隐藏 API 密钥
    safeConfig.apiKeys = {};
    Object.keys(this.config.apiKeys).forEach(key => {
      safeConfig.apiKeys[key] = '***';
    });
    return safeConfig;
  }
}

// 导出单例
module.exports = new ConfigManager();
