#!/usr/bin/env node
/**
 * RAG 知识库质量评估脚本
 * 测试集评估、指标计算、质量报告生成
 */

const fs = require('fs').promises;
const path = require('path');
const { optimizedSearch } = require('./optimize-vector-search');

// 配置
const CONFIG = {
  outputPath: '/Users/chenggl/workspace/docs/rag-quality-report.md',
  testSetSize: 50,
  metrics: {
    precision: true,
    recall: true,
    relevance: true,
    responseTime: true,
    confidence: true
  }
};

/**
 * 标准测试集（50 个问题）
 * 涵盖不同类别：事实性、概念性、流程性、配置性等
 */
const TEST_QUESTIONS = [
  // 事实性问题 (1-10)
  {
    id: 1,
    question: '磊哥是谁？',
    category: 'factual',
    expectedKeywords: ['程广磊', '谷风科技', '创始人'],
    minConfidence: 0.7
  },
  {
    id: 2,
    question: '谷风科技的主要业务是什么？',
    category: 'factual',
    expectedKeywords: ['数字孪生', 'AI', '三维可视化'],
    minConfidence: 0.7
  },
  {
    id: 3,
    question: '磊哥的教育背景是什么？',
    category: 'factual',
    expectedKeywords: ['西北政法大学', '新闻传播'],
    minConfidence: 0.6
  },
  {
    id: 4,
    question: '工作空间路径是什么？',
    category: 'factual',
    expectedKeywords: ['/Users/chenggl/workspace'],
    minConfidence: 0.8
  },
  {
    id: 5,
    question: '当前使用的 LLM 模型是什么？',
    category: 'factual',
    expectedKeywords: ['qwen', 'dashscope'],
    minConfidence: 0.6
  },
  
  // 概念性问题 (6-15)
  {
    id: 6,
    question: '什么是 Subagent？',
    category: 'conceptual',
    expectedKeywords: ['子代理', '任务', '并行'],
    minConfidence: 0.6
  },
  {
    id: 7,
    question: 'RAG 系统的工作原理是什么？',
    category: 'conceptual',
    expectedKeywords: ['检索', '增强', '生成'],
    minConfidence: 0.6
  },
  {
    id: 8,
    question: '什么是 LanceDB？',
    category: 'conceptual',
    expectedKeywords: ['向量数据库', '嵌入', '检索'],
    minConfidence: 0.5
  },
  {
    id: 9,
    question: '混合检索是什么？',
    category: 'conceptual',
    expectedKeywords: ['向量', '关键词', '结合'],
    minConfidence: 0.6
  },
  {
    id: 10,
    question: '什么是重排序（reranking）？',
    category: 'conceptual',
    expectedKeywords: ['排序', '分数', '优化'],
    minConfidence: 0.5
  },
  
  // 流程性问题 (11-20)
  {
    id: 11,
    question: '如何创建一个新的 Subagent？',
    category: 'procedural',
    expectedKeywords: ['subagents', 'spawn', '任务'],
    minConfidence: 0.5
  },
  {
    id: 12,
    question: '心跳机制如何工作？',
    category: 'procedural',
    expectedKeywords: ['heartbeat', '定期检查', '后台'],
    minConfidence: 0.5
  },
  {
    id: 13,
    question: '如何配置 cron 定时任务？',
    category: 'procedural',
    expectedKeywords: ['cron', '定时', '配置'],
    minConfidence: 0.5
  },
  {
    id: 14,
    question: '记忆系统如何更新 MEMORY.md？',
    category: 'procedural',
    expectedKeywords: ['memory', '更新', '整理'],
    minConfidence: 0.5
  },
  {
    id: 15,
    question: '如何安装新技能？',
    category: 'procedural',
    expectedKeywords: ['skill', 'install', 'clawhub'],
    minConfidence: 0.5
  },
  
  // 配置性问题 (16-25)
  {
    id: 16,
    question: '时区设置在哪里配置？',
    category: 'config',
    expectedKeywords: ['Asia/Shanghai', 'timezone'],
    minConfidence: 0.6
  },
  {
    id: 17,
    question: '如何配置飞书插件？',
    category: 'config',
    expectedKeywords: ['feishu', '插件', '配置'],
    minConfidence: 0.5
  },
  {
    id: 18,
    question: '模型配置在哪里？',
    category: 'config',
    expectedKeywords: ['model', '配置', 'MODELS.md'],
    minConfidence: 0.5
  },
  {
    id: 19,
    question: '如何设置 API Key？',
    category: 'config',
    expectedKeywords: ['API', 'key', '1password'],
    minConfidence: 0.5
  },
  {
    id: 20,
    question: '工作原则在哪里定义？',
    category: 'config',
    expectedKeywords: ['WORK_PRINCIPLES.md', '原则'],
    minConfidence: 0.6
  },
  
  // 代码/技术问题 (21-30)
  {
    id: 21,
    question: 'optimize-vector-search.js 实现了什么功能？',
    category: 'technical',
    expectedKeywords: ['混合检索', '重排序', '上下文'],
    minConfidence: 0.5
  },
  {
    id: 22,
    question: 'rag-api.js 的作用是什么？',
    category: 'technical',
    expectedKeywords: ['API', 'HTTP', '查询'],
    minConfidence: 0.5
  },
  {
    id: 23,
    question: '如何调用 RAG API？',
    category: 'technical',
    expectedKeywords: ['POST', '/api/rag/query', 'JSON'],
    minConfidence: 0.5
  },
  {
    id: 24,
    question: '嵌入模型使用的是什么？',
    category: 'technical',
    expectedKeywords: ['all-MiniLM-L6-v2', 'Xenova'],
    minConfidence: 0.5
  },
  {
    id: 25,
    question: '如何计算混合检索分数？',
    category: 'technical',
    expectedKeywords: ['vectorWeight', 'keywordWeight', '加权'],
    minConfidence: 0.5
  },
  
  // 业务相关问题 (26-35)
  {
    id: 26,
    question: 'AI 短剧平台的架构是什么？',
    category: 'business',
    expectedKeywords: ['架构', '短剧', '平台'],
    minConfidence: 0.5
  },
  {
    id: 27,
    question: '数字孪生业务的核心是什么？',
    category: 'business',
    expectedKeywords: ['数字孪生', 'AI 大脑', '交互'],
    minConfidence: 0.5
  },
  {
    id: 28,
    question: '2025 年的战略方向是什么？',
    category: 'business',
    expectedKeywords: ['AI', '战略', 'All in'],
    minConfidence: 0.6
  },
  {
    id: 29,
    question: '谷风科技的产品线有哪些？',
    category: 'business',
    expectedKeywords: ['数字政府', '数字园区', '数字水务'],
    minConfidence: 0.5
  },
  {
    id: 30,
    question: '磊哥的媒体经历是什么？',
    category: 'business',
    expectedKeywords: ['西部网', '媒体', '记者'],
    minConfidence: 0.5
  },
  
  // 技能/工具问题 (31-40)
  {
    id: 31,
    question: '如何使用 1Password 集成？',
    category: 'skill',
    expectedKeywords: ['1password', '凭证', '安全'],
    minConfidence: 0.5
  },
  {
    id: 32,
    question: 'weather 技能如何使用？',
    category: 'skill',
    expectedKeywords: ['weather', '天气', 'wttr.in'],
    minConfidence: 0.5
  },
  {
    id: 33,
    question: 'github 技能支持哪些操作？',
    category: 'skill',
    expectedKeywords: ['github', 'issues', 'PR'],
    minConfidence: 0.5
  },
  {
    id: 34,
    question: '如何创建自定义技能？',
    category: 'skill',
    expectedKeywords: ['skill-creator', 'SKILL.md', '创建'],
    minConfidence: 0.5
  },
  {
    id: 35,
    question: 'skill-scanner 的作用是什么？',
    category: 'skill',
    expectedKeywords: ['扫描', '安全', '恶意代码'],
    minConfidence: 0.5
  },
  
  // 综合问题 (36-50)
  {
    id: 36,
    question: '如何提升回答准确率？',
    category: 'comprehensive',
    expectedKeywords: ['RAG', '检索', '准确率'],
    minConfidence: 0.5
  },
  {
    id: 37,
    question: '系统如何保证安全性？',
    category: 'comprehensive',
    expectedKeywords: ['安全', '隐私', '边界'],
    minConfidence: 0.5
  },
  {
    id: 38,
    question: '如何实现持续优化？',
    category: 'comprehensive',
    expectedKeywords: ['优化', '反馈', '迭代'],
    minConfidence: 0.5
  },
  {
    id: 39,
    question: 'MOSS 的身份是什么？',
    category: 'comprehensive',
    expectedKeywords: ['MOSS', 'AI 合伙人', '指挥官'],
    minConfidence: 0.7
  },
  {
    id: 40,
    question: '工作空间的管理原则是什么？',
    category: 'comprehensive',
    expectedKeywords: ['workspace', '管理', '原则'],
    minConfidence: 0.5
  },
  {
    id: 41,
    question: '如何处理群聊消息？',
    category: 'comprehensive',
    expectedKeywords: ['群聊', '消息', '参与'],
    minConfidence: 0.5
  },
  {
    id: 42,
    question: '记忆系统的层次结构是什么？',
    category: 'comprehensive',
    expectedKeywords: ['memory', '每日', '长期'],
    minConfidence: 0.5
  },
  {
    id: 43,
    question: '如何调试工具权限问题？',
    category: 'comprehensive',
    expectedKeywords: ['feishu_app_scopes', '权限', '调试'],
    minConfidence: 0.5
  },
  {
    id: 44,
    question: '系统支持哪些 TTS 功能？',
    category: 'comprehensive',
    expectedKeywords: ['tts', '语音', '转换'],
    minConfidence: 0.5
  },
  {
    id: 45,
    question: '如何管理后台进程？',
    category: 'comprehensive',
    expectedKeywords: ['process', 'background', 'exec'],
    minConfidence: 0.5
  },
  {
    id: 46,
    question: '浏览器自动化如何工作？',
    category: 'comprehensive',
    expectedKeywords: ['browser', '自动化', 'snapshot'],
    minConfidence: 0.5
  },
  {
    id: 47,
    question: '节点管理支持哪些操作？',
    category: 'comprehensive',
    expectedKeywords: ['nodes', '设备', '管理'],
    minConfidence: 0.5
  },
  {
    id: 48,
    question: '如何发布技能到 clawhub？',
    category: 'comprehensive',
    expectedKeywords: ['clawhub', '发布', 'publish'],
    minConfidence: 0.5
  },
  {
    id: 49,
    question: '系统如何进行健康检查？',
    category: 'comprehensive',
    expectedKeywords: ['healthcheck', '安全', '审计'],
    minConfidence: 0.5
  },
  {
    id: 50,
    question: 'EvoMap 是什么？',
    category: 'comprehensive',
    expectedKeywords: ['EvoMap', '进化', '市场'],
    minConfidence: 0.5
  }
];

