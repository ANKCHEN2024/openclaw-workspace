# LLM API 调用指南与对比分析

_最后更新：2026-03-11_

本文档整理了主流国产大语言模型的 API 调用方法、代码示例和对比分析，帮助谷风科技快速选择合适的 AI 模型。

---

## 📚 目录

1. [快速开始](#快速开始)
2. [各模型 API 详解](#各模型-api-详解)
3. [模型对比分析](#模型对比分析)
4. [推荐建议](#推荐建议)
5. [代码示例](#代码示例)

---

## 🚀 快速开始

### 环境准备

```bash
# 创建项目目录
mkdir -p examples/llm-api-demos/{python,nodejs}

# 安装依赖（Python）
pip install requests

# Node.js 无需额外依赖（使用内置 fetch）
```

### 获取 API Key

| 模型 | 平台 | 环境变量 |
|------|------|----------|
| Qwen | 阿里云百炼 | `DASHSCOPE_API_KEY` |
| Kimi | 月之暗面 | `MOONSHOT_API_KEY` |
| MiniMax | 海螺 AI | `MINIMAX_API_KEY` + `MINIMAX_GROUP_ID` |
| GLM | 智谱 AI | `ZHIPU_API_KEY` (格式：id.secret) |

---

## 📖 各模型 API 详解

### 1. Qwen（通义千问）- 阿里云

**Base URL:** `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`

**认证方式:** Bearer Token

**请求示例:**
```json
{
  "model": "qwen-plus",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**可用模型:**
- `qwen-turbo` - 快速响应，低成本
- `qwen-plus` - 平衡性能与成本（推荐）
- `qwen-max` - 最强能力，高成本

**特点:**
- ✅ OpenAI 兼容接口，迁移成本低
- ✅ 阿里云生态整合好
- ✅ 中文能力强
- ✅ 文档完善，社区活跃

---

### 2. Kimi（月之暗面）

**Base URL:** `https://api.moonshot.cn/v1/chat/completions`

**认证方式:** Bearer Token

**请求示例:**
```json
{
  "model": "moonshot-v1-8k",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**可用模型:**
- `moonshot-v1-8k` - 8K 上下文
- `moonshot-v1-32k` - 32K 上下文（推荐）
- `moonshot-v1-128k` - 128K 上下文（超长文档）

**特点:**
- ✅ **超长上下文处理**（核心优势）
- ✅ 中文理解能力优秀
- ✅ 文档总结能力强
- ✅ API 简洁易用

---

### 3. MiniMax（海螺 AI）

**Base URL:** `https://api.minimaxi.chat/v1/text/chatcompletion_v2`

**认证方式:** Bearer Token + Group ID

**请求示例:**
```json
{
  "model": "abab6.5s",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "group_id": "your-group-id"
}
```

**可用模型:**
- `abab6.5` - 基础版
- `abab6.5s` - 速度优化（推荐）
- `abab6.5t` - 文本优化

**特点:**
- ✅ 响应速度快
- ✅ 多模态能力强
- ✅ 适合对话场景
- ⚠️ 需要 Group ID（额外配置）

---

### 4. GLM（智谱 AI）

**Base URL:** `https://open.bigmodel.cn/api/paas/v4/chat/completions`

**认证方式:** JWT Token（需要签名）

**Token 生成:**
```python
import time, hashlib, hmac, json

def generate_token(api_key, exp_seconds=3600):
    id, secret = api_key.split(".")
    timestamp = int(time.time() * 1000)
    payload = {"api_key": id, "exp": timestamp + exp_seconds*1000, "timestamp": timestamp}
    payload_str = json.dumps(payload, separators=(',', ':'))
    signature = hmac.new(secret.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    return f"{payload_str}.{signature}"
```

**可用模型:**
- `glm-4` - 旗舰版（推荐）
- `glm-4-air` - 轻量版
- `glm-4-airx` - 快速版
- `glm-4-flash` - 极速版

**特点:**
- ✅ 学术背景强（清华系）
- ✅ 代码生成能力优秀
- ✅ 多语言支持好
- ⚠️ 认证方式复杂（JWT 签名）

---

## 📊 模型对比分析

### 综合能力对比表

| 维度 | Qwen-plus | Kimi-32k | MiniMax-6.5s | GLM-4 |
|------|-----------|----------|--------------|-------|
| **响应速度** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **生成质量** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **中文能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **代码能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **长文本处理** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **API 易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **成本效益** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 价格对比（参考 2025 年价格）

| 模型 | 输入价格 | 输出价格 | 计费单位 |
|------|----------|----------|----------|
| Qwen-plus | ¥0.004/1K | ¥0.012/1K | tokens |
| Kimi-32k | ¥0.024/1K | ¥0.024/1K | tokens |
| MiniMax-6.5s | ¥0.005/1K | ¥0.005/1K | tokens |
| GLM-4 | ¥0.1/1K | ¥0.1/1K | tokens |

> 💡 注：价格为参考值，实际以官方最新定价为准

### 适用场景分析

| 场景 | 推荐模型 | 理由 |
|------|----------|------|
| **通用对话** | Qwen-plus | 性价比高，响应快 |
| **长文档分析** | Kimi-32k/128k | 超长上下文优势 |
| **代码生成** | Qwen-max / GLM-4 | 代码能力强 |
| **实时交互** | MiniMax-6.5s | 响应速度最快 |
| **成本控制** | Qwen-turbo | 价格最低 |
| **企业应用** | Qwen 系列 | 阿里云生态支持好 |

---

## 💡 推荐建议

### 🏆 谷风科技优先推荐：**Qwen（通义千问）**

**核心理由:**

1. **性价比最优** - qwen-plus 在质量和成本间取得最佳平衡
2. **生态整合** - 阿里云生态完善，企业级支持好
3. **API 友好** - OpenAI 兼容接口，开发迁移成本低
4. **中文能力强** - 对中文理解和生成优秀
5. **文档完善** - 学习成本低，社区活跃

### 备选方案

- **长文本场景** → Kimi（文档分析、合同审查等）
- **代码密集型** → GLM-4（代码生成、技术文档）
- **实时对话** → MiniMax（客服机器人、即时交互）

### 实施建议

```markdown
Phase 1（第 1-2 周）:
- 申请 Qwen API Key
- 使用 qwen-plus 进行 MVP 开发
- 建立调用监控和成本追踪

Phase 2（第 3-4 周）:
- 根据实际场景测试其他模型
- 建立多模型路由策略
- 优化 prompt 和参数配置

Phase 3（第 2 个月）:
- 建立模型 A/B 测试框架
- 根据业务数据优化模型选择
- 考虑私有化部署选项
```

---

## 💻 代码示例

### Python 示例

```python
# Qwen 调用示例
import requests

API_KEY = "your-api-key"
headers = {"Authorization": f"Bearer {API_KEY}"}
payload = {
    "model": "qwen-plus",
    "messages": [{"role": "user", "content": "你好"}]
}

response = requests.post(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    headers=headers,
    json=payload
)
print(response.json()["choices"][0]["message"]["content"])
```

### Node.js 示例

```javascript
// Qwen 调用示例
const API_KEY = process.env.DASHSCOPE_API_KEY;

const response = await fetch(
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{role: 'user', content: '你好'}]
    })
  }
);

const data = await response.json();
console.log(data.choices[0].message.content);
```

### 完整示例代码

所有完整示例代码已放入 `examples/llm-api-demos/` 目录：

```
examples/llm-api-demos/
├── python/
│   ├── qwen_example.py
│   ├── kimi_example.py
│   ├── minimax_example.py
│   └── glm_example.py
└── nodejs/
    ├── qwen_example.js
    ├── kimi_example.js
    ├── minimax_example.js
    └── glm_example.js
```

运行示例：
```bash
# Python
export DASHSCOPE_API_KEY=your-key
python examples/llm-api-demos/python/qwen_example.py

# Node.js
export DASHSCOPE_API_KEY=your-key
node examples/llm-api-demos/nodejs/qwen_example.js
```

---

## 🔗 参考链接

- [Qwen API 文档](https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api)
- [Kimi API 文档](https://platform.moonshot.cn/docs/api/chat)
- [MiniMax API 文档](https://platform.minimaxi.com/docs/guides/chat)
- [GLM API 文档](https://open.bigmodel.cn/dev/api)

---

_文档生成时间：2026-03-11 09:20_
_生成者：MOSS (Subagent Commander)_
