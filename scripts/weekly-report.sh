#!/bin/bash
# weekly-report.sh - 生成周报告
# 汇总本周的开发进展、决策、和问题

set -e

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

REPORT_DATE=$(date +"%Y-%m-%d")
WEEK_START=$(date -v-sun +%Y-%m-%d 2>/dev/null || date -d 'last sunday' +%Y-%m-%d 2>/dev/null || echo "N/A")
OUTPUT_FILE="$WORKSPACE/logs/weekly-report-$REPORT_DATE.md"

echo "📊 生成周报告..."

# 创建报告
cat > "$OUTPUT_FILE" << EOF
# 周报告 - $WEEK_START 至 $REPORT_DATE

**生成时间**: $(date +"%Y-%m-%d %H:%M:%S")  
**生成者**: MOSS

---

## 📈 本周概览

### 完成的任务
<!-- 需要手动填写或从 git 日志提取 -->
- [ ] 任务 1
- [ ] 任务 2

### 关键决策
<!-- 从 decisions/ 目录提取 -->
EOF

# 提取本周的决策
if [ -d "$WORKSPACE/decisions" ]; then
    DECISION_COUNT=$(find "$WORKSPACE/decisions" -name "*.md" -type f -mtime -7 | wc -l | tr -d ' ')
    echo "本周决策数：$DECISION_COUNT" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    if [ "$DECISION_COUNT" -gt 0 ]; then
        echo "### 决策列表" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        find "$WORKSPACE/decisions" -name "*.md" -type f -mtime -7 -exec basename {} \; | while read -r file; do
            echo "- $file" >> "$OUTPUT_FILE"
        done
    fi
else
    echo "_无决策记录_" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << EOF

### 文档维护状态
<!-- 从日志文件提取 -->
EOF

# 提取本周的文档维护日志
if [ -f "$WORKSPACE/logs/auto-fix-docs.log" ]; then
    FIX_COUNT=$(grep -c "$(date +%Y-%m-%d)" "$WORKSPACE/logs/auto-fix-docs.log" 2>/dev/null || echo "0")
    echo "- 本周文档修复次数：$FIX_COUNT" >> "$OUTPUT_FILE"
else
    echo "- 本周文档修复次数：无记录" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << EOF

### Subagent 使用情况
<!-- 需要从 sessions 或 subagents 日志提取 -->
- 活跃 subagent 数：待统计
- 总运行时长：待统计
- 完成任务数：待统计

---

## 🎯 项目进展

### AI 短剧平台 (ai-drama-platform)
- 当前状态：开发中
- 本周进展：待填写
- 阻塞问题：无

### 短视频平台 (short-video-platform)
- 当前状态：已完成 MVP
- 本周进展：待填写
- 阻塞问题：无

---

## 📚 学习与培训

### 新技术学习
- [ ] 技术 1
- [ ] 技术 2

### 经验分享
- 无

---

## 🐛 问题与改进

### 遇到的问题
- 无

### 改进建议
- 无

---

## 📅 下周计划

### 优先级任务
- [ ] 任务 1
- [ ] 任务 2

### 学习目标
- [ ] 学习 X 技术
- [ ] 完成 Y 培训

---

## 📝 备注

_自动生成的周报告，部分内容需要手动补充_

**相关文件**:
- `../decisions/` - 决策日志
- `../memory/` - 每日笔记
- `../MEMORY.md` - 长期记忆
- `../HEARTBEAT.md` - 心跳任务配置

---
*报告生成于 $WORKSPACE/logs/weekly-report-$REPORT_DATE.md*
EOF

echo ""
echo "================================"
echo "📊 周报告生成完成"
echo "================================"
echo ""
echo "报告位置：$OUTPUT_FILE"
echo ""
echo "查看报告："
echo "  cat $OUTPUT_FILE"
echo ""
echo "下一步："
echo "  1. 补充待填写的内容"
echo "  2. 发送给老板审阅"
echo "  3. 归档到 decisions/ 或 memory/"
echo ""
