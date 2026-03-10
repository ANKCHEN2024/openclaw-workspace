#!/bin/bash
# 一键配置 OpenClaw 定时任务
# 使用方法：在终端运行 ./config-openclaw-cron.sh

echo "⏰ 配置 OpenClaw 定时任务..."
echo ""

WORKSPACE="/Users/chenggl/workspace"

# 定义 cron 任务
CRON_TASKS="# OpenClaw 自动化任务 - 上海时间
0 3 * * * cd $WORKSPACE && ./scripts/sync-docs-links.sh >> logs/cron-sync.log 2>&1
5 3 * * * cd $WORKSPACE && ./scripts/auto-fix-docs.sh >> logs/cron-fix.log 2>&1
0 4 * * * cd $WORKSPACE && ./scripts/skill-healthcheck.sh >> logs/cron-skill-check.log 2>&1
5 4 * * * cd $WORKSPACE && ./scripts/skill-install.sh >> logs/cron-skill-install.log 2>&1
0 23 * * 0 cd $WORKSPACE && ./scripts/weekly-report.sh >> logs/cron-weekly.log 2>&1
"

# 备份现有配置
(crontab -l 2>/dev/null | grep -v "OpenClaw") > /tmp/cron-backup.txt

# 添加新任务
(cat /tmp/cron-backup.txt; echo ""; echo "$CRON_TASKS") | crontab -

echo "✅ 配置完成！"
echo ""
echo "验证：crontab -l"
echo "日志：tail -f $WORKSPACE/logs/cron-sync.log"
