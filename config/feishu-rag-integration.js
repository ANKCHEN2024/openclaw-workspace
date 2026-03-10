#!/usr/bin/env node
/**
 * 飞书消息系统集成 RAG
 * 在 feishu 插件中启用 RAG 检索增强
 * 
 * 使用方法：
 * 1. 在 feishu 插件配置中引入此模块
 * 2. 在消息处理流程中调用 processMessageWithRAG
 */

const http = require('http');

// RAG API 配置
const RAG_CONFIG = {
  host: process.env.RAG_API_HOST || 'localhost',
  port: process.env.RAG_API_PORT || 3030,
  timeout: 5000,  // 5 秒超时
  fallbackToDirect: true  // RAG 失败时是否降级到直接 LLM 调用
};

/**
 * 调用 RAG API
 */
async function queryRAG(query, options = {}) {
  const {
    context = '',
    topK = 5,
    sources = ['long_term_memory', 'daily_logs', 'project_docs', 'skills_kb'],
    sessionId = 'feishu-default'
  } = options;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query,
      context,
      topK,
      sources,
      sessionId,
      useContext: true,
      includeSources: true
    });
    
    const reqOptions = {
      hostname: RAG_CONFIG.host,
      port: RAG_CONFIG.port,
      path: '/api/rag/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: RAG_CONFIG.timeout
    };
    
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`RAG API 响应解析失败：${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      if (RAG_CONFIG.fallbackToDirect) {
        console.warn('⚠️ RAG API 调用失败，降级到直接 LLM 调用:', error.message);
        resolve({
          answer: query,  // 返回原始查询，由上层处理
          confidence: 0,
          sources: [],
          metadata: {
            fallback: true,
            error: error.message
          }
        });
      } else {
        reject(error);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('RAG API 请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 格式化 RAG 回答（添加引用）
 */
function formatRAGResponse(ragResponse) {
  const { answer, sources, citations, confidence, metadata } = ragResponse;
  
  if (!sources || sources.length === 0) {
    return answer;
  }
  
  // 构建引用部分
  let formattedAnswer = answer;
  
  // 如果答案中没有引用标记，自动添加
  if (!answer.match(/\[\d+\]/)) {
    formattedAnswer += '\n\n---\n📚 **信息来源**:\n';
    citations.forEach((citation, i) => {
      formattedAnswer += `\n${citation.citationText}`;
    });
    
    if (confidence > 0) {
      formattedAnswer += `\n\n🎯 置信度：${(confidence * 100).toFixed(1)}%`;
    }
    
    if (metadata && metadata.totalTimeMs) {
      formattedAnswer += `\n⏱️  响应时间：${metadata.totalTimeMs}ms`;
    }
  }
  
  return formattedAnswer;
}

/**
 * 处理飞书消息（带 RAG 增强）
 * 
 * @param {Object} message - 飞书消息对象
 * @param {Function} directLLMCall - 直接调用 LLM 的函数（降级用）
 * @returns {Promise<Object>} - 处理后的响应
 */
async function processMessageWithRAG(message, directLLMCall) {
  const {
    text,           // 用户消息文本
    sessionId,      // 会话 ID
    chatId,         // 聊天 ID
    userId,         // 用户 ID
    isMention       // 是否提及机器人
  } = message;
  
  console.log(`📨 处理飞书消息：${text.substring(0, 50)}...`);
  
  try {
    // 1. 调用 RAG API
    const ragResponse = await queryRAG(text, {
      sessionId: sessionId || `feishu-${chatId}-${userId}`,
      topK: 5,
      sources: ['long_term_memory', 'daily_logs', 'skills_kb', 'project_docs']
    });
    
    // 2. 检查是否需要降级
    if (ragResponse.metadata?.fallback) {
      console.log('⚠️ 使用降级模式');
      if (directLLMCall) {
        const directResponse = await directLLMCall(text);
        return {
          text: directResponse,
          source: 'direct-llm',
          ragUsed: false
        };
      }
    }
    
    // 3. 格式化响应
    const formattedText = formatRAGResponse(ragResponse);
    
    // 4. 返回结果
    return {
      text: formattedText,
      source: 'rag',
      ragUsed: true,
      confidence: ragResponse.confidence,
      sources: ragResponse.sources,
      metadata: ragResponse.metadata
    };
    
  } catch (error) {
    console.error('❌ RAG 处理失败:', error.message);
    
    // 降级到直接 LLM 调用
    if (directLLMCall) {
      const directResponse = await directLLMCall(text);
      return {
        text: directResponse,
        source: 'direct-llm',
        ragUsed: false,
        error: error.message
      };
    }
    
    // 错误响应
    return {
      text: `⚠️ 暂时无法获取知识库信息，请稍后再试。`,
      source: 'error',
      ragUsed: false,
      error: error.message
    };
  }
}

/**
 * 判断问题是否需要 RAG 检索
 * 一些问题可以直接回答（问候、简单事实等）
 */
function needsRAG(query) {
  // 不需要 RAG 的情况
  const skipPatterns = [
    /^hi|hello|hey|你好 | 哈喽/i,  // 问候
    /^谢谢 | 感谢|thanks/i,  // 感谢
    /^再见 | bye|拜拜/i,  // 告别
    /^在吗 | 有人吗/i,  // 打招呼
    /^\?$/,  // 单个问号
    /^。+$/,  // 句号
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(query.trim())) {
      return false;
    }
  }
  
  // 需要 RAG 的情况
  const needRAGPatterns = [
    /什么|怎么|如何 | 为什么|哪些 | 多少/i,  // 疑问词
    /解释 | 说明|介绍 | 总结/i,
    /帮助 | 建议 | 方案/i,
    /配置 | 设置 | 安装/i,
    /代码 | 脚本 | 程序/i,
  ];
  
  for (const pattern of needRAGPatterns) {
    if (pattern.test(query)) {
      return true;
    }
  }
  
  // 默认使用 RAG（长度超过 5 的问题）
  return query.trim().length > 5;
}

/**
 * 记录用户反馈
 */
async function recordFeedback(messageId, feedback, metadata = {}) {
  const feedbackData = {
    messageId,
    feedback,  // 'helpful' | 'not_helpful'
    timestamp: Date.now(),
    ...metadata
  };
  
  // 发送到反馈收集端点（如果有的话）
  // 或者写入本地日志
  console.log(`📝 用户反馈：${messageId} - ${feedback}`);
  
  // 实现反馈存储逻辑
  try {
    const feedbackPath = path.join(__dirname, '..', 'logs', 'rag-feedback.json');
    const feedbackDir = path.dirname(feedbackPath);
    
    // 确保目录存在
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }
    
    // 读取现有反馈
    let feedbacks = [];
    if (fs.existsSync(feedbackPath)) {
      const content = fs.readFileSync(feedbackPath, 'utf-8');
      feedbacks = JSON.parse(content);
    }
    
    // 添加新反馈
    feedbacks.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      feedback,
      timestamp: Date.now(),
      ...metadata
    });
    
    // 保存反馈
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbacks, null, 2), 'utf-8');
    console.log(`✅ 反馈已存储：${feedbackPath}`);
  } catch (error) {
    console.error(`❌ 存储反馈失败:`, error.message);
  }
  
  return { success: true };
}

module.exports = {
  queryRAG,
  formatRAGResponse,
  processMessageWithRAG,
  needsRAG,
  recordFeedback,
  RAG_CONFIG
};