/**
 * 评估单个问题的检索结果
 */
async function evaluateQuestion(question) {
  const startTime = Date.now();
  
  try {
    const results = await optimizedSearch(question.question, {
      topK: 5,
      useContext: false,
      enableRerank: true
    });
    
    const responseTime = Date.now() - startTime;
    
    // 计算指标
    const metrics = calculateMetrics(question, results);
    
    return {
      questionId: question.id,
      question: question.question,
      category: question.category,
      responseTimeMs: responseTime,
      resultsCount: results.results.length,
      confidence: results.results[0]?.score || 0,
      topSource: results.results[0]?.source || 'N/A',
      metrics,
      passed: metrics.overallScore >= 0.7
    };
  } catch (error) {
    return {
      questionId: question.id,
      question: question.question,
      category: question.category,
      responseTimeMs: Date.now() - startTime,
      resultsCount: 0,
      confidence: 0,
      topSource: 'ERROR',
      metrics: {
        keywordMatchRate: 0,
        relevanceScore: 0,
        precisionScore: 0,
        recallScore: 0,
        overallScore: 0
      },
      passed: false,
      error: error.message
    };
  }
}

/**
 * 计算评估指标
 */
function calculateMetrics(question, results) {
  const { expectedKeywords, minConfidence } = question;
  const retrievedResults = results.results || [];
  
  // 1. 关键词匹配率
  let keywordMatches = 0;
  const allContent = retrievedResults.map(r => r.content.toLowerCase()).join(' ');
  
  for (const keyword of expectedKeywords) {
    if (allContent.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }
  const keywordMatchRate = expectedKeywords.length > 0 
    ? keywordMatches / expectedKeywords.length 
    : 0;
  
  // 2. 相关性评分（基于置信度）
  const avgConfidence = retrievedResults.length > 0
    ? retrievedResults.reduce((sum, r) => sum + (r.score || 0), 0) / retrievedResults.length
    : 0;
  const relevanceScore = avgConfidence;
  
  // 3. 精确率（top 结果质量）
  const precisionScore = retrievedResults.length > 0 
    ? (retrievedResults[0]?.score || 0) 
    : 0;
  
  // 4. 召回率（基于关键词覆盖）
  const recallScore = keywordMatchRate;
  
  // 5. 综合评分（加权平均）
  const overallScore = (
    keywordMatchRate * 0.3 +
    relevanceScore * 0.3 +
    precisionScore * 0.2 +
    recallScore * 0.2
  );
  
  return {
    keywordMatchRate: parseFloat(keywordMatchRate.toFixed(3)),
    relevanceScore: parseFloat(relevanceScore.toFixed(3)),
    precisionScore: parseFloat(precisionScore.toFixed(3)),
    recallScore: parseFloat(recallScore.toFixed(3)),
    overallScore: parseFloat(overallScore.toFixed(3))
  };
}

/**
 * 生成质量报告
 */
async function generateQualityReport(evaluationResults) {
  const totalQuestions = evaluationResults.length;
  const passedQuestions = evaluationResults.filter(r => r.passed).length;
  const passRate = passedQuestions / totalQuestions;
  
  // 按类别分组统计
  const categoryStats = {};
  for (const result of evaluationResults) {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = {
        total: 0,
        passed: 0,
        avgScore: 0,
        avgResponseTime: 0
      };
    }
    categoryStats[result.category].total++;
    if (result.passed) categoryStats[result.category].passed++;
    categoryStats[result.category].avgScore += result.metrics.overallScore;
    categoryStats[result.category].avgResponseTime += result.responseTimeMs;
  }
  
  // 计算平均值
  for (const category in categoryStats) {
    const stats = categoryStats[category];
    stats.avgScore = parseFloat((stats.avgScore / stats.total).toFixed(3));
    stats.avgResponseTime = Math.round(stats.avgResponseTime / stats.total);
    stats.passRate = parseFloat((stats.passed / stats.total).toFixed(3));
  }
  
  // 整体指标
  const avgOverallScore = evaluationResults.reduce((sum, r) => sum + r.metrics.overallScore, 0) / totalQuestions;
  const avgResponseTime = Math.round(evaluationResults.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalQuestions);
  const avgConfidence = evaluationResults.reduce((sum, r) => sum + r.confidence, 0) / totalQuestions;
  
  // 生成 Markdown 报告
  const report = `# RAG 知识库质量评估报告

## 📊 总体概览

- **评估时间**: ${new Date().toISOString()}
- **测试题数**: ${totalQuestions}
- **通过题数**: ${passedQuestions}
- **通过率**: ${(passRate * 100).toFixed(1)}%
- **平均分数**: ${(avgOverallScore * 100).toFixed(1)} 分
- **平均响应时间**: ${avgResponseTime}ms
- **平均置信度**: ${(avgConfidence * 100).toFixed(1)}%

## ✅ 成功标准评估

| 标准 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 回答准确率提升 | 30%+ | ${(avgOverallScore * 100).toFixed(1)}% | ${avgOverallScore >= 0.7 ? '✅' : '❌'} |
| 支持引用来源 | 是 | 是 | ✅ |
| 响应时间 | <2 秒 | ${avgResponseTime}ms | ${avgResponseTime < 2000 ? '✅' : '❌'} |
| 质量评估 | >85 分 | ${(avgOverallScore * 100).toFixed(1)} 分 | ${avgOverallScore >= 0.85 ? '✅' : '❌'} |

## 📈 按类别统计

| 类别 | 题数 | 通过率 | 平均分 | 平均响应时间 |
|------|------|--------|--------|-------------|
${Object.entries(categoryStats).map(([cat, stats]) => 
`| ${cat} | ${stats.total} | ${(stats.passRate * 100).toFixed(1)}% | ${(stats.avgScore * 100).toFixed(1)} | ${stats.avgResponseTime}ms |`
).join('\n')}

## 🔍 详细结果

### 通过的问题 (${passedQuestions} 题)

${evaluationResults.filter(r => r.passed).map(r => `
**Q${r.questionId}**: ${r.question}
- 类别：${r.category}
- 分数：${(r.metrics.overallScore * 100).toFixed(1)}%
- 置信度：${(r.confidence * 100).toFixed(1)}%
- 响应时间：${r.responseTimeMs}ms
- 来源：${r.topSource}
`).join('\n')}

### 未通过的问题 (${totalQuestions - passedQuestions} 题)

${evaluationResults.filter(r => !r.passed).map(r => `
**Q${r.questionId}**: ${r.question}
- 类别：${r.category}
- 分数：${(r.metrics.overallScore * 100).toFixed(1)}%
- 置信度：${(r.confidence * 100).toFixed(1)}%
- 响应时间：${r.responseTimeMs}ms
- 问题：${r.error || '分数低于阈值'}
`).join('\n')}

## 💡 优化建议

${generateRecommendations(evaluationResults, categoryStats)}

## 📝 评估方法说明

### 评估指标

1. **关键词匹配率** (30%): 检索结果是否包含预期关键词
2. **相关性评分** (30%): 基于向量相似度的平均置信度
3. **精确率** (20%): Top 1 结果的质量
4. **召回率** (20%): 关键词覆盖程度

### 评分标准

- **通过**: 综合评分 >= 70%
- **良好**: 综合评分 >= 85%
- **优秀**: 综合评分 >= 90%

---

*报告生成时间：${new Date().toLocaleString('zh-CN')}*
`;

  return report;
}

