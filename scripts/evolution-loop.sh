#!/bin/bash
# MOSS 10 分钟进化汇报循环脚本

ITERATION=1
LOGFILE="/Users/chenggl/workspace/logs/evolution-loop.log"

echo "进化汇报循环启动于 $(date '+%H:%M:%S')" >> "$LOGFILE"

while true; do
    # 等待 10 分钟
    sleep 600
    
    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date "+%H:%M")
    
    echo "【进化计时器】第 ${ITERATION} 次汇报时间到 (${TIMESTAMP})" >> "$LOGFILE"
    echo "迭代次数：${ITERATION}" >> "$LOGFILE"
    
    # 更新迭代文件
    echo $ITERATION > /Users/chenggl/workspace/memory/evolution-iteration.txt
    
    # 发送通知到桌面（ macOS ）
    osascript -e "display notification \"MOSS 进化汇报 #${ITERATION} 时间到\" with title \"MOSS Evolution\"" 2>/dev/null || true
done
