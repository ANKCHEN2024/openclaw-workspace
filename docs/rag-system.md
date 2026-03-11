# RAG 系统架构与实现指南

> **创建时间**: 2026-03-11  
> **作者**: MOSS  
> **版本**: v1.0  
> **适用**: 谷风科技知识库问答系统

---

## 📋 目录

1. [系统概述](#系统概述)
2. [向量数据库选型](#向量数据库选型)
3. [系统架构](#系统架构)
4. [实现步骤](#实现步骤)
5. [知识库数据结构](#知识库数据结构)
6. [API 接口](#api 接口)
7. [部署指南](#部署指南)

---

## 系统概述

### 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合向量检索和大语言模型的技术架构：

```
用户问题 → 向量检索 → 相关知识 → LLM 生成 → 带引用的回答
```

### 谷风科技 RAG 系统目标

- **项目案例查询**: "我们做过哪些智慧园区项目？"
- **技术方案咨询**: "数字孪生系统用什么技术栈？"
- **报价参考**: "类似项目大概什么价格区间？"
- **公司历史**: "谷风科技成立多久了？"

### 核心价值

| 场景 | 传统方式 | RAG 系统 |
|------|---------|---------|
| 销售查案例 | 翻 PPT/问同事 (5-10 分钟) | 即时问答 (<10 秒) |
| 技术查方案 | 搜文档/看代码 (10-30 分钟) | 精准定位 (<15 秒) |
| 报价参考 | 查历史合同 (30+ 分钟) | 智能推荐 (<20 秒) |
| 新人培训 | 老员工带 (数周) | 自助查询 (即时) |

---

## 向量数据库选型

### 主流方案对比

| 特性 | Chroma | Milvus | Pinecone | LanceDB |
|------|--------|--------|----------|---------|
| **部署方式** | 本地/云端 | 本地/云端 | 仅云端 | 本地/云端 |
| **开源许可** | Apache 2.0 | Apache 2.0 | 商业 | Apache 2.0 |
| **性能** | 中等 | 高 | 高 | 高 |
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **成本** | 免费 | 免费 | $70+/月 | 免费 |
| **适合场景** | 原型/小规模 | 大规模生产 | 免运维 | 本地优先 |

### 谷风科技推荐方案

**Phase 1 (当前)**: LanceDB
- ✅ 本地部署，零成本
- ✅ 已在工作空间集成
- ✅ 支持混合检索（向量 + 关键词）
- ✅ 适合 1000 条以内知识库

**Phase 2 (扩展)**: Milvus
- 当知识库超过 1 万条时考虑
- 支持分布式部署
- 更高并发性能

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 飞书 Bot │  │ Web 界面  │  │ CLI 工具  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      RAG API 服务          │
        │  (scripts/rag-api.js)     │
        │  - 问题解析                │
        │  - 向量检索                │
        │  - LLM 生成                │
        │  - 引用溯源                │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     向量数据库            │
        │  (LanceDB)               │
        │  - 项目案例              │
        │  - 技术方案              │
        │  - 报价数据              │
        │  - 公司资料              │
        └───────────────────────────┘
```

### 数据流

```
1. 用户提问："智慧园区项目多少钱？"
         ↓
2. 问题嵌入：将问题转换为 768 维向量
         ↓
3. 向量检索：在 LanceDB 中搜索相似文档 (top-k=5)
         ↓
4. 重排序：混合检索 + 相关性评分
         ↓
5. 上下文构建：问题 + 检索结果 → Prompt
         ↓
6. LLM 生成：通义千问生成回答
         ↓
7. 引用标注：标注信息来源和置信度
         ↓
8. 返回用户：结构化响应
```

---

## 实现步骤

### Step 1: 环境准备

```bash
# 安装依赖
npm install lancedb @anthropic-ai/sdk axios

# 验证 LanceDB
node -e "const lancedb = require('lancedb'); console.log('LanceDB OK')"
```

### Step 2: 创建知识库表

```javascript
const lancedb = require('lancedb');

async function createKnowledgeBase() {
  const db = await lancedb.connect('./data/lancedb');
  
  // 项目案例表
  const projectsTable = await db.createTable('projects', [
    {
      id: 'P-001',
      name: 'AI 短剧平台',
      category: '核心产品',
      description: 'AI 驱动的短剧创作平台...',
      tech_stack: ['React', 'Node.js', 'LanceDB'],
      budget: 500000,
      status: '开发中',
      vector: [...] // 768 维嵌入向量
    }
  ]);
  
  // 技术方案表
  const solutionsTable = await db.createTable('solutions', [...]);
  
  // 报价数据表
  const pricingTable = await db.createTable('pricing', [...]);
}
```

### Step 3: 文档嵌入

```javascript
const { DashScopeEmbedding } = require('./embedding');

async function embedDocument(text) {
  const embedding = new DashScopeEmbedding();
  const vector = await embedding.embed(text);
  return vector; // 768 维数组
}

// 批量处理
async function processDocuments(docs) {
  for (const doc of docs) {
    doc.vector = await embedDocument(doc.content);
  }
  return docs;
}
```

### Step 4: 实现检索

```javascript
async function searchKnowledge(query, options = {}) {
  const db = await lancedb.connect('./data/lancedb');
  const table = await db.openTable('projects');
  
  // 向量检索
  const queryVector = await embedDocument(query);
  const results = await table
    .search(queryVector)
    .limit(options.topK || 5)
    .execute();
  
  // 混合检索（向量 + 关键词）
  const hybridResults = await hybridSearch(query, results);
  
  // 重排序
  const rankedResults = rerankResults(hybridResults, query);
  
  return rankedResults;
}
```

### Step 5: LLM 生成

```javascript
async function generateAnswer(query, context) {
  const prompt = `
基于以下谷风科技知识库信息，回答问题：

【知识库】
${context.map(r => `- ${r.name}: ${r.description}`).join('\n')}

【问题】${query}

【要求】
1. 回答准确、专业
2. 标注信息来源
3. 如不确定，说明"需要进一步确认"
`;

  const response = await callLLM(prompt);
  return response;
}
```

---

## 知识库数据结构

### 项目案例表 (projects)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 项目编号 (P-001) |
| name | string | 项目名称 |
| category | string | 分类 (核心产品/AI 能力/培训产品) |
| description | text | 详细描述 |
| tech_stack | array | 技术栈 |
| budget | number | 预算/报价 |
| status | string | 状态 (开发中/已完成/规划中) |
| github | string | GitHub 仓库 |
| created_at | date | 创建时间 |
| vector | array | 768 维嵌入向量 |

### 技术方案表 (solutions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 方案编号 (S-001) |
| name | string | 方案名称 |
| domain | string | 领域 (数字孪生/AI/可视化) |
| architecture | text | 架构描述 |
| components | array | 核心组件 |
| pros_cons | object | 优缺点 |
| vector | array | 768 维嵌入向量 |

### 报价数据表 (pricing)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 报价编号 |
| project_type | string | 项目类型 |
| scope | string | 范围描述 |
| min_price | number | 最低报价 |
| max_price | number | 最高报价 |
| avg_price | number | 平均报价 |
| factors | array | 影响价格因素 |
| vector | array | 768 维嵌入向量 |

### 公司资料表 (company)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 资料编号 |
| category | string | 分类 (历史/团队/资质) |
| title | string | 标题 |
| content | text | 内容 |
| vector | array | 768 维嵌入向量 |

---

## API 接口

### RAG 查询接口

```http
POST /api/rag/query
Content-Type: application/json

{
  "query": "智慧园区项目多少钱？",
  "topK": 5,
  "category": "pricing",
  "conversationId": "conv_123"
}
```

**响应**:
```json
{
  "answer": "根据谷风科技历史项目，智慧园区类项目报价区间为...",
  "confidence": 0.92,
  "sources": [
    {
      "id": "P-005",
      "name": "某智慧园区项目",
      "relevance": 0.95
    }
  ],
  "citations": ["[1] P-005: 某智慧园区项目"],
  "metadata": {
    "searchTimeMs": 156,
    "llmTimeMs": 823,
    "totalTimeMs": 979
  }
}
```

### 对话历史接口

```http
GET /api/rag/history?conversationId=conv_123
```

### 清除历史接口

```http
POST /api/rag/clear
{
  "conversationId": "conv_123"
}
```

---

## 部署指南

### 本地开发

```bash
# 1. 启动 RAG API
node scripts/rag-api.js

# 2. 测试查询
curl -X POST http://localhost:3030/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "谷风科技有哪些项目？"}'
```

### 生产部署

```bash
# 使用 PM2 管理
pm2 start scripts/rag-api.js --name rag-api

# 配置 Nginx 反向代理
# 参考 docs/DEPLOYMENT_P4.md
```

### 监控与日志

```javascript
// 日志记录
const logger = {
  query: (q, results) => console.log(`[RAG] Query: ${q}, Results: ${results.length}`),
  error: (e) => console.error(`[RAG] Error: ${e.message}`),
  performance: (ms) => console.log(`[RAG] Performance: ${ms}ms`)
};
```

---

## 示例代码

完整示例见：`examples/rag-gufeng/`

```bash
# 运行 Demo
cd examples/rag-gufeng
node demo.js
```

---

## 下一步

- [ ] 添加更多项目案例（目标：50+）
- [ ] 集成飞书 Bot
- [ ] 实现多轮对话
- [ ] 添加用户反馈机制
- [ ] 性能优化（缓存、批处理）

---

*文档由 MOSS 生成，最后更新：2026-03-11*
