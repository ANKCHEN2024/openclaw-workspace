#!/bin/bash
# =============================================================================
# batch-install-skills.sh - 批量安装技能
# =============================================================================
# 用途：一次性安装多个技能
#
# 用法：./batch-install-skills.sh <skill1> <skill2> <skill3> ...
# 示例：./batch-install-skills.sh github feishu-doc memory-setup
#       ./batch-install-skills.sh --file skills-to-install.txt
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_LEARN_SCRIPT="$SCRIPT_DIR/auto-learn-skill.sh"
LOG_FILE="/Users/chenggl/workspace/training/batch-install-log.md"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 初始化日志
mkdir -p /Users/chenggl/workspace/training
if [ ! -f "$LOG_FILE" ]; then
    cat > "$LOG_FILE" << 'EOF'
# 批量安装日志

_记录所有批量安装的技能_

## 安装记录

EOF
fi

# 检查 auto-learn-skill.sh 是否存在
if [ ! -f "$AUTO_LEARN_SCRIPT" ]; then
    log_error "未找到 auto-learn-skill.sh: $AUTO_LEARN_SCRIPT"
    exit 1
fi

# 解析参数
SKILLS=()
FORCE=false
FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE=true
            shift
            ;;
        --file)
            FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "用法：$0 [options] <skill1> <skill2> ..."
            echo ""
            echo "选项:"
            echo "  --force, -f     强制安装所有技能"
            echo "  --file, -F      从文件读取技能列表（每行一个）"
            echo "  --help, -h      显示帮助"
            echo ""
            echo "示例:"
            echo "  $0 github feishu-doc memory-setup"
            echo "  $0 --force video-edit douyin-video-fetch"
            echo "  $0 --file skills-to-install.txt"
            exit 0
            ;;
        *)
            SKILLS+=("$1")
            shift
            ;;
    esac
done

# 从文件读取技能
if [ -n "$FILE" ]; then
    if [ -f "$FILE" ]; then
        while IFS= read -r line || [ -n "$line" ]; do
            # 跳过空行和注释
            [[ -z "$line" || "$line" =~ ^# ]] && continue
            SKILLS+=("$line")
        done < "$FILE"
        log_info "从文件读取 ${#SKILLS[@]} 个技能"
    else
        log_error "文件不存在：$FILE"
        exit 1
    fi
fi

# 检查是否有技能
if [ ${#SKILLS[@]} -eq 0 ]; then
    log_error "请提供至少一个技能名称"
    echo "用法：$0 [options] <skill1> <skill2> ..."
    echo "使用 --help 查看帮助"
    exit 1
fi

# 统计
TOTAL=${#SKILLS[@]}
SUCCESS=0
FAILED=0
SKIPPED=0

log_info "=========================================="
log_info "批量安装技能"
log_info "=========================================="
log_info "总技能数：$TOTAL"
log_info "强制模式：$FORCE"
echo ""

# 记录批量安装开始
BATCH_ID="batch-$(date '+%Y%m%d-%H%M%S')"
echo "## $BATCH_ID - $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE"
echo "- 总技能数：$TOTAL" >> "$LOG_FILE"
echo "- 强制模式：$FORCE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 安装每个技能
for i in "${!SKILLS[@]}"; do
    SKILL="${SKILLS[$i]}"
    NUM=$((i + 1))
    
    echo ""
    log_info "[$NUM/$TOTAL] 安装技能：$SKILL"
    
    # 检查技能是否已安装
    if clawhub list 2>/dev/null | grep -q "$SKILL"; then
        log_warning "技能已安装，跳过：$SKILL"
        SKIPPED=$((SKIPPED + 1))
        echo "### $SKILL" >> "$LOG_FILE"
        echo "- 状态：⏭️ 已安装，跳过" >> "$LOG_FILE"
        echo "" >> "$LOG_FILE"
        continue
    fi
    
    # 构建安装命令
    if [ "$FORCE" = true ]; then
        FORCE_FLAG="--force"
    else
        FORCE_FLAG=""
    fi
    
    # 执行安装
    if "$AUTO_LEARN_SCRIPT" "$SKILL" "$FORCE_FLAG"; then
        log_success "[$NUM/$TOTAL] 安装成功：$SKILL"
        SUCCESS=$((SUCCESS + 1))
    else
        log_error "[$NUM/$TOTAL] 安装失败：$SKILL"
        FAILED=$((FAILED + 1))
        echo "### $SKILL" >> "$LOG_FILE"
        echo "- 状态：❌ 安装失败" >> "$LOG_FILE"
        echo "" >> "$LOG_FILE"
    fi
done

# 总结
echo ""
log_info "=========================================="
log_info "批量安装完成"
log_info "=========================================="
log_success "成功：$SUCCESS"
if [ $FAILED -gt 0 ]; then
    log_error "失败：$FAILED"
fi
if [ $SKIPPED -gt 0 ]; then
    log_warning "跳过：$SKIPPED"
fi
log_info "总计：$TOTAL"
echo ""

# 记录总结到日志
echo "## 总结" >> "$LOG_FILE"
echo "- 成功：$SUCCESS" >> "$LOG_FILE"
echo "- 失败：$FAILED" >> "$LOG_FILE"
echo "- 跳过：$SKIPPED" >> "$LOG_FILE"
echo "- 总计：$TOTAL" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

log_info "日志已保存到：$LOG_FILE"

# 返回状态
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
