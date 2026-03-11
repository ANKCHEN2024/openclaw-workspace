# LLM API Demos - 大语言模型调用示例

本仓库包含主流国产大语言模型的 API 调用示例代码，支持 Python 和 Node.js。

## 📦 包含的模型

- **Qwen (通义千问)** - 阿里云
- **Kimi (月之暗面)** - 月之暗面
- **MiniMax (海螺 AI)** - MiniMax
- **GLM (智谱 AI)** - 智谱 AI

## 🚀 快速开始

### 1. 获取 API Keys

| 模型 | 平台 | 申请地址 |
|------|------|----------|
| Qwen | 阿里云百炼 | https://bailian.console.aliyun.com/ |
| Kimi | 月之暗面 | https://platform.moonshot.cn/ |
| MiniMax | 海螺 AI | https://platform.minimaxi.com/ |
| GLM | 智谱 AI | https://open.bigmodel.cn/ |

### 2. 设置环境变量

```bash
# Qwen
export DASHSCOPE_API_KEY="your-dashscope-api-key"

# Kimi
export MOONSHOT_API_KEY="your-moonshot-api-key"

# MiniMax
export MINIMAX_API_KEY="your-minimax-api-key"
export MINIMAX_GROUP_ID="your-minimax-group-id"

# GLM (格式：id.secret)
export ZHIPU_API_KEY="your-zhipu-api-key-id.your-zhipu-api-key-secret"
```

### 3. 运行示例

#### Python

```bash
# 安装依赖
pip install requests

# 运行示例
python python/qwen_example.py
python python/kimi_example.py
python python/minimax_example.py
python python/glm_example.py
```

#### Node.js

```bash
# Node.js 18+ 无需额外依赖（使用内置 fetch）

# 运行示例
node nodejs/qwen_example.js
node nodejs/kimi_example.js
node nodejs/minimax_example.js
node nodejs/glm_example.js
```

## 📁 目录结构

```
llm-api-demos/
├── README.md
├── python/
│   ├── qwen_example.py      # Qwen 调用示例
│   ├── kimi_example.py      # Kimi 调用示例
│   ├── minimax_example.py   # MiniMax 调用示例
│   └── glm_example.py       # GLM 调用示例
└── nodejs/
    ├── qwen_example.js      # Qwen 调用示例
    ├── kimi_example.js      # Kimi 调用示例
    ├── minimax_example.js   # MiniMax 调用示例
    └── glm_example.js       # GLM 调用示例
```

## 🧪 测试内容

每个示例都包含以下测试：

1. **文本生成** - 测试基础文本生成能力
2. **多轮对话** - 测试对话上下文理解
3. **代码生成** - 测试编程能力

Kimi 示例额外包含：
4. **长文本处理** - 测试超长上下文能力

## 📊 模型对比

详细对比分析请参考：`../../docs/llm-api-examples.md`

### 快速参考

| 模型 | 推荐场景 | 价格区间 |
|------|----------|----------|
| Qwen-plus | 通用场景 | 中 |
| Kimi-32k | 长文档分析 | 中高 |
| MiniMax-6.5s | 实时对话 | 低中 |
| GLM-4 | 代码生成 | 高 |

## ⚠️ 注意事项

1. **API Key 安全** - 不要将 API Key 提交到版本控制系统
2. **成本控制** - 测试时注意 token 消耗
3. **速率限制** - 各平台有不同的调用频率限制
4. **错误处理** - 生产环境请添加完善的错误处理

## 📝 自定义示例

基于这些示例，你可以快速构建自己的应用：

```python
# 示例：构建一个简单的问答机器人
from qwen_example import call_qwen

def qa_bot(question):
    messages = [{"role": "user", "content": question}]
    result = call_qwen(messages)
    return result["choices"][0]["message"]["content"]

answer = qa_bot("什么是人工智能？")
print(answer)
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

_最后更新：2026-03-11_
