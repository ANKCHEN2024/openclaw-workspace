#!/bin/bash
# macOS cron/launchd 定时任务修复脚本

echo "🔧 检查并修复 macOS 定时任务配置..."
echo ""

# 方法 1: 尝试启动 cron 服务
echo "1️⃣ 尝试启动 cron 服务..."
if sudo launchctl load -w /System/Library/LaunchDaemons/cron.plist 2>/dev/null; then
    echo "✅ cron 服务已启动"
else
    echo "⚠️ cron 服务启动失败，尝试方法 2..."
fi

# 检查 cron 是否运行
if ps aux | grep -v grep | grep -q cron; then
    echo "✅ cron 进程正在运行"
else
    echo "❌ cron 进程未运行"
fi

echo ""
echo "2️⃣ 创建 launchd 配置文件（macOS 推荐方式）..."

# 创建 launchd plist 文件
LAUNCHD_PLIST="$HOME/Library/LaunchAgents/com.workspace.openclaw.heartbeat.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$LAUNCHD_PLIST" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.workspace.openclaw.heartbeat</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-l</string>
        <string>-c</string>
        <string>cd /Users/chenggl/workspace && ./scripts/skill-healthcheck.sh</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Users/chenggl/workspace</string>
    
    <key>StandardOutPath</key>
    <string>/Users/chenggl/workspace/logs/launchd-healthcheck.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/chenggl/workspace/logs/launchd-healthcheck.err</string>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>4</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
EOF

echo "✅ launchd plist 已创建：$LAUNCHD_PLIST"

# 加载 launchd 配置
launchctl unload "$LAUNCHD_PLIST" 2>/dev/null
launchctl load -w "$LAUNCHD_PLIST"

echo "✅ launchd 任务已加载"

echo ""
echo "3️⃣ 验证 crontab 配置..."
crontab -l

echo ""
echo "4️⃣ 测试脚本执行权限..."
for script in sync-docs-links.sh skill-healthcheck.sh autonomous-evolution.sh money-scan.sh; do
    if [ -x "/Users/chenggl/workspace/scripts/$script" ]; then
        echo "✅ $script 有执行权限"
    else
        echo "❌ $script 缺少执行权限，修复中..."
        chmod +x "/Users/chenggl/workspace/scripts/$script"
    fi
done

echo ""
echo "5️⃣ 手动测试执行（验证脚本可用性）..."
cd /Users/chenggl/workspace && ./scripts/skill-healthcheck.sh > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ skill-healthcheck.sh 执行成功"
else
    echo "❌ skill-healthcheck.sh 执行失败"
fi

echo ""
echo "================================"
echo "📋 总结："
echo "- cron 服务：$(ps aux | grep -v grep | grep -q cron && echo '运行中' || echo '未运行')"
echo "- launchd 任务：已配置（每天 04:00 执行技能检查）"
echo "- 脚本权限：已检查"
echo ""
echo "💡 建议：macOS 推荐使用 launchd 而非 cron"
echo "   查看 launchd 任务：launchctl list | grep openclaw"
echo "   查看日志：tail -f ~/workspace/logs/launchd-healthcheck.log"
echo "================================"
