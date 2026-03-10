# AI/ML 技术选型建议

**项目：** 短剧平台 AI 基础设施  
**版本：** v1.0  
**日期：** 2026-03-09  
**目标：** 成本/性能/质量最优平衡

---

## 1. 模型选型矩阵

### 1.1 语言模型

| 任务 | 首选 | 备选 | 成本敏感 | 理由 |
|------|------|------|----------|------|
| 通用对话 | Claude-3.5-Sonnet | Qwen-Max | Qwen-72B | 理解力强，中文优秀 |
| 创意写作 | Claude-3.5 | GPT-4 | Qwen-Max | 创意质量高 |
| 代码生成 | Claude-3.5 | GPT-4 | Qwen-2.5-Coder | 代码能力强 |
| 逻辑推理 | GPT-4 | Claude-3.5 | Qwen-72B | 推理准确 |
| 长文本 | Claude-3.5 (200k) | Qwen-Long | - | 上下文窗口大 |
| 快速响应 | Qwen-7B | Qwen-14B | - | 延迟低 |

**推荐策略：**
```python
def select_llm(task_type, complexity, budget):
    if budget == 'low':
        return 'qwen-7b' if complexity < 0.4 else 'qwen-72b'
    elif budget == 'medium':
        if task_type in ['creative', 'reasoning']:
            return 'qwen-max'
        else:
            return 'qwen-72b'
    else:  # high
        if task_type == 'creative':
            return 'claude-3.5'
        elif task_type == 'reasoning':
            return 'gpt-4'
        else:
            return 'qwen-max'
```

### 1.2 视觉模型

| 任务 | 首选 | 备选 | 开源替代 |
|------|------|------|----------|
| 文生图 | Midjourney v6 | DALL-E 3 | SDXL Turbo |
| 图生图 | SDXL + ControlNet | - | SDXL |
| 图像理解 | GPT-4V | Qwen-VL-Max | LLaVA-1.6 |
| 图像嵌入 | CLIP ViT-L/14 | - | OpenCLIP |
| 图像质量评估 | NIMA | - | BRISQUE |

### 1.3 Embedding 模型

| 场景 | 模型 | 维度 | 推荐理由 |
|------|------|------|----------|
| 中文检索 | bge-large-zh-v1.5 | 1024 | 中文 SOTA |
| 多语言 | m3e-base | 768 | 多语言支持 |
| 高性能 | text-embedding-3-large | 3072 | OpenAI 最新 |
| 轻量级 | bge-small-zh | 512 | 速度快 |

### 1.4 重排序模型

| 模型 | 类型 | 精度 | 速度 | 推荐场景 |
|------|------|------|------|----------|
| bge-reranker-v2-m3 | Cross-Encoder | SOTA | 中 | 通用推荐 |
| bge-reranker-large | Cross-Encoder | 高 | 中 | 高精度需求 |
| cross-encoder-ms-marco | Cross-Encoder | 中 | 快 | 快速原型 |

---

## 2. 基础设施选型

### 2.1 向量数据库

| 方案 | 类型 | 优势 | 劣势 | 推荐指数 |
|------|------|------|------|----------|
| Qdrant | 开源 | Rust 高性能、混合检索、易部署 | 社区较小 | ⭐⭐⭐⭐⭐ |
| Milvus | 开源 | 功能全、生态好 | 架构复杂 | ⭐⭐⭐⭐ |
| Weaviate | 开源 | 内置 ML 模块 | 性能一般 | ⭐⭐⭐ |
| Pinecone | SaaS | 免运维 | 贵、数据出境 | ⭐⭐ |
| pgvector | 开源 | PostgreSQL 扩展 | 性能有限 | ⭐⭐⭐ |

**推荐：Qdrant**
```yaml
部署配置:
  节点数：3 (高可用)
  索引类型：HNSW
  参数:
    m: 16
    ef_construct: 256
  分片数：根据数据量动态调整
  
性能预期:
  写入：10k docs/s
  检索 P99: <50ms (1M vectors)
  内存占用：~1GB/1M vectors
```

### 2.2 推理服务框架