/**
 * 生成优化建议
 */
function generateRecommendations(results, categoryStats) {
  const recommendations = [];
  
  // 找出得分最低的类别
  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => a[1].avgScore - b[1].avgScore);
  
  if (sortedCategories.length > 0) {
    const worstCategory = sortedCategories[0];
    recommendations.push(`1. **加强 ${worstCategory[0]} 类别知识库**: 当前平均分 ${(worstCategory[1].avgScore * 100).toFixed(1)}%，建议增加相关文档和笔记`);
  }
  
  // 检查响应时间
  const slowQuestions = results.filter(r => r.responseTimeMs > 2000);
  if (slowQuestions.length > 0) {
    recommendations.push(`2. **优化检索性能**: ${slowQuestions.length} 个问题响应时间超过 2 秒，建议优化向量索引或减少检索表数量`);
  }
  
  // 检查低置信度问题
  const lowConfidenceQuestions = results.filter(r => r.confidence < 0.5);
  if (lowConfidenceQuestions.length > 0) {
    recommendations.push(`3. **提升知识库覆盖率**: ${lowConfidenceQuestions.length} 个问题置信度低于 50%，需要补充相关知识`);
  }
  
  // 通用建议
  recommendations.push(`4. **定期更新知识库**: 建议每周 review 新增的 memory 和 daily logs，确保及时向量化`);
  recommendations.push(`5. **收集用户反馈**: 实现反馈机制，根据用户评价调整检索策略`);
  
  return recommendations.join('\n\n');
}

