#!/usr/bin/env node
/**
 * 优化向量检索脚本
 * 实现混合检索（向量 + 关键词）、重排序、多轮对话上下文感知、引用溯源
 */

const lancedb = require('@lancedb/lancedb');
const fs = require('fs').promises;
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// 配置
const CONFIG = {
  lancedbPath: '/Users/chenggl/workspace/lancedb',
  workspacePath: '/Users/chenggl/workspace',
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  tables: {
    longTermMemory: 'long_term_memory',
    dailyLogs: 'daily_logs',
    projectDocs: 'project_docs',
    skillsKb: 'skills_kb',
    learningNotes: 'learning_notes',
    conversationHistory: 'conversation_history'
  },
  // 检索配置
  search: {
    defaultTopK: 5,
    maxTopK: 20,
    vectorWeight: 0.7,      // 向量检索权重
    keywordWeight: 0.3,     // 关键词检索权重
    recalculateScore: true  // 是否重新计算混合分数
  }
};

// 嵌入模型实例（懒加载）
let embedder = null;
let reranker = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('🔄 加载嵌入模型...');
    embedder = await pipeline('feature-extraction', CONFIG.embeddingModel);
    console.log('✅ 嵌入模型加载完成');
  }
  return embedder;
}

// 生成文本嵌入
async function embedText(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * 关键词检索（BM25 简化版）
 * 基于词频和逆文档频率计算相似度
 */
async function keywordSearch(query, results, maxResults = 20) {
  const queryTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)  // 过滤短词
    .map(term => term.replace(/[^\w\u4e00-\u9fff]/g, ''));  // 保留中英文
  
  if (queryTerms.length === 0) return results;
  
  // 为每个结果计算关键词匹配分数
  const scoredResults = results.map(result => {
    const content = result.content?.toLowerCase() || '';
    let matchScore = 0;
    
    for (const term of queryTerms) {
      if (!term) continue;
      
      // 精确匹配
      const exactMatches = (content.match(new RegExp(term, 'g')) || []).length;
      matchScore += exactMatches * 2;
      
      // 部分匹配（中文分词简化处理）
      if (term.length >= 3) {
        const partialMatches = (content.match(new RegExp(term.substring(0, 2), 'g')) || []).length;
        matchScore += partialMatches * 0.5;
      }
    }
    
    // 归一化到 0-1
    const normalizedScore = Math.min(matchScore / (queryTerms.length * 5), 1);
    
    return {
      ...result,
      keywordScore: normalizedScore
    };
  });
  
  return scoredResults;
}

/**
 * 混合检索：结合向量检索和关键词检索
 */
