/**
 * 国内 API 提供商索引
 * 包含阿里云、腾讯云、火山引擎、快手可灵、百度、商汤、MiniMax 等
 */

export { AliyunProvider, type AliyunConfig } from './aliyun-provider';
export { TencentProvider, type TencentConfig } from './tencent-provider';
export { VolcengineProvider, type VolcengineConfig } from './volcengine-provider';
export { KuaishouProvider, type KuaishouConfig } from './kuaishou-provider';
export { BaiduProvider, type BaiduConfig } from './baidu-provider';
export { SenseTimeProvider, type SenseTimeConfig } from './sensetime-provider';
export { MiniMaxProvider, type MiniMaxConfig } from './minimax-provider';
export { TencentZhiYingProvider, type TencentZhiYingConfig } from './tencent-zhiying-provider';

/**
 * 国内 API 提供商列表
 */
export const DOMESTIC_PROVIDERS = [
  {
    id: 'aliyun',
    name: '阿里云 - 通义万相',
    config: ['apiKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.5 元/秒',
    freeQuota: '100 秒',
    recommend: 5
  },
  {
    id: 'tencent',
    name: '腾讯云 - 混元大模型',
    config: ['secretId', 'secretKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.6 元/秒',
    freeQuota: '50 秒',
    recommend: 4
  },
  {
    id: 'volcengine',
    name: '火山引擎 - 即梦 AI',
    config: ['apiKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.4 元/秒',
    freeQuota: '200 秒',
    recommend: 5
  },
  {
    id: 'kuaishou',
    name: '快手 - 可灵 AI',
    config: ['apiKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.3 元/秒',
    freeQuota: '100 秒',
    recommend: 4
  },
  {
    id: 'baidu',
    name: '百度智能云 - 文心一格',
    config: ['apiKey', 'secretKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.45 元/秒',
    freeQuota: '100 秒',
    recommend: 4
  },
  {
    id: 'sensetime',
    name: '商汤科技 - 日日新',
    config: ['apiKey', 'apiSecret'],
    features: ['text2video', 'image2video'],
    maxDuration: 15,
    pricing: '约 0.8 元/秒',
    freeQuota: '60 秒',
    recommend: 3
  },
  {
    id: 'minimax',
    name: 'MiniMax - 海螺 AI',
    config: ['apiKey'],
    features: ['text2video', 'image2video'],
    maxDuration: 10,
    pricing: '约 0.35 元/秒',
    freeQuota: '150 秒',
    recommend: 5
  },
  {
    id: 'tencent_zhiying',
    name: '腾讯智影',
    config: ['apiKey'],
    features: ['text2video', 'digital_human'],
    maxDuration: 10,
    pricing: '约 0.5 元/秒',
    freeQuota: '80 秒',
    recommend: 4
  }
];

/**
 * 获取国内 API 提供商信息
 */
export function getDomesticProviderInfo(providerId: string) {
  return DOMESTIC_PROVIDERS.find(p => p.id === providerId);
}

/**
 * 获取所有国内 API 提供商列表
 */
export function listDomesticProviders() {
  return DOMESTIC_PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    features: p.features,
    maxDuration: p.maxDuration,
    pricing: p.pricing
  }));
}