| 框架 | 优势 | 适用场景 |
|------|------|----------|
| vLLM | PagedAttention、高吞吐、多模型 | 生产环境首选 |
| TGI | HuggingFace 官方、易集成 | HF 模型部署 |
| TensorRT-LLM | NVIDIA 优化、极致性能 | NVIDIA GPU |
| llama.cpp | CPU 推理、GGUF 格式 | 边缘部署 |

**推荐：vLLM**
```yaml
部署配置:
  GPU: 4×A100 80GB
  Tensor Parallelism: 4
  最大并发：1000 requests
  KV Cache: 自动管理
  
性能预期:
  Qwen-72B: 50 tokens/s
  P99 延迟：<200ms
  吞吐量：3000 tokens/s/GPU
```

### 2.3 消息队列

| 方案 | 优势 | 推荐场景 |
|------|------|----------|
| Redis Streams | 简单、低延迟 | 任务队列 |
| RabbitMQ | 成熟、可靠 | 复杂路由 |
| Kafka | 高吞吐、持久化 | 事件流 |
| Celery | Python 友好 | 异步任务 |

**推荐：Redis Streams + Celery**
```python
# 任务队列配置
CELERY_CONFIG = {
    'broker_url': 'redis://localhost:6379/0',
    'result_backend': 'redis://localhost:6379/1',
    'task_serializer': 'json',
    'accept_content': ['json'],
    'result_serializer': 'json',
    'timezone': 'Asia/Shanghai',
    'enable_utc': True,
    'task_routes': {
        'tasks.generate_image': {'queue': 'image_gen'},
        'tasks.analyze_script': {'queue': 'llm'},
        'tasks.rerank': {'queue': 'rerank'},
    }
}
```

### 2.4 监控系统

| 组件 | 方案 | 用途 |
|------|------|------|
| 指标监控 | Prometheus + Grafana | 系统指标 |
| 日志收集 | ELK Stack | 日志分析 |
| 链路追踪 | Jaeger | 请求追踪 |
| 告警 | AlertManager + 钉钉 | 异常通知 |

**Grafana Dashboard 模板：**
```json
{
  "dashboard": {
    "title": "AI Service Monitor",
    "panels": [
      {"title": "Request Rate", "type": "graph"},
      {"title": "P95/P99 Latency", "type": "graph"},
      {"title": "Error Rate", "type": "stat"},
      {"title": "GPU Utilization", "type": "graph"},
      {"title": "Token Usage", "type": "graph"},
      {"title": "Cost per Hour", "type": "stat"}
    ]
  }
}
```

---

## 3. 成本优化策略

### 3.1 模型成本对比 (每 1M tokens)

| 模型 | 输入 | 输出 | 推荐用途 |
|------|------|------|----------|
| Qwen-7B | ¥0.001 | ¥0.001 | 简单任务 |
| Qwen-72B | ¥0.01 | ¥0.01 | 中等复杂度 |
| Qwen-Max | ¥0.04 | ¥0.12 | 高复杂度 |
| GPT-4 | ¥0.08 | ¥0.24 | 关键任务 |
| Claude-3.5 | ¥0.03 | ¥0.15 | 创意/写作 |

### 3.2 图像生成成本

| 方案 | 单张成本 | 速度 | 质量 |
|------|----------|------|------|
| Midjourney | ¥1.5 | 30s | ⭐⭐⭐⭐⭐ |
| DALL-E 3 | ¥1.2 | 15s | ⭐⭐⭐⭐ |
| SDXL (自建) | ¥0.05 | 5s | ⭐⭐⭐⭐ |
| SDXL Turbo | ¥0.02 | 1s | ⭐⭐⭐ |

### 3.3 月度成本估算

**基础配置 (日活 1 万):**
```
LLM API:
  - Qwen-7B: 5M tokens/天 × ¥0.001 × 30 = ¥150
  - Qwen-72B: 3M tokens/天 × ¥0.01 × 30 = ¥900
  - Qwen-Max: 1M tokens/天 × ¥0.04 × 30 = ¥1,200
  - Claude-3.5: 0.5M tokens/天 × ¥0.03 × 30 = ¥450
  小计：¥2,700/月

图像生成:
  - SDXL 自建：5000 张/天 × ¥0.05 × 30 = ¥7,500/月

基础设施:
  - GPU 服务器 (4×A100): ¥80,000/月
  - 向量数据库：¥5,000/月
  - 存储 + CDN: ¥3,000/月
  
总计：¥98,200/月
```

