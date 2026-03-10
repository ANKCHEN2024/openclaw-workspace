#!/bin/bash
# RAG 系统快速启动脚本

set -e

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

echo "=============================================="
echo "🚀 RAG 知识库系统快速启动"
echo "=============================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# 检查依赖
echo ""
echo "📦 检查依赖..."
REQUIRED_PACKAGES="@lancedb/lancedb @xenova/transformers"
for pkg in $REQUIRED_PACKAGES; do
    if ! npm list "$pkg" &> /dev/null; then
        echo "⚠️  缺少依赖：$pkg"
        echo "   运行：npm install $pkg"
    fi
done

# 检查环境变量
echo ""
echo "🔐 检查环境变量..."
if [ -z "$DASHSCOPE_API_KEY" ]; then
    echo "⚠️  未设置 DASHSCOPE_API_KEY"
    echo "   请运行：export DASHSCOPE_API_KEY=\"your-api-key\""
    echo "   或使用 1Password 管理"
else
    echo "✅ LLM API Key 已配置"
fi

# 检查 LanceDB
echo ""
echo "🗄️  检查 LanceDB..."
if [ ! -d "$WORKSPACE/lancedb" ]; then
    echo "⚠️  LanceDB 目录不存在"
    echo "   请先运行：node scripts/vectorize-memory.js"
else
    echo "✅ LanceDB: $WORKSPACE/lancedb"
    echo "   表数量：$(ls -1 $WORKSPACE/lancedb/*.lance 2>/dev/null | wc -l | tr -d ' ')"
fi

# 选择模式
echo ""
echo "请选择启动模式:"
echo "1. 启动 RAG API 服务器"
echo "2. 测试检索功能"
echo "3. 运行质量评估"
echo "4. 分析反馈数据"
echo "5. 完整测试（全部运行）"
echo ""
read -p "选择 [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动 RAG API 服务器..."
        echo "   访问：http://localhost:3030"
        echo ""
        node scripts/rag-api.js
        ;;
    2)
        echo ""
        echo "🧪 测试检索功能..."
        node scripts/optimize-vector-search.js
        ;;
    3)
        echo ""
        echo "📊 运行质量评估..."
        node scripts/evaluate-rag-quality.js
        ;;
    4)
        echo ""
        echo "📈 分析反馈数据..."
        node scripts/rag-feedback-collector.js analyze
        ;;
    5)
        echo ""
        echo "🔄 运行完整测试..."
        echo ""
        echo "步骤 1/3: 测试检索"
        node scripts/optimize-vector-search.js
        echo ""
        echo "步骤 2/3: 质量评估"
        node scripts/evaluate-rag-quality.js
        echo ""
        echo "步骤 3/3: 反馈分析"
        node scripts/rag-feedback-collector.js analyze
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "✅ 完成"
echo "=============================================="
