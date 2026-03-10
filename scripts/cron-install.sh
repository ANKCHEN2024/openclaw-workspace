#!/bin/bash
# cron-install.sh - 安装 cron 定时任务（替代 launchd）

set -e

WORKSPACE="/Users/chenggl/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
LOGS_DIR="$WORKSPACE/logs"

# 确保日志目录存在
mkdir -p "$LOGS_DIR"

# 确保脚本有执行权限
chmod +x "$SCRIPTS_DIR"/*.sh

echo "⏰ 开始配置 cron 定时任务..."
echo ""

# 定义 cron 任务（使用绝对路径）
CRON_TASKS="# OpenClaw 自动化任务 - 上海时间 (Asia/Shanghai)
# 由 cron-install.sh 创建 - $(date +"%Y-%m-%d")

# 文档关联检查（每天 03:00）
0 3 * * * cd $WORKSPACE && $SCRIPTS_DIR/sync-docs-links.sh >> $LOGS_DIR/cron-sync.log 2>&1

# 文档自动修复（每天 03:05）
5 3 * * * cd $WORKSPACE && $SCRIPTS_DIR/auto-fix-docs.sh >> $LOGS_DIR/cron-fix.log 2>&1

# 技能健康检查（每天 04:00）
0 4 * * * cd $WORKSPACE && $SCRIPTS_DIR/skill-healthcheck.sh >> $LOGS_DIR/cron-skill-check.log 2>&1

# 技能安装/更新（每天 04:05）
5 4 * * * cd $WORKSPACE && $SCRIPTS_DIR/skill-install.sh >> $LOGS_DIR/cron-skill-install.log 2>&1

# 周报告（每周日 23:00）
0 23 * * 0 cd $WORKSPACE && $SCRIPTS_DIR/weekly-report.sh >> $LOGS_DIR/cron-weekly.log 2>&1
"

# 备份现有 cron
EXISTING_CRON=$(crontab -l 2>/dev/null || echo "")
if [ -n "$EXISTING_CRON" ]; then
    echo "📋 备份现有 cron 配置..."
    echo "$EXISTING_CRON" > "$WORKSPACE/logs/cron-backup-$(date +%Y%m%d-%H%M%S).txt"
fi

# 检查是否已存在 OpenClaw 任务
if echo "$EXISTING_CRON" | grep -q "OpenClaw 自动化任务"; then
    echo "⚠️  检测到已有 OpenClaw cron 任务"
    echo "正在移除旧配置..."
    EXISTING_CRON=$(echo "$EXISTING_CRON" | grep -v "OpenClaw 自动化任务" | grep -v "sync-docs-links" | grep -v "auto-fix-docs" | grep -v "skill-healthcheck" | grep -v "skill-install" | grep -v "weekly-report" | grep -v "# 文档" | grep -v "# 技能" | grep -v "# 周报告")
fi

# 合并 cron 配置
NEW_CRON="$EXISTING_CRON

$CRON_TASKS"

# 安装 cron 配置
echo "$NEW_CRON" | crontab -

echo ""
echo "================================"
echo "✅ Cron 配置完成！"
echo "================================"
echo ""
echo "已配置的任务（上海时间）："
echo "  📅 每天 03:00 - 文档关联检查"
echo "  🔧 每天 03:05 - 文档自动修复"
echo "  🏥 每天 04:00 - 技能健康检查"
echo "  📦 每天 04:05 - 技能安装/更新"
echo "  📊 每周日 23:00 - 周报告"
echo ""
echo "查看 cron 配置："
echo "  crontab -l"
echo ""
echo "查看日志："
echo "  tail -f $LOGS_DIR/cron-sync.log"
echo "  tail -f $LOGS_DIR/cron-skill-check.log"
echo ""
echo "管理 cron："
echo "  crontab -e    # 编辑"
echo "  crontab -l    # 查看"
echo "  crontab -r    # 删除所有（谨慎！）"
echo ""
