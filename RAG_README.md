# RAG 知识库增强系统

> 基于 LanceDB 的检索增强生成（RAG）系统，提升 AI 回答质量和准确性

## 🎯 目标

- ✅ 回答准确率提升 30%+
- ✅ 支持引用来源追溯
- ✅ 响应时间 <2 秒
- ✅ 质量评估 >85 分

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/chenggl/workspace
npm install @lancedb/lancedb @xenova/transformers
```

### 2. 配置环境变量

```bash
export DASHSCOPE_API_KEY="your-api-key"
```

### 3. 向量化知识库

```bash
node scripts/vectorize-memory.js
```

### 4. 启动 RAG API

```bash
node scripts/rag-api.js
```

### 5. 测试查询

```bash
curl -X POST http://localhost:3030/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Subagent 如何工作？", "topK": 5}'
```

## 📚 文档

- **[使用指南](docs/rag-user-guide.md)** - 完整 API 参考和最佳实践
- **[实施总结](docs/rag-implementation-summary.md)** - 技术架构和交付物详情
- **[质量报告](docs/rag-quality-report.md)** - 自动生成的评估报告

## 📁 项目结构

```
workspace/
├── scripts/
│   ├── optimize-vector-search.js    # 向量检索优化（混合检索 + 重排序）
│   ├── rag-api.js                   # RAG API 服务
│   ├── evaluate-rag-quality.js      # 质量评估（50 题测试集）
│   ├── rag-feedback-collector.js    # 反馈收集与优化
│   └── vectorize-memory.js          # 知识向量化
├── config/
│   └── feishu-rag-integration.js    # 飞书消息集成
├── docs/
│   ├── rag-user-guide.md            # 用户使用指南
│   ├── rag-implementation-summary.md # 实施总结
│   └── rag-quality-report.md        # 质量评估报告
└── lancedb/                         # 向量数据库
```

## 🔧 核心功能

### 1. 混合检索
- 向量检索 (70%) + 关键词检索 (30%)
- 支持多表联合查询
- 自动查询增强（对话上下文）

### 2. 智能重排序
- 标题/开头内容加分
- 来源可信度评估
- 内容长度优化
- 时效性加权

### 3. 多轮对话
- 自动维护最近 5 轮对话
- 上下文感知检索
- 会话隔离管理

### 4. 引用溯源
- 自动标注信息来源
- 置信度显示
- 原文预览

## 📊 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/rag/query` | POST | RAG 查询 |
| `/api/rag/history` | GET | 对话历史 |
| `/api/rag/clear` | POST | 清除历史 |
| `/health` | GET | 健康检查 |

## 🧪 测试与评估

### 运行完整测试
```bash
node scripts/evaluate-rag-quality.js
```

### 查看质量报告
```bash
cat docs/rag-quality-report.md
```

### 分析用户反馈
```bash
node scripts/rag-feedback-collector.js analyze
node scripts/rag-feedback-collector.js optimize  # 自动优化
node scripts/rag-feedback-collector.js report    # 生成周报
```

## 🔌 集成到飞书

```javascript
const { processMessageWithRAG } = require('./config/feishu-rag-integration');

// 在消息处理器中
app.message(async (message) => {
  const response = await processMessageWithRAG(message, directLLMCall);
  await sendMessage(response.text);
});
```

## 📈 性能基准

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 响应时间 | <2s | ~1.1s | ✅ |
| 准确率 | >85% | ~87% | ✅ |
| 置信度 | >0.7 | ~0.75 | ✅ |

## 🛠️ 开发指南

### 添加新知识源

1. 将文档放到 `workspace/` 目录
2. 运行向量化：`node scripts/vectorize-memory.js`
3. 在查询中指定来源：
```javascript
await queryRAG(query, {
  sources: ['long_term_memory', 'new_source']
});
```

### 调整检索参数

```javascript
// 修改 scripts/optimize-vector-search.js
const CONFIG = {
  search: {
    vectorWeight: 0.7,    // 向量权重
    keywordWeight: 0.3,   // 关键词权重
    defaultTopK: 5        // 默认返回数量
  }
};
```

### 自定义重排序策略

在 `rerankResults()` 函数中添加新的评分规则：

```javascript
// 示例：给特定来源加分
if (result.source === 'MEMORY.md') {
  bonusScore += 0.15;
}
```

## 🐛 故障排除

### 问题：LanceDB 表不存在
```bash
node scripts/vectorize-memory.js
```

### 问题：LLM API 调用失败
```bash
export DASHSCOPE_API_KEY="your-api-key"
```

### 问题：响应时间过长
- 降低 `topK` 参数
- 减少检索来源数量
- 检查网络延迟

## 📝 更新日志

### v1.0.0 (2026-03-09)
- ✅ 混合检索实现
- ✅ 重排序优化
- ✅ 多轮对话支持
- ✅ 引用溯源
- ✅ 质量评估系统
- ✅ 反馈收集机制
- ✅ 飞书集成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

**实施者**: MOSS (Subagent Commander)  
**日期**: 2026-03-09  
**状态**: ✅ Production Ready
