#!/bin/bash
# =============================================================================
# skill-validator.sh - 技能验证脚本
# =============================================================================
# 用途：验证已安装技能的功能和安全性
#
# 用法：./skill-validator.sh [skill-name]
# 示例：./skill-validator.sh                    # 验证所有技能
#       ./skill-validator.sh video-frames       # 验证单个技能
#       ./skill-validator.sh --security         # 仅安全检查
#       ./skill-validator.sh --functional       # 仅功能检查
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
SKILLS_DIR="/Users/chenggl/workspace/skills"
TRAINING_DIR="/Users/chenggl/workspace/training"
VALIDATION_REPORT="$TRAINING_DIR/skill-validation-report.md"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_header() {
    echo -e "${MAGENTA}=========================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}=========================================${NC}"
}

# 检查参数
CHECK_MODE="all"  # all, security, functional
TARGET_SKILL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --security|-s)
            CHECK_MODE="security"
            shift
            ;;
        --functional|-f)
            CHECK_MODE="functional"
            shift
            ;;
        --all|-a)
            CHECK_MODE="all"
            shift
            ;;
        --help|-h)
            echo "用法：$0 [options] [skill-name]"
            echo ""
            echo "选项:"
            echo "  --security, -s    仅安全检查"
            echo "  --functional, -f  仅功能检查"
            echo "  --all, -a         完整检查（默认）"
            echo "  --help, -h        显示帮助"
            echo ""
            echo "示例:"
            echo "  $0                              # 验证所有技能"
            echo "  $0 video-frames                 # 验证单个技能"
            echo "  $0 --security                   # 仅安全检查所有技能"
            echo "  $0 --functional video-frames    # 仅功能检查"
            exit 0
            ;;
        *)
            TARGET_SKILL="$1"
            shift
            ;;
    esac
done

# 初始化报告
mkdir -p "$TRAINING_DIR"
cat > "$VALIDATION_REPORT" << EOF
# 技能验证报告

_生成时间：$(date '+%Y-%m-%d %H:%M')_
_检查模式：$CHECK_MODE_

---

## 验证摘要

EOF

# 获取技能列表
if [ -n "$TARGET_SKILL" ]; then
    SKILLS_TO_CHECK=("$TARGET_SKILL")
else
    if [ -d "$SKILLS_DIR" ]; then
        mapfile -t SKILLS_TO_CHECK < <(ls "$SKILLS_DIR" 2>/dev/null)
    else
        log_error "技能目录不存在：$SKILLS_DIR"
        exit 1
    fi
fi

