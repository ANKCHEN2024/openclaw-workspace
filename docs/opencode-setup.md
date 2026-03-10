# OpenCode CLI 配置完成 ✅

## 配置详情

| 项目 | 值 |
|------|------|
| **工具** | OpenCode CLI (`@opencode/cli`) |
| **API 端点** | https://coding.dashscope.aliyuncs.com/v1 |
| **模型** | qwen-coder-plus（阿里编程专用） |
| **API Key** | sk-sp-22c76c54ea07441983715fe928bb0a8d |
| **状态** | ✅ 已就绪 |

## 使用方法

```bash
# 方式 1：使用别名
oc .

# 方式 2：完整命令
opencode .

# 编辑指定文件
oc src/main.js

# 使用其他模型
oc . --model qwen-max
```

## 可用模型

| 模型 | 说明 |
|------|------|
| `qwen-coder-plus` | 编程专用（默认） |
| `qwen-max` | 最强性能 |
| `qwen-plus` | 高性能 |
| `qwen-turbo` | 快速响应 |

## 配置文件

- **位置**：`~/.opencode/config.json`
- **内容**：
```json
{
  "provider": "openai-compatible",
  "model": "qwen-coder-plus",
  "apiEndpoint": "https://coding.dashscope.aliyuncs.com/v1",
  "apiKey": "sk-sp-22c76c54ea07441983715fe928bb0a8d",
  "providerName": "阿里云 DashScope Coding"
}
```

## 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/setup-opencode-auto.sh` | 自动配置脚本 |
| `scripts/test-opencode.sh` | 连接测试脚本 |

## 测试连接

```bash
./scripts/test-opencode.sh
```

---

*配置日期：2026-03-07 17:47*