async function hybridSearch(query, options = {}) {
  const {
    topK = CONFIG.search.defaultTopK,
    sources = ['long_term_memory', 'daily_logs', 'project_docs', 'skills_kb'],
    context = ''  // 对话历史上下文
  } = options;
  
  console.log(`🔍 执行混合检索：query="${query.substring(0, 50)}...", topK=${topK}`);
  
  // 1. 如果有对话上下文，增强查询
  let enhancedQuery = query;
  if (context) {
    enhancedQuery = `${context}\n${query}`;
    console.log(`  📝 使用对话上下文增强查询`);
  }
  
  // 2. 生成查询向量
  const queryEmbedding = await embedText(enhancedQuery);
  
  // 3. 从多个表检索
  const db = await lancedb.connect(CONFIG.lancedbPath);
  const allResults = [];
  
  for (const tableName of sources) {
    try {
      const table = await db.openTable(tableName);
      const results = await table
        .search(queryEmbedding)
        .limit(Math.min(topK * 2, CONFIG.search.maxTopK))  // 先取更多结果用于重排序
        .execute();
      
      // 处理结果
      for await (const batch of results) {
        for (let i = 0; i < batch.numRows; i++) {
          const row = batch.get(i);
          const distance = row._distance ?? 0;
          
          allResults.push({
            table: tableName,
            content: row.content?.toString() || '',
            source: row.source?.toString() || 'unknown',
            sourcePath: row.sourcePath?.toString() || '',
            chunkIndex: row.chunkIndex ?? 0,
            totalChunks: row.totalChunks ?? 0,
            vectorScore: 1 - distance,  // 向量相似度分数
            keywordScore: 0,  // 待计算
            finalScore: 0     // 混合分数
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ 表 ${tableName} 检索失败：${error.message}`);
    }
  }
  
  console.log(`  📊 初步检索到 ${allResults.length} 个结果`);
  
  // 4. 关键词检索评分
  const keywordScoredResults = await keywordSearch(query, allResults);
  
  // 5. 计算混合分数
  const mixedResults = keywordScoredResults.map(result => {
    const finalScore = (
      result.vectorScore * CONFIG.search.vectorWeight +
      result.keywordScore * CONFIG.search.keywordWeight
    );
    
    return {
      ...result,
      finalScore
    };
  });
  
  // 6. 按混合分数排序
  mixedResults.sort((a, b) => b.finalScore - a.finalScore);
  
  // 7. 取 topK
  const topResults = mixedResults.slice(0, topK);
  
  console.log(`  ✅ 返回 top ${topResults.length} 个结果`);
  
  return topResults;
}

/**
 * 多轮对话上下文管理
 * 维护最近 N 轮对话历史，用于增强检索
 */
class ConversationContext {
  constructor(maxTurns = 5) {
    this.maxTurns = maxTurns;
    this.history = [];
  }
  
  addTurn(userQuery, assistantResponse) {
    this.history.push({
      user: userQuery,
      assistant: assistantResponse,
      timestamp: Date.now()
    });
    
    // 保持最大轮数
    if (this.history.length > this.maxTurns) {
      this.history.shift();
    }
  }
  
  getContext() {
    if (this.history.length === 0) return '';
    
    const contextParts = this.history.map((turn, i) => {
      return `Q${i + 1}: ${turn.user}\nA${i + 1}: ${turn.assistant}`;
    });
    
    return contextParts.join('\n\n');
  }
  
  clear() {
    this.history = [];
  }
}

// 全局对话上下文实例
const conversationContext = new ConversationContext(5);

/**
 * 检索结果重排序（Reranking）
 * 使用更精细的评分策略
 */
async function rerankResults(results, query) {
  console.log(`  🔄 执行重排序...`);
  
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const rerankedResults = results.map(result => {
    const content = result.content.toLowerCase();
    let bonusScore = 0;
    
    // 1. 标题/开头加分（假设更重要）
    const firstSentence = content.split(/[.!?]/)[0];
    for (const term of queryTerms) {
      if (firstSentence.includes(term)) {
        bonusScore += 0.1;
      }
    }
    
    // 2. 来源可信度加分
    const sourceBonus = {
      'MEMORY.md': 0.15,
      'long_term_memory': 0.1,
      'skills_kb': 0.05,
      'project_docs': 0.05
    };
    bonusScore += sourceBonus[result.source] || 0;
    
    // 3. 内容长度适中加分（避免太短或太长）
    const contentLength = result.content.length;
    if (contentLength > 100 && contentLength < 1000) {
      bonusScore += 0.05;
    }
    
    // 4. 最近内容加分（基于 chunkIndex 和 totalChunks）
    if (result.totalChunks > 0 && result.chunkIndex === result.totalChunks - 1) {
      bonusScore += 0.03;  // 最后一个块可能是总结
    }
    
    return {
      ...result,
      rerankScore: result.finalScore + bonusScore,
      bonusScore
    };
  });
  
  // 按重排序分数排序
  rerankedResults.sort((a, b) => b.rerankScore - a.rerankScore);
  
  return rerankedResults;
}

/**
 * 生成引用溯源信息
 */
function generateCitation(result, index) {
  const sourceInfo = {
    id: index + 1,
    source: result.source,
    sourcePath: result.sourcePath,
    table: result.table,
    chunkIndex: result.chunkIndex,
    confidence: (result.finalScore * 100).toFixed(1) + '%',
    preview: result.content.substring(0, 150).replace(/\n/g, ' ') + '...'
  };
  
  // 生成可读的引用格式
  let citationText = `[${sourceInfo.id}] ${sourceInfo.source}`;
  if (sourceInfo.sourcePath) {
    const relativePath = path.relative(CONFIG.workspacePath, sourceInfo.sourcePath);
    citationText += ` (${relativePath})`;
  }
  citationText += ` - 置信度：${sourceInfo.confidence}`;
  
  return {
    ...sourceInfo,
    citationText
  };
}

/**
 * 主检索函数：整合所有优化
 */
async function optimizedSearch(query, options = {}) {
  const {
    topK = CONFIG.search.defaultTopK,
    sources = Object.values(CONFIG.tables),
    useContext = true,
    enableRerank = true
  } = options;
  
  console.log('\n🚀 开始优化检索...\n');
  
  // 1. 获取对话上下文
  let context = '';
  if (useContext) {
    context = conversationContext.getContext();
    if (context) {
      console.log(`📝 使用对话上下文 (${conversationContext.history.length} 轮)`);
    }
  }
  
  // 2. 执行混合检索
  const results = await hybridSearch(query, { topK: topK * 2, sources, context });
  
  // 3. 重排序
  let finalResults = results;
  if (enableRerank && results.length > 0) {
    finalResults = await rerankResults(results, query);
    finalResults = finalResults.slice(0, topK);
  }
  
  // 4. 生成引用溯源
  const citations = finalResults.map((result, i) => generateCitation(result, i));
  
  // 5. 格式化输出
  const output = {
    query,
    results: finalResults.map(r => ({
      content: r.content,
      source: r.source,
      sourcePath: r.sourcePath,
      table: r.table,
      score: r.finalScore,
      rerankScore: r.rerankScore,
      chunkIndex: r.chunkIndex
    })),
    citations,
    metadata: {
      totalResults: finalResults.length,
      searchTime: Date.now(),
      useContext: !!context,
      rerankEnabled: enableRerank
    }
  };
  
  console.log('\n✅ 检索完成\n');
  
  return output;
}

/**
 * 添加对话到上下文
 */
function addConversation(userQuery, assistantResponse) {
  conversationContext.addTurn(userQuery, assistantResponse);
}

/**
 * 清除对话上下文
 */
function clearConversation() {
  conversationContext.clear();
}

// 导出函数
module.exports = {
  optimizedSearch,
  hybridSearch,
  keywordSearch,
  rerankResults,
  addConversation,
  clearConversation,
  conversationContext,
  CONFIG
};

// CLI 模式：如果直接运行，执行测试
if (require.main === module) {
  (async () => {
    console.log('🧪 测试优化检索功能\n');
    
    const testQueries = [
      'Subagent 如何协调任务？',
      '磊哥的业务方向是什么？',
      '如何配置 cron 定时任务？',
      'RAG 系统怎么工作？'
    ];
    
    for (const query of testQueries) {
      console.log('\n' + '='.repeat(60));
      console.log(`🔍 查询：${query}`);
      console.log('='.repeat(60));
      
      const results = await optimizedSearch(query, { topK: 3 });
      
      console.log('\n📋 检索结果:');
      for (const citation of results.citations) {
        console.log(`\n${citation.citationText}`);
        console.log(`   预览：${citation.preview}`);
      }
      
      // 模拟添加到对话上下文
      addConversation(query, '基于检索结果的回答...');
    }
    
    console.log('\n✅ 测试完成\n');
    process.exit(0);
  })();
}
