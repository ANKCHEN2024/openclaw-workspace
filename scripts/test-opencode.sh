#!/bin/bash
# test-opencode.sh - 测试 OpenCode CLI 连接

echo "================================"
echo "🧪 OpenCode CLI 连接测试"
echo "================================"
echo ""

# 读取配置
CONFIG_FILE="$HOME/.opencode/config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在：$CONFIG_FILE"
    exit 1
fi

echo "📄 配置文件：$CONFIG_FILE"
cat "$CONFIG_FILE"
echo ""

# 提取配置
API_KEY=$(grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
API_ENDPOINT=$(grep -o '"apiEndpoint"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
MODEL=$(grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)

echo "🔑 API Key: ${API_KEY:0:15}..."
echo "🌐 API 端点：$API_ENDPOINT"
echo "🤖 模型：$MODEL"
echo ""

# 测试 API 连接
echo "📡 测试 API 连接..."
RESPONSE=$(curl -s -X POST "$API_ENDPOINT/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"Hello, this is a test.\"}],
    \"max_tokens\": 30
  }" 2>&1)

if echo "$RESPONSE" | grep -q '"choices"'; then
    echo "✅ API 连接成功"
    echo ""
    echo "📝 响应预览："
    echo "$RESPONSE" | grep -o '"content"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1
else
    echo "❌ API 连接失败"
    echo ""
    echo "响应内容："
    echo "$RESPONSE" | head -10
    exit 1
fi

echo ""
echo "================================"
echo "✅ OpenCode CLI 已就绪"
echo "================================"
echo ""
echo "使用方法："
echo "  oc .                    # 在当前目录启动"
echo "  oc <file>              # 编辑指定文件"
echo ""
