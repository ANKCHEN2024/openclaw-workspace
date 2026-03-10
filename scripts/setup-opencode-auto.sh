#!/bin/bash
# setup-opencode-auto.sh - OpenCode CLI 自动配置（非交互式）
# 支持阿里云 DashScope API（通义千问）

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo "================================"
echo "🔧 OpenCode CLI 自动配置"
echo "================================"
echo ""

# 1. 检查 opencode 是否已安装
log_step "检查 OpenCode 安装状态"
if command -v opencode &> /dev/null; then
    OPENCODE_VERSION=$(opencode --version 2>&1 | head -1)
    log_info "✓ OpenCode 已安装：$OPENCODE_VERSION"
else
    log_info "正在安装 OpenCode CLI..."
    if npm install -g @opencode/cli 2>&1 | tail -5; then
        log_info "✅ OpenCode 安装成功"
    else
        log_error "❌ OpenCode 安装失败"
        exit 1
    fi
fi

# 2. 创建配置目录
log_step "创建配置目录"
CONFIG_DIR="$HOME/.opencode"
mkdir -p "$CONFIG_DIR"
log_info "✓ 配置目录：$CONFIG_DIR"

# 3. 检查 API Key
echo ""
log_step "检查 API Key 配置"

API_KEY=""
if [ -n "$DASHSCOPE_API_KEY" ]; then
    log_info "✓ DASHSCOPE_API_KEY 已设置（环境变量）"
    API_KEY="$DASHSCOPE_API_KEY"
elif [ -f "$HOME/.dashscope_key" ]; then
    log_info "✓ DASHSCOPE_API_KEY 已设置（文件）"
    API_KEY=$(cat "$HOME/.dashscope_key" | tr -d '[:space:]')
else
    log_warn "⚠️  DASHSCOPE_API_KEY 未设置"
fi

# 4. 创建配置文件
log_step "创建 OpenCode 配置文件"

if [ -n "$API_KEY" ]; then
    cat > "$CONFIG_DIR/config.json" << EOF
{
  "provider": "openai-compatible",
  "model": "qwen3.5-plus",
  "apiEndpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "$API_KEY",
  "providerName": "阿里云 DashScope"
}
EOF
else
    # 无 API Key 时使用环境变量占位符
    cat > "$CONFIG_DIR/config.json" << 'EOF'
{
  "provider": "openai-compatible",
  "model": "qwen-coder-plus",
  "apiEndpoint": "https://coding.dashscope.aliyuncs.com/v1",
  "apiKey": "${DASHSCOPE_API_KEY}",
  "providerName": "阿里云 DashScope Coding"
}
EOF
    log_warn "⚠️  使用环境变量占位符，请设置 DASHSCOPE_API_KEY"
fi

log_info "✓ 配置文件已创建：$CONFIG_DIR/config.json"

# 5. 测试连接（如果有 API Key）
if [ -n "$API_KEY" ]; then
    echo ""
    log_step "测试 API 连接"
    
    RESPONSE=$(curl -s -X POST "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d '{
            "model": "qwen3.5-plus",
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 10
        }' 2>&1)
    
    if echo "$RESPONSE" | grep -q '"choices"'; then
        log_info "✅ API 连接测试成功"
    elif echo "$RESPONSE" | grep -qi "invalid.*key\|unauthorized"; then
        log_error "❌ API Key 无效"
    else
        log_warn "⚠️  API 响应：${RESPONSE:0:200}"
    fi
fi

# 6. 创建别名
log_step "创建快捷命令"

if ! grep -q "alias oc=" "$HOME/.zshrc" 2>/dev/null; then
    echo "" >> "$HOME/.zshrc"
    echo "# OpenCode CLI 别名" >> "$HOME/.zshrc"
    echo "alias oc='opencode'" >> "$HOME/.zshrc"
    echo "alias opencode='opencode'" >> "$HOME/.zshrc"
    log_info "✓ 已添加别名到 ~/.zshrc"
    log_info "  运行 'source ~/.zshrc' 或重新打开终端生效"
else
    log_info "✓ 别名已存在"
fi

# 7. 显示配置
echo ""
log_step "当前配置"
echo "--------------------------------"
cat "$CONFIG_DIR/config.json"
echo "--------------------------------"

echo ""
echo "================================"
if [ -n "$API_KEY" ]; then
    echo -e "${GREEN}✅ OpenCode 配置完成（已就绪）${NC}"
else
    echo -e "${YELLOW}⚠️  OpenCode 配置完成（需设置 API Key）${NC}"
fi
echo "================================"
echo ""

if [ -z "$API_KEY" ]; then
    echo "获取 API Key 步骤："
    echo "1. 访问：https://dashscope.console.aliyun.com/apiKey"
    echo "2. 登录阿里云账号"
    echo "3. 创建/复制 API Key"
    echo "4. 运行：export DASHSCOPE_API_KEY='sk-xxxxxxxx'"
    echo ""
fi

echo "使用方法："
echo "  oc .                    # 在当前目录启动"
echo "  oc <file>              # 编辑指定文件"
echo "  oc --model qwen-max    # 使用其他模型"
echo ""
echo "可用模型："
echo "  - qwen3.5-plus（默认）"
echo "  - qwen-max"
echo "  - qwen-plus"
echo "  - qwen-turbo"
echo ""
