#!/bin/bash
# sync-docs-links.sh - 自动同步所有文档的关联引用
# 确保所有项目文档都引用最新的 WORK_PRINCIPLES.md 和核心文件

set -e

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

echo "🔗 开始同步文档关联..."

# 需要检查关联的核心文件
CORE_FILES=(
    "WORK_PRINCIPLES.md"
    "AGENTS.md"
    "SOUL.md"
    "IDENTITY.md"
    "USER.md"
    "MEMORY.md"
)

# 需要添加引用的项目目录
PROJECT_DIRS=(
    "ai-drama-platform"
    "short-video-platform"
)

# 标准引用头部模板
PRINCIPLES_HEADER="> **工作准则**：本项目遵循 \`../WORK_PRINCIPLES.md\` 全部 15 条准则，特别是：
> - 第 2 条：24 小时不间断开发
> - 第 4 条：质量第一（零缺陷交付）
> - 第 6 条：定时汇报
> - 第 8 条：Subagent 优先（并行开发）
> - 第 10 条：写下来>脑子记
> - 第 12 条：快速迭代（MVP 优先）
> - 第 13 条：透明沟通
"

# 检查核心文件是否存在
echo "📋 检查核心文件..."
for file in "${CORE_FILES[@]}"; do
    if [ ! -f "$WORKSPACE/$file" ]; then
        echo "❌ 缺失核心文件：$file"
        exit 1
    fi
done
echo "✅ 所有核心文件存在"

# 检查项目文档是否包含引用
echo "📝 检查项目文档引用..."
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$WORKSPACE/$dir" ]; then
        # 查找项目中的主要文档
        for doc in "$dir/README.md" "$dir/PROJECT_SUMMARY.md" "$dir/DEVELOPMENT_TASK.md" "$dir/COMMAND_CENTER.md"; do
            if [ -f "$WORKSPACE/$doc" ]; then
                if ! grep -q "WORK_PRINCIPLES.md" "$WORKSPACE/$doc" 2>/dev/null; then
                    echo "⚠️  缺少引用：$doc"
                    echo "   建议添加：$PRINCIPLES_HEADER"
                else
                    echo "✅ 已引用：$doc"
                fi
            fi
        done
    fi
done

# 检查 decisions/ 目录
echo "📂 检查决策日志目录..."
if [ ! -d "$WORKSPACE/decisions" ]; then
    echo "⚠️  创建 decisions/ 目录..."
    mkdir -p "$WORKSPACE/decisions"
fi

# 检查 training/ 目录
echo "📚 检查培训目录..."
if [ ! -d "$WORKSPACE/training" ]; then
    echo "⚠️  创建 training/ 目录..."
    mkdir -p "$WORKSPACE/training"
fi

# 检查 AGENTS.md 的必读清单
echo "📖 检查 AGENTS.md 必读清单..."
if grep -q "WORK_PRINCIPLES.md" "$WORKSPACE/AGENTS.md"; then
    echo "✅ AGENTS.md 已包含 WORK_PRINCIPLES.md"
else
    echo "❌ AGENTS.md 缺少 WORK_PRINCIPLES.md 引用"
fi

if grep -q "IDENTITY.md" "$WORKSPACE/AGENTS.md"; then
    echo "✅ AGENTS.md 已包含 IDENTITY.md"
else
    echo "❌ AGENTS.md 缺少 IDENTITY.md 引用"
fi

# 检查 HEARTBEAT.md 配置
echo "💓 检查 HEARTBEAT.md 配置..."
if [ -s "$WORKSPACE/HEARTBEAT.md" ] && ! grep -q "^#" "$WORKSPACE/HEARTBEAT.md" | head -1 | grep -q "保持这个文件为空"; then
    echo "✅ HEARTBEAT.md 已配置任务"
else
    echo "⚠️  HEARTBEAT.md 为空或只有注释"
fi

# 生成同步报告
REPORT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
echo ""
echo "================================"
echo "📊 同步检查完成 - $REPORT_DATE"
echo "================================"
echo ""
echo "核心文件：${#CORE_FILES[@]} 个 ✅"
echo "项目目录：${#PROJECT_DIRS[@]} 个"
echo ""
echo "下次检查：建议每 24 小时运行一次"
echo ""

# 输出到日志
LOG_FILE="$WORKSPACE/logs/sync-docs-links.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$REPORT_DATE] 同步检查完成" >> "$LOG_FILE"

echo "✅ 所有检查完成！"
