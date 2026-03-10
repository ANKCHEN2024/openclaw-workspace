#!/bin/bash
# skill-healthcheck.sh - 技能健康检查（无交互，适合自动化）
# 输出 JSON 格式报告，适合日志和监控

set -e

WORKSPACE="/Users/chenggl/workspace"
SKILLS_DIR="$WORKSPACE/skills"
OPENCLAW_SKILLS_DIR="/opt/homebrew/lib/node_modules/openclaw/skills"
LOGS_DIR="$WORKSPACE/logs"

mkdir -p "$LOGS_DIR"

# 初始化计数器
TOTAL_SKILLS=0
HEALTHY_SKILLS=0
ISSUES=()

# 检查本地技能
if [ -d "$SKILLS_DIR" ]; then
    for skill_dir in "$SKILLS_DIR"/*/; do
        if [ -d "$skill_dir" ]; then
            ((TOTAL_SKILLS++))
            skill_name=$(basename "$skill_dir")
            
            # 检查 SKILL.md
            if [ -f "$skill_dir/SKILL.md" ]; then
                # 检查必要字段
                if grep -q "Location" "$skill_dir/SKILL.md" 2>/dev/null; then
                    ((HEALTHY_SKILLS++))
                else
                    ISSUES+=("$skill_name: SKILL.md 缺少 Location 字段")
                fi
            else
                ISSUES+=("$skill_name: 缺少 SKILL.md")
            fi
        fi
    done
fi

# 检查 clawhub
if ! command -v clawhub &> /dev/null; then
    ISSUES+=("clawhub CLI 未安装")
fi

# 生成报告
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPORT_FILE="$LOGS_DIR/skill-healthcheck-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "summary": {
    "totalSkills": $TOTAL_SKILLS,
    "healthySkills": $HEALTHY_SKILLS,
    "issuesCount": ${#ISSUES[@]}
  },
  "issues": [
EOF

# 添加问题列表
FIRST=true
for issue in "${ISSUES[@]}"; do
    if [ "$FIRST" = true ]; then
        echo "    \"$issue\"" >> "$REPORT_FILE"
        FIRST=false
    else
        echo "    ,\"$issue\"" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

  ],
  "status": "$([ ${#ISSUES[@]} -eq 0 ] && echo "healthy" || echo "issues_found")"
}
EOF

# 输出摘要
echo "技能健康检查 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"
echo "总技能数：$TOTAL_SKILLS"
echo "健康技能：$HEALTHY_SKILLS"
echo "发现问题：${#ISSUES[@]}"
echo ""

if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "问题列表:"
    for issue in "${ISSUES[@]}"; do
        echo "  ⚠️  $issue"
    done
    echo ""
    echo "建议运行：./scripts/skill-repair.sh 进行修复"
else
    echo "✅ 所有技能健康状态良好"
fi

echo ""
echo "详细报告：$REPORT_FILE"

# 记录日志
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 技能健康检查：$TOTAL_SKILLS 个技能，${#ISSUES[@]} 个问题" >> "$LOGS_DIR/skill-healthcheck.log"

# 如果有问题，返回非零退出码（用于自动化）
[ ${#ISSUES[@]} -eq 0 ]
