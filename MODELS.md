# MODELS.md - 可用模型配置

## 当前配置
- **default_model**: `custom-coding-dashscope-aliyuncs-com/qwen3.5-plus`
- **当前使用**: `qwen3.5-plus` (阿里云 DashScope)
- **API Key**: `sk-sp-22...28bb0a8d` (models.json)

## 可用模型列表

### 通义千问系列 (阿里云 DashScope)

| 别名 | 模型 ID | 用途 | 说明 |
|------|---------|------|------|
| `qwen3.5-plus` | `custom-coding-dashscope-aliyuncs-com/qwen3.5-plus` | 通用/编码 | 当前默认，平衡性能和成本 |
| `qwen3-max` | `custom-coding-dashscope-aliyuncs-com/qwen3-max-2026-01-23` | 高端任务 | 最强推理能力，适合复杂问题 |
| `qwen3-coder-plus` | `custom-coding-dashscope-aliyuncs-com/qwen3-coder-plus` | 专业编码 | 代码生成/重构/调试专用 |
| `qwen3-coder-next` | `custom-coding-dashscope-aliyuncs-com/qwen3-coder-next` | 快速编码 | 轻量级代码助手，响应快 |

### 其他 Provider

| 别名 | 模型 ID | Provider | 用途 |
|------|---------|----------|------|
| `glm-5` | `glm-5` | 智谱 AI | 中文任务优化 |
| `glm-4.7` | `glm-4.7` | 智谱 AI | 上一代稳定版本 |
| `kimi-k2.5` | `kimi-k2.5` | 月之暗面 | 长上下文处理 |
| `minimax-m2.5` | `MiniMax-M2.5` | MiniMax | 多模态/对话 |

## 使用方式

### 临时切换 (会话级)
```
/model qwen3-max
/model qwen3-coder-plus
/model default  # 恢复默认
```

### 子代理指定模型
```bash
openclaw spawn --model qwen3-coder-plus
```

### 会话状态查看
```
/status  # 显示当前模型和用量
```

## 推荐场景

| 场景 | 推荐模型 |
|------|----------|
| 日常对话/通用任务 | `qwen3.5-plus` (默认) |
| 复杂推理/分析 | `qwen3-max` |
| 写代码/Debug | `qwen3-coder-plus` |
| 快速代码补全 | `qwen3-coder-next` |
| 中文文档/写作 | `glm-5` |
| 长文档处理 | `kimi-k2.5` |
| 多模态任务 | `minimax-m2.5` |

## 成本优化建议

- 简单任务用 `qwen3-coder-next` 或 `glm-4.7`
- 重要任务用 `qwen3-max`
- 编码任务优先 `qwen3-coder-*` 系列
- 定期用 `/status` 检查用量

---
*最后更新: 2026-03-06*
*维护者: MOSS 🤖*
