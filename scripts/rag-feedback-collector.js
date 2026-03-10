#!/usr/bin/env node
/**
 * RAG 反馈收集与持续优化机制
 * 记录用户反馈、分析模式、自动调整检索策略
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const CONFIG = {
  feedbackLogPath: '/Users/chenggl/workspace/logs/rag-feedback.jsonl',
  optimizationConfigPath: '/Users/chenggl/workspace/config/rag-optimization.json',
  weeklyReportPath: '/Users/chenggl/workspace/docs/rag-weekly-report.md',
  
  // 优化阈值
  thresholds: {
    minFeedbacksForOptimization: 10,  // 最少反馈数触发优化
    lowConfidenceThreshold: 0.4,       // 低置信度阈值
    negativeFeedbackThreshold: 0.3     // 负面反馈超过 30% 触发优化
  }
};

// 默认优化配置
const DEFAULT_OPTIMIZATION_CONFIG = {
  version: '1.0.0',
  lastUpdated: null,
  
  // 检索参数
  search: {
    defaultTopK: 5,
    vectorWeight: 0.7,
    keywordWeight: 0.3,
    minConfidence: 0.3
  },
  
  // 来源权重（根据反馈动态调整）
  sourceWeights: {
    long_term_memory: 1.0,
    daily_logs: 0.9,
    skills_kb: 0.95,
    project_docs: 0.85,
    learning_notes: 0.8,
    conversation_history: 0.7
  },
  
  // 类别特定配置
  categoryConfigs: {
    factual: { topK: 3, vectorWeight: 0.8 },
    conceptual: { topK: 5, vectorWeight: 0.7 },
    procedural: { topK: 7, vectorWeight: 0.6 },
    technical: { topK: 5, vectorWeight: 0.75 }
  },
  
  // 性能统计
  stats: {
    totalQueries: 0,
    totalFeedbacks: 0,
    avgConfidence: 0,
    avgResponseTime: 0,
    satisfactionRate: 0
  }
};

/**
 * 记录用户反馈
 */
async function recordFeedback(feedbackData) {
  const {
    query,
    answer,
    confidence,
    sources,
    responseTime,
    rating,        // 'helpful' | 'not_helpful' | 1-5 分
    userComment,   // 可选的用户评论
    sessionId,
    category       // 问题类别（自动分类或手动指定）
  } = feedbackData;
  
  const feedback = {
    timestamp: Date.now(),
    query,
    answer: answer.substring(0, 500),  // 限制长度
    confidence,
    sources: sources?.slice(0, 3).map(s => ({
      source: s.source,
      score: s.score
    })),
    responseTime,
    rating,
    userComment,
    sessionId,
    category: category || autoClassifyQuery(query)
  };
  
  // 追加到 JSONL 文件
  const logLine = JSON.stringify(feedback) + '\n';
  await fs.mkdir(path.dirname(CONFIG.feedbackLogPath), { recursive: true });
  await fs.appendFile(CONFIG.feedbackLogPath, logLine, 'utf-8');
  
  console.log(`📝 反馈已记录：${rating === 'helpful' ? '✅' : '❌'}`);
  
  // 更新统计
  await updateStats(feedback);
  
  return { success: true };
}

/**
 * 自动分类问题
 */
function autoClassifyQuery(query) {
  const patterns = {
    factual: [/是谁 | 是什么 | 哪里 | 何时/i, /背景 | 经历 | 历史/i],
    conceptual: [/什么是 | 原理 | 概念/i, /解释 | 理解/i],
    procedural: [/如何 | 怎么 | 步骤/i, /配置 | 设置 | 安装/i],
    technical: [/代码 | 脚本 | 函数/i, /API | 接口 | 调用/i],
    business: [/业务 | 产品 | 公司/i, /战略 | 方向/i]
  };
  
  for (const [category, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      if (regex.test(query)) {
        return category;
      }
    }
  }
  
  return 'comprehensive';  // 默认类别
}

/**
 * 更新统计信息
 */
