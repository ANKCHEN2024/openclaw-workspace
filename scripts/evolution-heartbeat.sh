#!/bin/bash
# MOSS 10 分钟进化汇报触发器
# 通过发送消息到当前会话触发 MOSS 生成汇报

CHAT_ID="oc_e4160d878731241cf206bd6d97cb5c54"
ITERATION_FILE="/Users/chenggl/workspace/memory/evolution-iteration.txt"

# 读取当前迭代次数
if [ -f "$ITERATION_FILE" ]; then
    ITERATION=$(cat "$ITERATION_FILE")
else
    ITERATION=1
fi

NEXT_ITERATION=$((ITERATION + 1))
echo $NEXT_ITERATION > "$ITERATION_FILE"

TIMESTAMP=$(date "+%H:%M")

# 发送消息到当前会话（通过 openclaw）
# 注意：这里需要 MOSS 自己处理，脚本只是标记
echo "【进化计时器】第 ${ITERATION} 次汇报时间到 (${TIMESTAMP})"
echo "迭代次数已更新：${NEXT_ITERATION}"
