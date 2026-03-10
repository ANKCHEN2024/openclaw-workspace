#!/bin/bash
# =============================================================================
# Quality Gate Script - MOSS 质量门禁系统
# =============================================================================
# 用途：代码提交前自动检查，确保零缺陷交付
# 使用：./scripts/quality-gate.sh [strict|quick]
#   - strict: 完整检查（默认）
#   - quick: 快速检查（仅关键项）
# =============================================================================

# 注意：不使用 set -e，因为 ((var++)) 在 var=0 时会返回 1

# 配置
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$WORKSPACE_ROOT/scripts"
DOCS_DIR="$WORKSPACE_ROOT/docs"
MEMORY_DIR="$WORKSPACE_ROOT/memory"
LOGS_DIR="$WORKSPACE_ROOT/logs"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; ((CHECKS_PASSED++)); }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; ((CHECKS_WARNING++)); }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; ((CHECKS_FAILED++)); }

# 分隔线
separator() { echo ""; echo "───────────────────────────────────────────────────────────────"; echo ""; }

# =============================================================================
# 1. 代码质量检查
# =============================================================================
check_code_quality() {
    log_info "检查代码质量..."
    separator
    
    # 检查 shell 脚本语法
    local shell_scripts=$(find "$SCRIPTS_DIR" -name "*.sh" -type f 2>/dev/null | head -20)
    if [ -n "$shell_scripts" ]; then
        local syntax_errors=0
        for script in $shell_scripts; do
            if ! bash -n "$script" 2>/dev/null; then
                log_error "语法错误：$script"
                ((syntax_errors++))
            fi
        done
        if [ $syntax_errors -eq 0 ]; then
            log_success "Shell 脚本语法检查通过 (${shell_scripts##*/} 等 $(echo $shell_scripts | wc -w) 个文件)"
        fi
    else
        log_warning "未找到 Shell 脚本文件"
    fi
    
    # 检查脚本可执行权限
    local non_executable=$(find "$SCRIPTS_DIR" -name "*.sh" -type f ! -perm -u+x 2>/dev/null | head -5)
    if [ -n "$non_executable" ]; then
        log_warning "以下脚本缺少可执行权限：$(echo $non_executable | tr '\n' ' ')"
    else
        log_success "脚本权限检查通过"
    fi
    
    # 检查是否有明显的硬编码密码/密钥
    local secrets_found=$(grep -r "password\s*=\s*['\"][^'\"]*['\"]" "$SCRIPTS_DIR" 2>/dev/null | head -3 || true)
    if [ -n "$secrets_found" ]; then
        log_warning "发现可能的硬编码密码（请确认是否为测试数据）"
    else
        log_success "未发现明显的安全风险（硬编码密码）"
    fi
    
    separator
}

