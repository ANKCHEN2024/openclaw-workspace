#!/bin/bash
# 每日学习提醒和进度追踪脚本
# 添加到 crontab: 0 9 * * * /Users/chenggl/workspace/scripts/daily-learning-reminder.sh

set -e

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

echo "🚀 开始每日学习流程..."
echo ""

# 1. 计算学习路径（如果需要更新）
echo "📊 计算学习路径..."
node scripts/calculate-learning-path.js 2>/dev/null || echo "⚠️  学习路径计算跳过"

# 2. 追踪学习进度
echo "📈 更新学习进度..."
node scripts/track-learning-progress.js 2>/dev/null || echo "⚠️  学习进度追踪跳过"

# 3. 生成今日学习建议
echo ""
echo "📋 今日学习建议："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 读取学习计划
if [ -f "training/personalized-learning-plan.md" ]; then
    echo "✅ 本周学习优先级："
    grep -A 2 "### 优先级 1" training/personalized-learning-plan.md | head -5 | sed 's/^/   /'
else
    echo "   ⚠️  学习计划文件不存在"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4. 显示进度摘要
if [ -f "training/learning-progress-log.json" ]; then
    TOTAL_HOURS=$(node -e "const d=require('./training/learning-progress-log.json'); console.log((d.sessions.reduce((s,x)=>s+x.duration,0)/60).toFixed(1))" 2>/dev/null || echo "0")
    TOTAL_SKILLS=$(node -e "const d=require('./training/learning-progress-log.json'); console.log(Object.keys(d.skills).length)" 2>/dev/null || echo "0")
    
    echo ""
    echo "📊 学习进度摘要："
    echo "   总学习时长：${TOTAL_HOURS} 小时"
    echo "   涉及技能：${TOTAL_SKILLS} 个"
fi

echo ""
echo "💡 提示：使用以下命令记录学习："
echo "   node scripts/track-learning-progress.js log <技能名> <分钟数>"
echo ""
echo "✅ 每日学习流程完成！"
