#!/bin/bash
# =============================================================================
# skill-learning-cron.sh - 技能学习定时任务
# =============================================================================
# 用途：定期自动学习新技能
#
# 用法：将此脚本添加到 crontab
# 示例：0 9 * * 1 /Users/chenggl/workspace/scripts/skill-learning-cron.sh
#       （每周一早上 9 点运行）
# =============================================================================

set -e

# 配置
WORKSPACE="/Users/chenggl/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
TRAINING_DIR="$WORKSPACE/training"
QUEUE_FILE="$TRAINING_DIR/skill-learning-queue.md"
LOG_FILE="$TRAINING_DIR/cron-learning-log.md"
AUTO_LEARN_SCRIPT="$SCRIPTS_DIR/auto-learn-skill.sh"
BATCH_INSTALL_SCRIPT="$SCRIPTS_DIR/batch-install-skills.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M')]${NC} $1"
}

# 初始化日志
mkdir -p "$TRAINING_DIR"
if [ ! -f "$LOG_FILE" ]; then
    cat > "$LOG_FILE" << 'EOF'
# 定时学习日志

_自动记录 cron 触发的技能学习_

## 学习记录

EOF
fi

log_info "=========================================="
log_info "技能学习定时任务启动"
log_info "=========================================="

# 检查必要文件
if [ ! -f "$QUEUE_FILE" ]; then
    log_error "技能学习队列不存在：$QUEUE_FILE"
    exit 1
fi

if [ ! -f "$AUTO_LEARN_SCRIPT" ]; then
    log_error "自动学习脚本不存在：$AUTO_LEARN_SCRIPT"
    exit 1
fi

# 从队列中提取高优先级技能（尚未学习的）
log_info "读取技能学习队列..."

# 提取高优先级技能名称
HIGH_PRIORITY_SKILLS=()
while IFS= read -r line; do
    # 匹配高优先级列表中的技能行
    if [[ "$line" =~ ^\|[[:space:]]*[0-9]+\[[:space:]]*\|[[:space:]]*\*\*([^*]+)\*\* ]]; then
        SKILL_NAME="${BASH_REMATCH[1]}"
        # 检查技能是否已安装
        if ! clawhub list 2>/dev/null | grep -q "$SKILL_NAME"; then
            HIGH_PRIORITY_SKILLS+=("$SKILL_NAME")
        fi
    fi
done < "$QUEUE_FILE"

if [ ${#HIGH_PRIORITY_SKILLS[@]} -eq 0 ]; then
    log_info "高优先级技能已全部学习，检查中优先级..."
    
    # 提取中优先级技能
    IN_MEDIUM_SECTION=false
    while IFS= read -r line; do
        if [[ "$line" =~ "## 中优先级" ]]; then
            IN_MEDIUM_SECTION=true
            continue
        fi
        if [[ "$line" =~ "## 低优先级" ]]; then
            IN_MEDIUM_SECTION=false
            continue
        fi
        if [ "$IN_MEDIUM_SECTION" = true ] && [[ "$line" =~ ^\|[[:space:]]*[0-9]+\|[[:space:]]*\*\*([^*]+)\*\* ]]; then
            SKILL_NAME="${BASH_REMATCH[1]}"
            if ! clawhub list 2>/dev/null | grep -q "$SKILL_NAME"; then
                HIGH_PRIORITY_SKILLS+=("$SKILL_NAME")
            fi
        fi
    done < "$QUEUE_FILE"
fi

if [ ${#HIGH_PRIORITY_SKILLS[@]} -eq 0 ]; then
    log_success "所有计划技能已学习完成！"
    echo "" >> "$LOG_FILE"
    echo "### $(date '+%Y-%m-%d %H:%M') - 完成" >> "$LOG_FILE"
    echo "- 状态：✅ 所有技能已学习" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    exit 0
fi

# 限制每次运行的技能数量（避免超时）
MAX_SKILLS_PER_RUN=3
SKILLS_TO_INSTALL=("${HIGH_PRIORITY_SKILLS[@]:0:$MAX_SKILLS_PER_RUN}")

log_info "待安装技能：${#SKILLS_TO_INSTALL[@]} 个"
for skill in "${SKILLS_TO_INSTALL[@]}"; do
    log_info "  - $skill"
done

echo "" >> "$LOG_FILE"
echo "### $(date '+%Y-%m-%d %H:%M') - 批量安装" >> "$LOG_FILE"
echo "- 技能数：${#SKILLS_TO_INSTALL[@]}" >> "$LOG_FILE"
echo "- 技能列表：" >> "$LOG_FILE"
for skill in "${SKILLS_TO_INSTALL[@]}"; do
    echo "  - $skill" >> "$LOG_FILE"
done
echo "" >> "$LOG_FILE"

# 批量安装
log_info "开始批量安装..."
if "$BATCH_INSTALL_SCRIPT" "${SKILLS_TO_INSTALL[@]}"; then
    log_success "批量安装成功"
    echo "- 状态：✅ 成功" >> "$LOG_FILE"
else
    log_error "批量安装部分失败"
    echo "- 状态：⚠️ 部分失败" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# 运行验证
log_info "运行技能验证..."
if [ -f "$SCRIPTS_DIR/skill-validator.sh" ]; then
    "$SCRIPTS_DIR/skill-validator.sh" --security
    log_success "验证完成"
fi

log_info "=========================================="
log_success "定时任务完成"
log_info "=========================================="
log_info "日志：$LOG_FILE"
