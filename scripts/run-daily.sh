#!/bin/bash
# run-daily.sh - 每日定时任务（手动添加到系统定时任务）
# 由于沙盒限制，需要用户在系统层面配置

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

echo "🤖 OpenClaw 每日任务 - $(date)"
echo ""

# 任务 1: 文档同步
echo "📄 运行文档同步检查..."
./scripts/sync-docs-links.sh
echo ""

# 任务 2: 文档修复
echo "🔧 运行文档自动修复..."
./scripts/auto-fix-docs.sh
echo ""

# 任务 3: 技能检查
echo "🏥 运行技能健康检查..."
./scripts/skill-healthcheck.sh || true
echo ""

# 任务 4: 技能更新
echo "📦 运行技能安装/更新..."
./scripts/skill-install.sh || true
echo ""

echo "================================"
echo "✅ 每日任务完成 - $(date)"
echo "================================"