async function updateStats(feedback) {
  const config = await loadOptimizationConfig();
  
  config.stats.totalQueries++;
  if (feedback.rating) {
    config.stats.totalFeedbacks++;
  }
  
  // 更新平均值（移动平均）
  const alpha = 0.1;  // 平滑因子
  config.stats.avgConfidence = 
    config.stats.avgConfidence * (1 - alpha) + feedback.confidence * alpha;
  config.stats.avgResponseTime = 
    Math.round(config.stats.avgResponseTime * (1 - alpha) + feedback.responseTime * alpha);
  
  // 满意度
  if (feedback.rating === 'helpful' || (typeof feedback.rating === 'number' && feedback.rating >= 4)) {
    config.stats.satisfactionRate = 
      config.stats.satisfactionRate * (1 - alpha) + 1 * alpha;
  } else if (feedback.rating === 'not_helpful' || (typeof feedback.rating === 'number' && feedback.rating <= 2)) {
    config.stats.satisfactionRate = 
      config.stats.satisfactionRate * (1 - alpha) + 0 * alpha;
  }
  
  config.lastUpdated = new Date().toISOString();
  
  await saveOptimizationConfig(config);
}

/**
 * 加载优化配置
 */
async function loadOptimizationConfig() {
  try {
    const content = await fs.readFile(CONFIG.optimizationConfigPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 返回默认配置
    const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_OPTIMIZATION_CONFIG));
    defaultConfig.lastUpdated = new Date().toISOString();
    return defaultConfig;
  }
}

/**
 * 保存优化配置
 */