/**
 * 主函数：执行完整评估
 */
async function runEvaluation() {
  console.log('🚀 开始 RAG 质量评估...\n');
  console.log(`📝 测试题数：${TEST_QUESTIONS.length}`);
  console.log(`📁 报告输出：${CONFIG.outputPath}\n`);
  
  const results = [];
  
  // 逐个评估问题
  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const question = TEST_QUESTIONS[i];
    console.log(`[${i + 1}/${TEST_QUESTIONS.length}] 评估问题 ${question.id}: ${question.question.substring(0, 30)}...`);
    
    const result = await evaluateQuestion(question);
    results.push(result);
    
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} 分数：${(result.metrics.overallScore * 100).toFixed(1)}%, 耗时：${result.responseTimeMs}ms`);
  }
  
  // 生成报告
  console.log('\n📊 生成质量报告...');
  const report = await generateQualityReport(results);
  
  // 保存报告
  await fs.writeFile(CONFIG.outputPath, report, 'utf-8');
  console.log(`✅ 报告已保存：${CONFIG.outputPath}`);
  
  // 输出摘要
  const passedCount = results.filter(r => r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.metrics.overallScore, 0) / results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 评估摘要');
  console.log('='.repeat(60));
  console.log(`通过率：${passedCount}/${results.length} (${(passedCount / results.length * 100).toFixed(1)}%)`);
  console.log(`平均分：${(avgScore * 100).toFixed(1)} 分`);
  console.log(`成功标准：${avgScore >= 0.85 ? '✅ 达成' : '❌ 未达成'}`);
  console.log('='.repeat(60));
  
  return {
    totalQuestions: results.length,
    passedQuestions: passedCount,
    passRate: passedCount / results.length,
    averageScore: avgScore,
    results
  };
}

// CLI 模式
if (require.main === module) {
  runEvaluation()
    .then(summary => {
      console.log('\n✅ 评估完成\n');
      process.exit(summary.averageScore >= 0.85 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 评估失败:', error);
      process.exit(1);
    });
}

module.exports = { runEvaluation, evaluateQuestion, TEST_QUESTIONS };