# =============================================================================
# 2. 文档完整性检查
# =============================================================================
check_documentation() {
    log_info "检查文档完整性..."
    separator
    
    # 核心文档检查
    local core_docs=("AGENTS.md" "SOUL.md" "IDENTITY.md" "USER.md" "WORK_PRINCIPLES.md" "TOOLS.md")
    local missing_docs=()
    
    for doc in "${core_docs[@]}"; do
        if [ ! -f "$WORKSPACE_ROOT/$doc" ]; then
            missing_docs+=("$doc")
            log_error "缺失核心文档：$doc"
        fi
    done
    
    if [ ${#missing_docs[@]} -eq 0 ]; then
        log_success "核心文档完整 (${#core_docs[@]} 个文件)"
    fi
    
    # 检查 README
    if [ -f "$SCRIPTS_DIR/README.md" ]; then
        log_success "脚本目录有 README 文档"
    else
        log_warning "scripts/README.md 不存在"
    fi
    
    # 检查 docs 目录
    if [ -d "$DOCS_DIR" ] && [ "$(ls -A $DOCS_DIR 2>/dev/null)" ]; then
        local doc_count=$(ls -1 "$DOCS_DIR" 2>/dev/null | wc -l)
        log_success "docs 目录包含 $doc_count 个文档"
    else
        log_warning "docs 目录为空或不存在"
    fi
    
    # 检查 memory 目录（每日笔记）
    local today=$(date +%Y-%m-%d)
    if [ -f "$MEMORY_DIR/$today.md" ]; then
        log_success "今日记忆文件已创建 ($today.md)"
    else
        log_warning "今日记忆文件未创建 ($today.md)"
    fi
    
    separator
}

# =============================================================================
# 3. 测试覆盖率检查（模拟）
# =============================================================================
check_test_coverage() {
    log_info "检查测试覆盖..."
    separator
    
    # 检查测试脚本是否存在
    if [ -f "$SCRIPTS_DIR/test-simple.sh" ]; then
        log_success "基础测试脚本存在 (test-simple.sh)"
    else
        log_warning "缺少基础测试脚本"
    fi
    
    if [ -f "$SCRIPTS_DIR/test-automation.sh" ]; then
        log_success "自动化测试脚本存在 (test-automation.sh)"
    else
        log_warning "缺少自动化测试脚本"
    fi
    
    # 检查最近是否有测试运行记录
    if [ -d "$LOGS_DIR" ]; then
        local recent_tests=$(find "$LOGS_DIR" -name "*test*" -type f -mtime -7 2>/dev/null | head -5)
        if [ -n "$recent_tests" ]; then
            log_success "最近 7 天内有测试运行记录"
        else
            log_warning "最近 7 天内无测试运行记录"
        fi
    fi
    
    # 检查关键脚本是否有对应的测试
    local critical_scripts=("quality-gate.sh" "moss-self-improve.sh" "capability-gap-check.sh")
    for script in "${critical_scripts[@]}"; do
        if [ -f "$SCRIPTS_DIR/$script" ]; then
            # 简单检查：脚本中是否包含测试相关注释或函数
            if grep -q "test\|assert\|verify" "$SCRIPTS_DIR/$script" 2>/dev/null; then
                log_success "$script 包含测试逻辑"
            else
                log_warning "$script 可能缺少内建测试"
            fi
        fi
    done
    
    separator
}

# =============================================================================
# 4. 依赖安全检查
# =============================================================================
check_dependencies() {
    log_info "检查依赖安全..."
    separator
    
    # 检查常用命令是否可用
    local required_commands=("bash" "git" "grep" "find" "curl")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
            log_error "缺少必需命令：$cmd"
        fi
    done
    
    if [ ${#missing_commands[@]} -eq 0 ]; then
        log_success "系统依赖完整 (${#required_commands[@]} 个命令)"
    fi
    
    # 检查 git 状态（如果有未提交的更改）
    if [ -d "$WORKSPACE_ROOT/.git" ]; then
        cd "$WORKSPACE_ROOT"
        local uncommitted=$(git status --porcelain 2>/dev/null | wc -l)
        if [ "$uncommitted" -gt 0 ]; then
            log_warning "有 $uncommitted 个未提交的更改"
        else
            log_success "Git 工作区干净"
        fi
        
        # 检查是否有敏感文件被跟踪
        local sensitive_files=$(git ls-files | grep -E "(\.env|secret|credential|password)" 2>/dev/null | head -3 || true)
        if [ -n "$sensitive_files" ]; then
            log_warning "Git 跟踪了可能的敏感文件：$sensitive_files"
        else
            log_success "未发现敏感文件被 Git 跟踪"
        fi
    else
        log_warning "当前目录不是 Git 仓库"
    fi
    
    # 检查 cron 任务配置
    if [ -f "$SCRIPTS_DIR/cron-setup.sh" ]; then
        log_success "Cron 配置脚本存在"
    else
        log_warning "缺少 Cron 配置脚本"
    fi
    
    separator
}

# =============================================================================
# 5. 快速检查模式（仅关键项）
# =============================================================================
quick_check() {
    log_info "执行快速检查（仅关键项）..."
    separator
    
    # 只检查最关键的项
    check_code_quality
    check_documentation
    
    # 跳过耗时的检查
    log_info "跳过测试覆盖和依赖检查（快速模式）"
}

# =============================================================================
# 主函数
# =============================================================================
main() {
    local mode="${1:-strict}"
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           MOSS Quality Gate - 质量门禁系统                    ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "工作空间：$WORKSPACE_ROOT"
    log_info "检查模式：$mode"
    log_info "检查时间：$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    if [ "$mode" = "quick" ]; then
        quick_check
    else
        check_code_quality
        check_documentation
        check_test_coverage
        check_dependencies
    fi
    
    # 汇总报告
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    质量检查报告                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "  ${GREEN}通过${NC}: $CHECKS_PASSED"
    echo -e "  ${YELLOW}警告${NC}: $CHECKS_WARNING"
    echo -e "  ${RED}失败${NC}: $CHECKS_FAILED"
    echo ""
    
    local total=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    if [ $total -gt 0 ]; then
        local pass_rate=$((CHECKS_PASSED * 100 / total))
        echo "  通过率：${pass_rate}%"
    fi
    echo ""
    
    # 退出码
    if [ $CHECKS_FAILED -gt 0 ]; then
        log_error "质量门禁未通过！请修复上述问题。"
        exit 1
    elif [ $CHECKS_WARNING -gt 0 ]; then
        log_warning "质量门禁通过（有警告项）"
        exit 0
    else
        log_success "质量门禁通过！零缺陷交付 ✓"
        exit 0
    fi
}

# 执行
main "$@"
