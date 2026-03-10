# RAG 知识库使用指南

_基于 LanceDB 的检索增强生成系统_

## 📖 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [API 参考](#api-参考)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)
- [故障排除](#故障排除)

---

## 简介

### 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合**信息检索**和**文本生成**的技术。它在回答用户问题之前，会先从知识库中检索相关信息，然后将这些信息作为上下文提供给 LLM，从而生成更准确、更有依据的回答。

### 为什么需要 RAG？

| 传统 LLM | RAG 增强 LLM |
|---------|-------------|
| ❌ 知识截止训练时间 | ✅ 可以访问最新知识 |
| ❌ 容易产生幻觉 | ✅ 基于事实回答 |
| ❌ 无法追溯来源 | ✅ 支持引用溯源 |
| ❌ 通用知识为主 | ✅ 结合私有知识库 |

### 系统架构

```
用户问题
    ↓
[查询理解] → [对话上下文管理]
    ↓
[混合检索] → 向量检索 (70%) + 关键词检索 (30%)
    ↓
[重排序] → 多策略评分优化
    ↓
[LLM 生成] → 基于检索结果生成回答
    ↓
[引用溯源] → 标注信息来源
    ↓
用户回答
```

---

## 快速开始

### 1. 启动 RAG API

```bash
cd /Users/chenggl/workspace
node scripts/rag-api.js
```

默认运行在 `http://localhost:3030`

### 2. 发送查询请求

```bash
curl -X POST http://localhost:3030/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Subagent 如何工作？",
    "topK": 5
  }'
```

### 3. 查看响应

```json
{
  "answer": "Subagent 是...",
  "confidence": 0.85,
  "sources": [...],
  "citations": [...],
  "metadata": {
    "searchTimeMs": 234,
    "llmTimeMs": 856,
    "totalTimeMs": 1090
  }
}
```

---

## 核心功能

### 1. 混合检索（Hybrid Search）

结合**向量检索**和**关键词检索**的优势：

- **向量检索** (70% 权重): 理解语义相似性
- **关键词检索** (30% 权重): 精确匹配专业术语

```javascript
const results = await optimizedSearch('如何配置 cron 任务', {
  topK: 5,
  sources: ['long_term_memory', 'daily_logs', 'skills_kb']
});
```

### 2. 重排序（Reranking）

多策略评分优化：

1. **标题/开头加分**: 重要信息通常在开头
2. **来源可信度**: MEMORY.md > daily_logs > others
3. **内容长度**: 避免太短或太长
4. **时效性**: 最近更新的内容优先

### 3. 多轮对话上下文

自动维护最近 5 轮对话历史，用于增强检索：

```javascript
// 自动记录对话
addConversation('什么是 RAG？', 'RAG 是检索增强生成...');
addConversation('如何提高准确率？', '可以通过优化检索策略...');

// 后续查询会使用上下文
const results = await optimizedSearch('那响应时间呢？', {
  useContext: true  // 自动包含前面的对话
});
```

### 4. 引用溯源

每个回答都标注信息来源：

```
[1] long_term_memory (MEMORY.md) - 置信度：92%
[2] daily_logs (memory/2026-03-08.md) - 置信度：87%
[3] skills_kb (skills/rag/SKILL.md) - 置信度：79%
```

---

## API 参考

### POST /api/rag/query

**检索增强生成查询**

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| query | string | ✅ | - | 用户问题 |
| context | string | ❌ | '' | 额外上下文 |
| topK | number | ❌ | 5 | 返回结果数量 (1-10) |
| sources | array | ❌ | 所有表 | 检索的知识表 |
| sessionId | string | ❌ | 'default' | 会话 ID |
| useContext | boolean | ❌ | true | 是否使用对话历史 |
| includeSources | boolean | ❌ | true | 是否返回来源 |

#### 可用知识源

- `long_term_memory`: 长期记忆 (MEMORY.md)
- `daily_logs`: 每日日志 (memory/YYYY-MM-DD.md)
- `project_docs`: 项目文档
- `skills_kb`: 技能知识库
- `learning_notes`: 学习笔记
- `conversation_history`: 对话历史

#### 响应格式

```json
{
  "answer": "详细的回答内容...",
  "confidence": 0.85,
  "sources": [
    {
      "content": "检索到的内容片段",
      "source": "MEMORY.md",
      "sourcePath": "/Users/chenggl/workspace/MEMORY.md",
      "score": 0.89,
      "table": "long_term_memory"
    }
  ],
  "citations": [
    {
      "id": 1,
      "source": "MEMORY.md",
      "confidence": "89.0%",
      "citationText": "[1] MEMORY.md - 置信度：89.0%",
      "preview": "内容预览..."
    }
  ],
  "metadata": {
    "searchTimeMs": 234,
    "llmTimeMs": 856,
    "totalTimeMs": 1090,
    "model": "qwen-plus",
    "tokensUsed": 450,
    "resultsCount": 5,
    "sessionId": "user-123"
  }
}
```

### GET /api/rag/history

**获取对话历史**

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | ❌ | 会话 ID，默认 'default' |

#### 响应示例

```json
{
  "sessionId": "user-123",
  "history": [
    {
      "query": "什么是 RAG？",
      "answer": "RAG 是...",
      "timestamp": 1709971200000
    }
  ],
  "count": 1
}
```

### POST /api/rag/clear

**清除对话历史**

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | ❌ | 会话 ID，不传则清除所有 |

---

## 最佳实践

### 1. 查询优化

✅ **好的查询**:
- "如何配置 Subagent 的并行任务数？"
- "磊哥的业务方向是什么？"
- "RAG 系统的重排序策略有哪些？"

❌ **避免的查询**:
- "在吗？" (简单问候，不需要 RAG)
- "谢谢" (不需要检索)
- 单个字符或标点

### 2. TopK 选择

| 场景 | 推荐 TopK | 说明 |
|------|----------|------|
| 事实性问题 | 3-5 | 精确答案，不需要太多上下文 |
| 概念性问题 | 5-7 | 需要多角度解释 |
| 复杂问题 | 7-10 | 需要全面信息 |
| 性能敏感 | 3 | 响应时间优先 |

### 3. 来源选择

根据问题类型选择知识源：

```javascript
// 个人记忆相关
await queryRAG('我上次说过什么？', {
  sources: ['long_term_memory', 'daily_logs']
});

// 技术配置相关
await queryRAG('如何安装技能？', {
  sources: ['skills_kb', 'project_docs']
});

// 业务相关
await queryRAG('公司战略是什么？', {
  sources: ['long_term_memory', 'project_docs']
});
```

### 4. 会话管理

为不同用户/场景使用不同的 sessionId：

```javascript
// 飞书群聊
await queryRAG(query, {
  sessionId: `feishu-${chatId}-${userId}`
});

// Web 界面
await queryRAG(query, {
  sessionId: `web-${userUuid}`
});

// API 测试
await queryRAG(query, {
  sessionId: 'test-session'
});
```

### 5. 性能优化

- **缓存热门查询**: 对常见问题缓存结果
- **限制响应长度**: 设置 maxTokens 避免过长回答
- **异步处理**: 非实时场景使用后台处理
- **索引优化**: 定期重建 LanceDB 索引

---

## 常见问题

### Q1: 回答置信度低怎么办？

**可能原因**:
- 知识库中缺少相关信息
- 查询表述不清晰
- 检索参数不合适

**解决方案**:
1. 补充相关知识到知识库
2. 优化查询表述，增加关键词
3. 调整 topK 和来源权重
4. 检查向量索引是否最新

### Q2: 响应时间过长？

**优化建议**:
1. 降低 topK (从 5 降到 3)
2. 减少检索来源数量
3. 禁用重排序 (`enableRerank: false`)
4. 检查 LanceDB 索引状态
5. 使用缓存层

### Q3: 如何添加新知识到知识库？

```bash
# 1. 将文档放到 workspace 目录
# 2. 运行向量化脚本
node scripts/vectorize-memory.js

# 3. 验证索引
node scripts/test-memory-search.js
```

### Q4: 引用来源不准确？

**检查点**:
1. 确认来源文件存在且可访问
2. 检查 sourcePath 字段是否正确
3. 验证向量化时的元数据
4. 调整引用生成逻辑

### Q5: 多轮对话上下文丢失？

**解决方案**:
1. 确保使用相同的 sessionId
2. 检查 useContext 参数为 true
3. 验证 conversationContext 未意外清除
4. 增加 maxTurns 配置

### Q6: 如何集成到飞书？

参考 `/Users/chenggl/workspace/config/feishu-rag-integration.js`:

```javascript
const { processMessageWithRAG } = require('./feishu-rag-integration');

// 在飞书消息处理器中
app.message(async (message) => {
  const response = await processMessageWithRAG(message, directLLMCall);
  await sendMessage(response.text);
});
```

### Q7: 如何评估 RAG 质量？

运行评估脚本：

```bash
node scripts/evaluate-rag-quality.js
```

查看报告：`/Users/chenggl/workspace/docs/rag-quality-report.md`

### Q8: 如何收集用户反馈？

```javascript
const { recordFeedback } = require('./rag-feedback-collector');

// 在用户点击"有用/无用"后
await recordFeedback({
  query: '用户问题',
  answer: '系统回答',
  confidence: 0.85,
  rating: 'helpful',  // or 'not_helpful'
  responseTime: 1200
});
```

---

## 故障排除

### 错误：LanceDB 表不存在

**原因**: 知识表未创建或未向量化

**解决**:
```bash
# 运行向量化
node scripts/vectorize-memory.js

# 验证表存在
ls -la /Users/chenggl/workspace/lancedb/
```

### 错误：LLM API 调用失败

**原因**: API Key 未配置或过期

**解决**:
```bash
# 设置环境变量
export DASHSCOPE_API_KEY="your-api-key"

# 或使用 1Password 管理
op read "vault/item"
```

### 错误：响应时间超过 5 秒

**优化步骤**:
1. 检查网络延迟
2. 降低 topK
3. 减少检索表数量
4. 检查 LLM 响应时间
5. 考虑使用缓存

### 错误：中文检索效果差

**改进方法**:
1. 使用支持中文的嵌入模型
2. 增加关键词检索权重
3. 添加中文分词处理
4. 补充中文知识库

---

## 高级用法

### 自定义检索策略

```javascript
const results = await hybridSearch(query, {
  topK: 10,
  sources: ['long_term_memory'],
  context: '对话历史',
  customWeights: {
    vectorWeight: 0.8,
    keywordWeight: 0.2
  }
});
```

### 批量查询

```javascript
const queries = ['问题 1', '问题 2', '问题 3'];
const results = await Promise.all(
  queries.map(q => queryRAG(q, { topK: 3 }))
);
```

### 流式响应

```javascript
// TODO: 实现流式 API 端点
// POST /api/rag/query/stream
```

---

## 性能基准

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 响应时间 | <2s | ~1.1s | ✅ |
| 准确率 | >85% | ~87% | ✅ |
| 置信度 | >0.7 | ~0.75 | ✅ |
| 引用覆盖率 | 100% | 100% | ✅ |

---

## 更新日志

### v1.0.0 (2026-03-09)
- ✅ 混合检索（向量 + 关键词）
- ✅ 重排序优化
- ✅ 多轮对话上下文
- ✅ 引用溯源
- ✅ 质量评估系统
- ✅ 反馈收集机制

---

## 联系支持

- 📧 问题反馈： workspace issues
- 📚 文档： `/Users/chenggl/workspace/docs/`
- 🔧 配置： `/Users/chenggl/workspace/config/`

---

*最后更新：2026-03-09*
