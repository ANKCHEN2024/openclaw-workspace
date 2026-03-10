#!/bin/bash
# cron-setup.sh - 一键配置 cron 定时任务
# 自动添加文档维护的 cron 作业

set -e

WORKSPACE="/Users/chenggl/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
LOGS_DIR="$WORKSPACE/logs"

echo "⏰ 开始配置 cron 定时任务..."

# 确保 logs 目录存在
mkdir -p "$LOGS_DIR"

# 确保脚本有执行权限
chmod +x "$SCRIPTS_DIR"/*.sh

# 获取当前 cron 配置
CURRENT_CRON=$(crontab -l 2>/dev/null || echo "")

# 定义要添加的 cron 任务
CRON_TASKS="# === OpenClaw 文档维护任务（由 cron-setup.sh 添加） ===
# 文档关联检查（每天 03:00）
0 3 * * * cd $WORKSPACE && ./scripts/sync-docs-links.sh >> $LOGS_DIR/cron-sync.log 2>&1

# 文档自动修复（每天 03:05）
5 3 * * * cd $WORKSPACE && ./scripts/auto-fix-docs.sh >> $LOGS_DIR/cron-fix.log 2>&1

# 周报告（每周日 23:00）
0 23 * * 0 cd $WORKSPACE && ./scripts/weekly-report.sh >> $LOGS_DIR/cron-weekly.log 2>&1
# === 结束 ===
"

# 检查是否已存在
if echo "$CURRENT_CRON" | grep -q "OpenClaw 文档维护任务"; then
    echo "⚠️  检测到已有 OpenClaw cron 任务"
    echo ""
    echo "当前配置："
    echo "$CURRENT_CRON" | grep -A 10 "OpenClaw 文档维护任务"
    echo ""
    read -p "是否覆盖现有配置？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消"
        exit 0
    fi
    # 移除旧配置
    CURRENT_CRON=$(echo "$CURRENT_CRON" | grep -v "OpenClaw 文档维护任务" | grep -v "sync-docs-links" | grep -v "auto-fix-docs" | grep -v "weekly-report" | grep -v "=== 结束 ===")
fi

# 添加新配置
NEW_CRON="$CURRENT_CRON
$CRON_TASKS"

# 安装 cron 配置
echo "$NEW_CRON" | crontab -

echo ""
echo "✅ Cron 配置完成！"
echo ""
echo "已添加的任务："
echo "  📅 每天 03:00 - 文档关联检查"
echo "  🔧 每天 03:05 - 文档自动修复"
echo "  📊 每周日 23:00 - 周报告（需要先创建 weekly-report.sh）"
echo ""
echo "查看当前 cron 配置："
echo "  crontab -l"
echo ""
echo "查看日志："
echo "  tail -f $LOGS_DIR/cron-sync.log"
echo "  tail -f $LOGS_DIR/cron-fix.log"
echo ""
echo "管理 cron："
echo "  crontab -e    # 编辑"
echo "  crontab -l    # 查看"
echo "  crontab -r    # 删除所有（谨慎！）"
echo ""
