#!/usr/bin/env node
/**
 * RAG 知识库 API
 * 提供 HTTP 接口用于检索增强生成
 */

const http = require('http');
const url = require('url');
const { optimizedSearch, addConversation, clearConversation } = require('./optimize-vector-search');
const { pipeline } = require('@xenova/transformers');

// 配置
const CONFIG = {
  port: process.env.RAG_API_PORT || 3030,
  host: process.env.RAG_API_HOST || 'localhost',
  
  // LLM 配置（使用 DashScope/通义千问）
  llm: {
    provider: process.env.LLM_PROVIDER || 'dashscope',
    model: process.env.LLM_MODEL || 'qwen-plus',
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    maxTokens: 2000,
    temperature: 0.7
  },
  
  // RAG 配置
  rag: {
    defaultTopK: 5,
    maxTopK: 10,
    minConfidence: 0.3,  // 最低置信度阈值
    includeSources: true,
    useContextWindow: true
  }
};

// 对话历史存储（内存，生产环境应使用数据库）
const conversationStore = new Map();

/**
 * 调用 LLM 生成回答
 */
async function generateAnswer(question, context, sources) {
  if (!CONFIG.llm.apiKey) {
    console.warn('⚠️ 未配置 LLM API Key，返回检索结果');
    return {
      answer: formatRetrievalOnlyResponse(question, context, sources),
      model: 'retrieval-only',
      usage: { tokens: 0 }
    };
  }
  
  // 构建提示词
  const systemPrompt = `你是一个专业的 AI 助手，基于提供的知识库内容回答问题。
  
要求：
1. 准确引用信息来源（使用 [1]、[2] 等标记）
2. 如果知识库中没有相关信息，诚实地说明
3. 回答简洁明了，避免冗余
4. 使用中文回答`;

  const userPrompt = `知识库内容：
${context}

问题：${question}

请基于以上知识库内容回答问题，并在回答中标注引用来源。`;

  try {
    // 调用 DashScope API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.llm.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.llm.model,
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        },
        parameters: {
          max_tokens: CONFIG.llm.maxTokens,
          temperature: CONFIG.llm.temperature,
          result_format: 'message'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`LLM API 请求失败：${response.status}`);
    }
    
    const data = await response.json();
    const answer = data.output?.choices?.[0]?.message?.content || '无法生成回答';
    const usage = data.usage || { tokens: 0 };
    
    return {
      answer,
      model: CONFIG.llm.model,
      usage
    };
  } catch (error) {
    console.error('❌ LLM 调用失败:', error.message);
    return {
      answer: formatRetrievalOnlyResponse(question, context, sources),
      model: 'retrieval-only',
      usage: { tokens: 0 },
      error: error.message
    };
  }
}

/**
 * 格式化纯检索结果（无 LLM）
 */
function formatRetrievalOnlyResponse(question, context, sources) {
  let response = `基于知识库检索，找到 ${sources.length} 个相关信息：\n\n`;
  
  sources.forEach((source, i) => {
    response += `[${i + 1}] ${source.source}\n`;
    response += `   置信度：${(source.score * 100).toFixed(1)}%\n`;
    response += `   内容：${source.content.substring(0, 200)}...\n\n`;
  });
  
  return response;
}

/**
 * 计算答案置信度
 */
function calculateConfidence(results) {
  if (!results || results.length === 0) return 0;
  
  // 基于 top 结果的分数计算
  const topScore = results[0]?.score || 0;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  
  // 加权计算：top 结果权重 60%，平均分数权重 40%
  const confidence = topScore * 0.6 + avgScore * 0.4;
  
  return Math.min(Math.max(confidence, 0), 1);  // 限制在 0-1 之间
}

/**
 * 处理 RAG 查询请求
 */