**优化后目标：¥60,000/月 (-39%)**
- 智能路由：-30%
- 缓存优化：-20%
- 批量处理：-15%

---

## 4. 技术债务预防

### 4.1 代码规范

```python
# ✅ 推荐：明确的错误处理
def generate_content(prompt):
    try:
        response = llm.generate(prompt, timeout=30)
        return response
    except TimeoutError:
        logger.warning(f"Generation timeout: {prompt[:50]}")
        return None
    except RateLimitError:
        logger.error("Rate limit exceeded")
        raise

# ❌ 避免：裸 except
def generate_content(prompt):
    try:
        return llm.generate(prompt)
    except:
        return None
```

### 4.2 配置管理

```yaml
# config/production.yaml
llm:
  default_model: qwen-max
  fallback_model: qwen-72b
  timeout: 30
  max_retries: 3
  rate_limit:
    qwen-max: 100/min
    qwen-72b: 500/min

vector_db:
  host: localhost
  port: 19530
  collection: short_drama_kb
  index_params:
    type: HNSW
    m: 16
    ef_construction: 256
```

### 4.3 测试策略

```python
# 单元测试
def test_rag_retrieval():
    rag = ShortDramaRAG()
    results = rag.search("古装爱情", top_k=5)
    assert len(results) == 5
    assert all('content' in r for r in results)

# 集成测试
def test_generation_pipeline():
    workflow = ContentGenerationWorkflow()
    output = workflow.run(script="测试剧本")
    assert output['quality_score'] > 70

# 性能测试
def test_latency_p99():
    latencies = []
    for _ in range(1000):
        start = time.time()
        rag.search("测试查询")
        latencies.append(time.time() - start)
    p99 = sorted(latencies)[990]
    assert p99 < 0.2  # 200ms
```

---

## 5. 安全与合规

### 5.1 数据安全

```python
# 敏感信息脱敏
def sanitize_input(text):
    patterns = [
        (r'\b\d{11}\b', '[PHONE]'),  # 手机号
        (r'\b\d{18}\b', '[ID_CARD]'),  # 身份证
        (r'[\w.]+@[\w.]+', '[EMAIL]'),  # 邮箱
    ]
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text

# API 密钥管理
from dotenv import load_dotenv
load_dotenv()
API_KEY = os.getenv('LLM_API_KEY')  # 不硬编码
```

### 5.2 内容审核

```python
class ContentModeration:
    def __init__(self):
        self.text_classifier = load_moderation_model()
        self.image_classifier = load_vision_model()
    
    def check(self, content):
        if content['type'] == 'text':
            result = self.text_classifier.predict(content['text'])
        else:
            result = self.image_classifier.predict(content['image'])
        
        if result['flagged']:
            return {
                'passed': False,
                'reason': result['category'],
                'confidence': result['confidence']
            }
        return {'passed': True}
```

---

## 6. 决策清单

### 6.1 立即决策

- [x] 向量数据库：Qdrant
- [x] 推理框架：vLLM
- [x] 主 LLM：Qwen-Max + Claude-3.5
- [x] Embedding：bge-large-zh-v1.5
- [x] 重排序：bge-reranker-v2-m3

### 6.2 待决策

- [ ] 图像生成：自建 SDXL vs Midjourney API
- [ ] 消息队列：Redis vs RabbitMQ
- [ ] 监控：自建 vs SaaS

### 6.3 风险项

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| API 限流 | 中 | 高 | 多服务商 + 降级策略 |
| 成本超支 | 中 | 中 | 预算告警 + 智能路由 |
| 质量波动 | 低 | 高 | A/B 测试 + 人工抽检 |
| 数据泄露 | 低 | 极高 | 加密 + 脱敏 + 审计 |

---

**文档状态：** ✅ 完成  
**维护者：** MOSS  
**下次审查：** 2026-04-09
