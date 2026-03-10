#!/bin/bash
# launchd-setup.sh - 一键配置 macOS launchd 定时任务
# 替代 cron，更可靠

set -e

WORKSPACE="/Users/chenggl/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"

echo "⏰ 开始配置 launchd 定时任务..."

# 确保 launchd 目录存在
mkdir -p "$LAUNCHD_DIR"

# 确保 logs 目录存在
mkdir -p "$WORKSPACE/logs"

# 确保脚本有执行权限
chmod +x "$SCRIPTS_DIR"/*.sh

# 复制 plist 文件到 launchd 目录
echo "📋 复制 plist 配置文件..."
cp "$SCRIPTS_DIR/com.openclaw.docs-sync.plist" "$LAUNCHD_DIR/"
cp "$SCRIPTS_DIR/com.openclaw.docs-fix.plist" "$LAUNCHD_DIR/"
cp "$SCRIPTS_DIR/com.openclaw.weekly-report.plist" "$LAUNCHD_DIR/"
cp "$SCRIPTS_DIR/com.openclaw.skill-healthcheck.plist" "$LAUNCHD_DIR/"
cp "$SCRIPTS_DIR/com.openclaw.skill-install.plist" "$LAUNCHD_DIR/"

# 加载任务
echo "🔧 加载 launchd 任务..."

# 卸载旧任务（如果存在）
for task in docs-sync docs-fix weekly-report skill-healthcheck skill-install; do
    launchctl unload "$LAUNCHD_DIR/com.openclaw.$task.plist" 2>/dev/null || true
done

# 加载新任务
launchctl load "$LAUNCHD_DIR/com.openclaw.docs-sync.plist"
echo "  ✅ 文档同步任务已加载（每天 03:00）"

launchctl load "$LAUNCHD_DIR/com.openclaw.docs-fix.plist"
echo "  ✅ 文档修复任务已加载（每天 03:05）"

launchctl load "$LAUNCHD_DIR/com.openclaw.skill-healthcheck.plist"
echo "  ✅ 技能健康检查已加载（每天 04:00）"

launchctl load "$LAUNCHD_DIR/com.openclaw.skill-install.plist"
echo "  ✅ 技能安装/更新已加载（每天 04:05）"

launchctl load "$LAUNCHD_DIR/com.openclaw.weekly-report.plist"
echo "  ✅ 周报告任务已加载（每周日 23:00）"

echo ""
echo "================================"
echo "✅ launchd 配置完成！"
echo "================================"
echo ""
echo "已配置的任务："
echo "  📅 每天 03:00 - 文档关联检查 (com.openclaw.docs-sync)"
echo "  🔧 每天 03:05 - 文档自动修复 (com.openclaw.docs-fix)"
echo "  🏥 每天 04:00 - 技能健康检查 (com.openclaw.skill-healthcheck)"
echo "  📦 每天 04:05 - 技能安装/更新 (com.openclaw.skill-install)"
echo "  📊 每周日 23:00 - 周报告 (com.openclaw.weekly-report)"
echo ""
echo "管理任务："
echo "  查看状态：launchctl list | grep openclaw"
echo "  卸载任务：launchctl unload ~/Library/LaunchAgents/com.openclaw.*.plist"
echo "  重新加载：launchctl load ~/Library/LaunchAgents/com.openclaw.*.plist"
echo ""
echo "日志位置："
echo "  $WORKSPACE/logs/launchd-*.log"
echo ""
echo "测试运行（立即执行一次）："
echo "  launchctl start com.openclaw.docs-sync"
echo "  launchctl start com.openclaw.docs-fix"
echo ""