async function saveOptimizationConfig(config) {
  await fs.mkdir(path.dirname(CONFIG.optimizationConfigPath), { recursive: true });
  await fs.writeFile(CONFIG.optimizationConfigPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 分析反馈数据
 */
async function analyzeFeedbacks(timeRange = '7d') {
  // 读取反馈日志
  let feedbacks = [];
  try {
    const content = await fs.readFile(CONFIG.feedbackLogPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    feedbacks = lines.map(line => JSON.parse(line));
  } catch (error) {
    console.warn('⚠️ 无反馈数据');
    return null;
  }
  
  // 时间过滤
  const now = Date.now();
  const timeRanges = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const cutoff = now - (timeRanges[timeRange] || timeRanges['7d']);
  const recentFeedbacks = feedbacks.filter(f => f.timestamp > cutoff);
  
  if (recentFeedbacks.length === 0) {
    return {
      totalFeedbacks: 0,
      message: '最近无反馈数据'
    };
  }
  
  // 分析
  const analysis = {
    timeRange,
    totalFeedbacks: recentFeedbacks.length,
    
    // 满意度分布
    satisfaction: {
      helpful: recentFeedbacks.filter(f => f.rating === 'helpful').length,
      notHelpful: recentFeedbacks.filter(f => f.rating === 'not_helpful').length,
      unrated: recentFeedbacks.filter(f => !f.rating).length
    },
    
    // 类别分布
    categories: {},
    
    // 低置信度问题
    lowConfidenceQueries: [],
    
    // 负面反馈问题
    negativeFeedbackQueries: [],
    
    // 平均指标
    avgConfidence: 0,
    avgResponseTime: 0
  };
  
  // 计算平均值
  analysis.avgConfidence = recentFeedbacks.reduce((sum, f) => sum + f.confidence, 0) / recentFeedbacks.length;
  analysis.avgResponseTime = Math.round(recentFeedbacks.reduce((sum, f) => sum + f.responseTime, 0) / recentFeedbacks.length);
  
  // 按类别统计
  for (const feedback of recentFeedbacks) {
    const cat = feedback.category || 'unknown';
    if (!analysis.categories[cat]) {
      analysis.categories[cat] = { total: 0, helpful: 0 };
    }
    analysis.categories[cat].total++;
    if (feedback.rating === 'helpful') {
      analysis.categories[cat].helpful++;
    }
    
    // 收集问题案例
    if (feedback.confidence < CONFIG.thresholds.lowConfidenceThreshold) {
      analysis.lowConfidenceQueries.push({
        query: feedback.query,
        confidence: feedback.confidence,
        timestamp: feedback.timestamp
      });
    }
    
    if (feedback.rating === 'not_helpful') {
      analysis.negativeFeedbackQueries.push({
        query: feedback.query,
        confidence: feedback.confidence,
        comment: feedback.userComment,
        timestamp: feedback.timestamp
      });
    }
  }
  
  // 计算各类别满意度
  for (const cat in analysis.categories) {
    const stats = analysis.categories[cat];
    stats.satisfactionRate = stats.total > 0 ? stats.helpful / stats.total : 0;
  }
  
  return analysis;
}

/**
 * 根据反馈自动优化配置
 */
async function autoOptimize() {
  console.log('🔄 开始自动优化...\n');
  
  const analysis = await analyzeFeedbacks('7d');
  if (!analysis || analysis.totalFeedbacks < CONFIG.thresholds.minFeedbacksForOptimization) {
    console.log('⚠️ 反馈数据不足，跳过优化');
    return null;
  }
  
  const config = await loadOptimizationConfig();
  const optimizations = [];
  
  // 1. 优化来源权重
  const sourcePerformance = {};
  const feedbacks = await readRecentFeedbacks('7d');
  
  for (const feedback of feedbacks) {
    if (feedback.sources) {
      for (const source of feedback.sources) {
        if (!sourcePerformance[source.source]) {
          sourcePerformance[source.source] = { total: 0, helpful: 0 };
        }
        sourcePerformance[source.source].total++;
        if (feedback.rating === 'helpful') {
          sourcePerformance[source.source].helpful++;
        }
      }
    }
  }
  
  // 调整来源权重
  for (const [source, stats] of Object.entries(sourcePerformance)) {
    if (stats.total >= 5) {  // 至少 5 次反馈
      const satisfaction = stats.helpful / stats.total;
      const currentWeight = config.sourceWeights[source] || 1.0;
      
      if (satisfaction > 0.8 && currentWeight < 1.2) {
        config.sourceWeights[source] = parseFloat((currentWeight + 0.1).toFixed(2));
        optimizations.push(`↑ 提升 ${source} 权重：${currentWeight} → ${config.sourceWeights[source]}`);
      } else if (satisfaction < 0.5 && currentWeight > 0.5) {
        config.sourceWeights[source] = parseFloat((currentWeight - 0.1).toFixed(2));
        optimizations.push(`↓ 降低 ${source} 权重：${currentWeight} → ${config.sourceWeights[source]}`);
      }
    }
  }
  
  // 2. 针对低满意度类别优化
  for (const [category, stats] of Object.entries(analysis.categories)) {
    if (stats.total >= 3 && stats.satisfactionRate < 0.5) {
      const catConfig = config.categoryConfigs[category];
      if (catConfig) {
        // 增加 topK 以获取更多上下文
        catConfig.topK = Math.min(catConfig.topK + 2, 10);
        optimizations.push(`📊 ${category} 类别 topK 调整为 ${catConfig.topK}`);
      }
    }
  }
  
  // 3. 性能优化
  if (analysis.avgResponseTime > 2000) {
    config.search.defaultTopK = Math.max(config.search.defaultTopK - 1, 3);
    optimizations.push(`⚡ 降低默认 topK 以提升性能：${config.search.defaultTopK}`);
  }
  
  if (optimizations.length > 0) {
    config.lastUpdated = new Date().toISOString();
    await saveOptimizationConfig(config);
    
    console.log('✅ 优化完成:\n');
    optimizations.forEach(opt => console.log(`  ${opt}`));
  } else {
    console.log('ℹ️  无需优化');
  }
  
  return {
    optimizations,
    config
  };
}

/**
 * 读取近期反馈
 */
async function readRecentFeedbacks(timeRange = '7d') {
  try {
    const content = await fs.readFile(CONFIG.feedbackLogPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    const feedbacks = lines.map(line => JSON.parse(line));
    
    const now = Date.now();
    const cutoff = now - (timeRange === '1d' ? 24 * 60 * 60 * 1000 : 
                         timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                         30 * 24 * 60 * 60 * 1000);
    
    return feedbacks.filter(f => f.timestamp > cutoff);
  } catch (error) {
    return [];
  }
}

/**
 * 生成周报
 */
async function generateWeeklyReport() {
  const analysis = await analyzeFeedbacks('7d');
  if (!analysis || analysis.totalFeedbacks === 0) {
    return '本周无反馈数据';
  }
  
  const config = await loadOptimizationConfig();
  
  const report = `# RAG 系统周报

## 📅 时间范围
${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}

## 📊 核心指标

- **总反馈数**: ${analysis.totalFeedbacks}
- **满意度**: ${((analysis.satisfaction.helpful / analysis.totalFeedbacks) * 100).toFixed(1)}%
- **平均置信度**: ${(analysis.avgConfidence * 100).toFixed(1)}%
- **平均响应时间**: ${analysis.avgResponseTime}ms

## 😊 满意度分布

- ✅ 有帮助：${analysis.satisfaction.helpful}
- ❌ 无帮助：${analysis.satisfaction.notHelpful}
- ⏸️ 未评价：${analysis.satisfaction.unrated}

## 📈 按类别分析

${Object.entries(analysis.categories).map(([cat, stats]) => 
`### ${cat}
- 问题数：${stats.total}
- 满意度：${(stats.satisfactionRate * 100).toFixed(1)}%`
).join('\n\n')}

## ⚠️ 需关注的问题

### 低置信度查询
${analysis.lowConfidenceQueries.slice(0, 5).map(q => 
`- "${q.query}" (置信度：${(q.confidence * 100).toFixed(1)}%)`
).join('\n')}

### 负面反馈
${analysis.negativeFeedbackQueries.slice(0, 5).map(q => 
`- "${q.query}"${q.comment ? ` - ${q.comment}` : ''}`
).join('\n')}

## 🔧 系统配置

- TopK: ${config.search.defaultTopK}
- 向量权重：${config.search.vectorWeight}
- 关键词权重：${config.search.keywordWeight}

## 💡 改进建议

${generateWeeklyRecommendations(analysis)}

---

*报告生成时间：${new Date().toLocaleString('zh-CN')}*
`;

  // 保存报告
  await fs.mkdir(path.dirname(CONFIG.weeklyReportPath), { recursive: true });
  await fs.writeFile(CONFIG.weeklyReportPath, report, 'utf-8');
  
  return report;
}

/**
 * 生成周报建议
 */
function generateWeeklyRecommendations(analysis) {
  const recommendations = [];
  
  // 低满意度类别
  const lowSatisfactionCats = Object.entries(analysis.categories)
    .filter(([_, stats]) => stats.satisfactionRate < 0.6 && stats.total >= 3)
    .sort((a, b) => a[1].satisfactionRate - b[1].satisfactionRate);
  
  if (lowSatisfactionCats.length > 0) {
    recommendations.push(`1. **加强 ${lowSatisfactionCats[0][0]} 类知识库**: 满意度仅 ${(lowSatisfactionCats[0][1].satisfactionRate * 100).toFixed(1)}%`);
  }
  
  // 响应时间
  if (analysis.avgResponseTime > 1500) {
    recommendations.push(`2. **优化性能**: 平均响应时间 ${analysis.avgResponseTime}ms，考虑优化索引或缓存`);
  }
  
  // 负面反馈
  if (analysis.negativeFeedbackQueries.length > 0) {
    recommendations.push(`3. **Review 负面反馈**: ${analysis.negativeFeedbackQueries.length} 条负面反馈需要关注`);
  }
  
  // 通用建议
  recommendations.push(`4. **持续收集反馈**: 当前反馈率 ${(analysis.totalFeedbacks / 100).toFixed(0)}%，鼓励用户评价`);
  
  return recommendations.join('\n\n');
}

// 导出函数
module.exports = {
  recordFeedback,
  analyzeFeedbacks,
  autoOptimize,
  generateWeeklyReport,
  loadOptimizationConfig,
  CONFIG
};

// CLI 模式
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    switch (command) {
      case 'analyze':
        const analysis = await analyzeFeedbacks('7d');
        console.log(JSON.stringify(analysis, null, 2));
        break;
      
      case 'optimize':
        await autoOptimize();
        break;
      
      case 'report':
        const report = await generateWeeklyReport();
        console.log(report);
        break;
      
      default:
        console.log('用法：node rag-feedback-collector.js [analyze|optimize|report]');
    }
  })();
}