if [ ${#SKILLS_TO_CHECK[@]} -eq 0 ]; then
    log_error "未找到技能"
    exit 1
fi

log_header "技能验证开始"
log_info "检查模式：$CHECK_MODE"
log_info "技能数量：${#SKILLS_TO_CHECK[@]}"
echo ""

# 统计
TOTAL=${#SKILLS_TO_CHECK[@]}
PASSED=0
FAILED=0
WARNINGS=0

# 验证每个技能
for i in "${!SKILLS_TO_CHECK[@]}"; do
    SKILL="${SKILLS_TO_CHECK[$i]}"
    NUM=$((i + 1))
    SKILL_PATH="$SKILLS_DIR/$SKILL"
    
    echo ""
    log_header "[$NUM/$TOTAL] 验证技能：$SKILL"
    
    # 添加到报告
    echo "### $SKILL" >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
    
    SKILL_PASSED=true
    SKILL_WARNINGS=0
    
    # ========== 安全检查 ==========
    if [ "$CHECK_MODE" = "all" ] || [ "$CHECK_MODE" = "security" ]; then
        log_info "🔒 安全检查..."
        
        # 检查 SKILL.md 是否存在
        if [ -f "$SKILL_PATH/SKILL.md" ]; then
            log_success "SKILL.md 存在"
            echo "- SKILL.md: ✓ 存在" >> "$VALIDATION_REPORT"
        else
            log_warning "SKILL.md 缺失"
            echo "- SKILL.md: ✗ 缺失" >> "$VALIDATION_REPORT"
            SKILL_WARNINGS=$((SKILL_WARNINGS + 1))
        fi
        
        # 检查可疑文件
        if [ -f "$SKILL_PATH/install.sh" ]; then
            if grep -q "curl.*\|.*bash\|wget.*\|.*sh" "$SKILL_PATH/install.sh" 2>/dev/null; then
                log_warning "install.sh 包含远程执行命令"
                echo "- 安装脚本：! 包含远程执行命令" >> "$VALIDATION_REPORT"
                SKILL_WARNINGS=$((SKILL_WARNINGS + 1))
            else
                log_success "安装脚本安全"
                echo "- 安装脚本：✓ 安全" >> "$VALIDATION_REPORT"
            fi
        fi
        
        # 检查权限
        if [ -d "$SKILL_PATH/bin" ]; then
            for bin_file in "$SKILL_PATH/bin"/*; do
                if [ -f "$bin_file" ] && [ ! -x "$bin_file" ]; then
                    log_warning "bin 文件缺少执行权限：$(basename "$bin_file")"
                    SKILL_WARNINGS=$((SKILL_WARNINGS + 1))
                fi
            done
        fi
        
        # 运行 skill-scanner（如果存在）
        if [ -f "$SKILLS_DIR/skill-scanner/run.sh" ] && [ -n "$TARGET_SKILL" ]; then
            log_info "运行 skill-scanner..."
            if bash "$SKILLS_DIR/skill-scanner/run.sh" "$SKILL" 2>/dev/null; then
                log_success "skill-scanner 检查通过"
                echo "- skill-scanner: ✓ 通过" >> "$VALIDATION_REPORT"
            else
                log_warning "skill-scanner 发现潜在问题"
                echo "- skill-scanner: ! 潜在问题" >> "$VALIDATION_REPORT"
                SKILL_WARNINGS=$((SKILL_WARNINGS + 1))
            fi
        fi
    fi
    
    # ========== 功能检查 ==========
    if [ "$CHECK_MODE" = "all" ] || [ "$CHECK_MODE" = "functional" ]; then
        log_info "🔧 功能检查..."
        
        # 检查 run.sh
        if [ -f "$SKILL_PATH/run.sh" ]; then
            log_success "run.sh 存在"
            echo "- run.sh: ✓ 存在" >> "$VALIDATION_REPORT"
            
            # 检查执行权限
            if [ -x "$SKILL_PATH/run.sh" ]; then
                log_success "run.sh 有执行权限"
                echo "- 执行权限：✓ 已设置" >> "$VALIDATION_REPORT"
            else
                log_warning "run.sh 缺少执行权限"
                echo "- 执行权限：✗ 未设置" >> "$VALIDATION_REPORT"
                chmod +x "$SKILL_PATH/run.sh"
                log_info "已添加执行权限"
                SKILL_WARNINGS=$((SKILL_WARNINGS + 1))
            fi
        else
            log_info "run.sh 不存在（可能是库类型技能）"
            echo "- run.sh: - 不存在（库类型）" >> "$VALIDATION_REPORT"
        fi
        
        # 检查测试脚本
        if [ -f "$SKILL_PATH/test.sh" ]; then
            log_info "发现测试脚本，运行测试..."
            if bash "$SKILL_PATH/test.sh" 2>/dev/null; then
                log_success "测试通过"
                echo "- 测试：✓ 通过" >> "$VALIDATION_REPORT"
            else
                log_error "测试失败"
                echo "- 测试：✗ 失败" >> "$VALIDATION_REPORT"
                SKILL_PASSED=false
            fi
        else
            log_info "无测试脚本"
            echo "- 测试：- 无脚本" >> "$VALIDATION_REPORT"
        fi
        
        # 检查集成脚本
        if [ -f "$SKILL_PATH/integrate.sh" ]; then
            log_info "发现集成脚本"
            echo "- 集成脚本：✓ 存在" >> "$VALIDATION_REPORT"
        else
            echo "- 集成脚本：- 不存在" >> "$VALIDATION_REPORT"
        fi
        
        # 检查文档
        if [ -f "$SKILL_PATH/README.md" ]; then
            log_success "README.md 存在"
            echo "- README.md: ✓ 存在" >> "$VALIDATION_REPORT"
        else
            echo "- README.md: - 不存在" >> "$VALIDATION_REPORT"
        fi
        
        # 检查示例
        if [ -d "$SKILL_PATH/examples" ]; then
            EXAMPLE_COUNT=$(ls "$SKILL_PATH/examples" | wc -l)
            log_success "示例目录存在 ($EXAMPLE_COUNT 个示例)"
            echo "- 示例：✓ $EXAMPLE_COUNT 个" >> "$VALIDATION_REPORT"
        else
            echo "- 示例：- 无示例" >> "$VALIDATION_REPORT"
        fi
    fi
    
    # 技能总结
    echo ""
    if [ "$SKILL_PASSED" = true ]; then
        if [ $SKILL_WARNINGS -gt 0 ]; then
            log_warning "验证通过（$SKILL_WARNINGS 个警告）"
            echo "" >> "$VALIDATION_REPORT"
            echo "**状态**: ⚠️ 通过（$SKILL_WARNINGS 警告）" >> "$VALIDATION_REPORT"
            WARNINGS=$((WARNINGS + SKILL_WARNINGS))
        else
            log_success "验证通过"
            echo "" >> "$VALIDATION_REPORT"
            echo "**状态**: ✅ 通过" >> "$VALIDATION_REPORT"
            PASSED=$((PASSED + 1))
        fi
    else
        log_error "验证失败"
        echo "" >> "$VALIDATION_REPORT"
        echo "**状态**: ❌ 失败" >> "$VALIDATION_REPORT"
        FAILED=$((FAILED + 1))
    fi
    
    echo "---" >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
done

# ========== 生成报告摘要 ==========
echo ""
log_header "验证完成"

cat >> "$VALIDATION_REPORT" << EOF

---

## 验证摘要

| 指标 | 数量 |
|------|------|
| 总技能数 | $TOTAL |
| 通过 | $PASSED |
| 失败 | $FAILED |
| 警告 | $WARNINGS |
| 通过率 | $(( (PASSED * 100) / TOTAL ))% |

## 建议

EOF

if [ $FAILED -gt 0 ]; then
    echo "- ⚠️ 有 $FAILED 个技能验证失败，需要修复" >> "$VALIDATION_REPORT"
fi

if [ $WARNINGS -gt 0 ]; then
    echo "- ⚠️ 有 $WARNINGS 个警告，建议检查" >> "$VALIDATION_REPORT"
fi

if [ $PASSED -eq $TOTAL ]; then
    echo "- ✅ 所有技能验证通过" >> "$VALIDATION_REPORT"
fi

cat >> "$VALIDATION_REPORT" << EOF

---

_报告生成时间：$(date '+%Y-%m-%d %H:%M')_
_下次验证：建议每周运行一次_
EOF

# 打印摘要
echo ""
echo "验证摘要:"
echo "  总技能数：$TOTAL"
echo "  通过：$PASSED"
echo "  失败：$FAILED"
echo "  警告：$WARNINGS"
echo "  通过率：$(( (PASSED * 100) / TOTAL ))%"
echo ""
log_info "详细报告：$VALIDATION_REPORT"

# 返回状态
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