async function handleRAGQuery(requestBody) {
  const {
    query,
    context = '',
    topK = CONFIG.rag.defaultTopK,
    sources = ['long_term_memory', 'daily_logs', 'project_docs', 'skills_kb'],
    sessionId = 'default',
    useContext = CONFIG.rag.useContextWindow,
    includeSources = CONFIG.rag.includeSources
  } = requestBody;
  
  if (!query || query.trim().length === 0) {
    throw new Error('查询内容不能为空');
  }
  
  console.log(`\n📥 收到 RAG 查询：${query.substring(0, 50)}...`);
  
  // 1. 执行检索
  const startTime = Date.now();
  const searchResults = await optimizedSearch(query, {
    topK: Math.min(topK, CONFIG.rag.maxTopK),
    sources,
    useContext
  });
  
  const searchTime = Date.now() - startTime;
  console.log(`⏱️  检索耗时：${searchTime}ms`);
  
  // 2. 过滤低置信度结果
  const filteredResults = searchResults.results.filter(
    r => r.score >= CONFIG.rag.minConfidence
  );
  
  // 3. 构建上下文
  const contextText = filteredResults.map((r, i) => {
    return `[${i + 1}] (${r.source}) ${r.content}`;
  }).join('\n\n');
  
  // 4. 生成回答
  const llmStartTime = Date.now();
  const llmResult = await generateAnswer(query, contextText, filteredResults);
  const llmTime = Date.now() - llmStartTime;
  console.log(`⏱️  LLM 生成耗时：${llmTime}ms`);
  
  // 5. 计算置信度
  const confidence = calculateConfidence(filteredResults);
  
  // 6. 保存到对话历史
  if (useContext) {
    if (!conversationStore.has(sessionId)) {
      conversationStore.set(sessionId, []);
    }
    const sessionHistory = conversationStore.get(sessionId);
    sessionHistory.push({
      query,
      answer: llmResult.answer,
      timestamp: Date.now()
    });
    
    // 保持最近 10 轮
    if (sessionHistory.length > 10) {
      sessionHistory.shift();
    }
    
    // 更新优化检索模块的上下文
    addConversation(query, llmResult.answer);
  }
  
  // 7. 构建响应
  const response = {
    answer: llmResult.answer,
    confidence: parseFloat(confidence.toFixed(2)),
    sources: includeSources ? filteredResults.map(r => ({
      content: r.content,
      source: r.source,
      sourcePath: r.sourcePath,
      score: parseFloat(r.score.toFixed(3)),
      table: r.table
    })) : undefined,
    citations: includeSources ? searchResults.citations : undefined,
    metadata: {
      searchTimeMs: searchTime,
      llmTimeMs: llmTime,
      totalTimeMs: searchTime + llmTime,
      model: llmResult.model,
      tokensUsed: llmResult.usage?.tokens || 0,
      resultsCount: filteredResults.length,
      sessionId
    }
  };
  
  console.log(`✅ RAG 查询完成，置信度：${(confidence * 100).toFixed(1)}%`);
  
  return response;
}

/**
 * 处理对话历史请求
 */
function handleConversationHistory(sessionId) {
  const history = conversationStore.get(sessionId) || [];
  return {
    sessionId,
    history,
    count: history.length
  };
}

/**
 * 清除对话历史
 */
function handleClearConversation(sessionId) {
  if (sessionId) {
    conversationStore.delete(sessionId);
    clearConversation();
    return { success: true, message: `会话 ${sessionId} 已清除` };
  } else {
    conversationStore.clear();
    clearConversation();
    return { success: true, message: '所有会话已清除' };
  }
}

/**
 * HTTP 服务器
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // 路由处理
    if (pathname === '/api/rag/query' && method === 'POST') {
      // RAG 查询
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const requestBody = JSON.parse(body);
          const response = await handleRAGQuery(requestBody);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    } else if (pathname === '/api/rag/history' && method === 'GET') {
      // 获取对话历史
      const sessionId = parsedUrl.query.sessionId || 'default';
      const response = handleConversationHistory(sessionId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } else if (pathname === '/api/rag/clear' && method === 'POST') {
      // 清除对话历史
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const requestBody = body ? JSON.parse(body) : {};
          const response = handleClearConversation(requestBody.sessionId);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    } else if (pathname === '/health' && method === 'GET') {
      // 健康检查
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0'
      }));
    } else {
      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  } catch (error) {
    console.error('❌ 服务器错误:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
  }
});

// 启动服务器
server.listen(CONFIG.port, CONFIG.host, () => {
  console.log('='.repeat(60));
  console.log('🚀 RAG API 服务器已启动');
  console.log(`📍 地址：http://${CONFIG.host}:${CONFIG.port}`);
  console.log(`📊 LLM Provider: ${CONFIG.llm.provider}`);
  console.log(`🤖 Model: ${CONFIG.llm.model}`);
  console.log(`⚙️  TopK: ${CONFIG.rag.defaultTopK}`);
  console.log('='.repeat(60));
  console.log('\n可用端点:');
  console.log('  POST /api/rag/query    - RAG 查询');
  console.log('  GET  /api/rag/history  - 获取对话历史');
  console.log('  POST /api/rag/clear    - 清除对话历史');
  console.log('  GET  /health           - 健康检查');
  console.log('\n示例请求:');
  console.log(`  curl -X POST http://${CONFIG.host}:${CONFIG.port}/api/rag/query \\`);
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"query": "Subagent 如何工作？", "topK": 5}\'');
  console.log('\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

module.exports = { handleRAGQuery, CONFIG };
