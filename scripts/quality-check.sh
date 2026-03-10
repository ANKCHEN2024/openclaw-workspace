#!/bin/bash

# =============================================================================
# 质量检查脚本 - Quality Check Script
# =============================================================================
# 用途：自动化代码和内容质量检查
# 使用：./scripts/quality-check.sh [options]
# 选项：
#   --code          仅检查代码
#   --content       仅检查内容
#   --diff          检查 git diff 中的变更
#   --all           检查全部（默认）
#   --output <dir>  指定输出目录
#   --help          显示帮助信息
# =============================================================================

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${WORKSPACE_DIR}/logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="${OUTPUT_DIR}/quality-report-${TIMESTAMP}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# =============================================================================
# 工具函数
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

# =============================================================================
# 代码质量检查
# =============================================================================

check_code_quality() {
    log_info "=== 代码质量检查 ==="
    
    # 1. 检查敏感信息泄露
    log_info "检查敏感信息..."
    if grep -r --include="*.js" --include="*.ts" --include="*.py" --include="*.sh" \
        -E "(password|passwd|pwd|secret|token|api_key|apikey|auth)" \
        "${WORKSPACE_DIR}" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "quality-check.sh" | grep -E "(:\s*['\"][^'\"]+['\"]|=\s*['\"][^'\"]+['\"])" | head -5; then
        log_warning "发现可能的敏感信息（请人工确认）"
    else
        log_success "未发现明显的敏感信息硬编码"
    fi
    
    # 2. 检查 console.log（生产代码中应避免）
    log_info "检查调试代码..."
    CONSOLE_LOG_COUNT=$(grep -r --include="*.js" --include="*.ts" "console\.log" "${WORKSPACE_DIR}" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l)
    if [ "$CONSOLE_LOG_COUNT" -gt 0 ]; then
        log_warning "发现 ${CONSOLE_LOG_COUNT} 处 console.log（生产环境应移除）"
    else
        log_success "未发现 console.log"
    fi
    
    # 3. 检查 TODO/FIXME 注释
    log_info "检查待办事项..."
    TODO_COUNT=$(grep -r --include="*.js" --include="*.ts" --include="*.py" -E "(TODO|FIXME|XXX|HACK)" "${WORKSPACE_DIR}" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l)
    if [ "$TODO_COUNT" -gt 0 ]; then
        log_warning "发现 ${TODO_COUNT} 个待办标记（TODO/FIXME）"
    else
        log_success "未发现待办标记"
    fi
    
    # 4. 检查文件行数（过大文件）
    log_info "检查文件大小..."
    LARGE_FILES=$(find "${WORKSPACE_DIR}" -name "*.js" -o -name "*.ts" -o -name "*.py" | while read file; do
        if [ $(wc -l < "$file") -gt 500 ]; then
            echo "$file ($(wc -l < "$file") 行)"
        fi
    done | head -5)
    
    if [ -n "$LARGE_FILES" ]; then
        log_warning "发现过大文件（>500 行）:\n${LARGE_FILES}"
    else
        log_success "文件大小合理"
    fi
    
    # 5. 检查 lint（如果配置了）
    if [ -f "${WORKSPACE_DIR}/package.json" ]; then
        log_info "检查 lint 配置..."
        if grep -q "\"lint\"" "${WORKSPACE_DIR}/package.json"; then
            log_info "发现 lint 配置，建议运行：npm run lint"
        fi
    fi
}

# =============================================================================
# Git Diff 检查
# =============================================================================

check_git_diff() {
    log_info "=== Git Diff 检查 ==="
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_warning "不在 git 仓库中，跳过 diff 检查"
        return
    fi
    
    # 检查暂存的变更
    CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null)
    if [ -z "$CHANGED_FILES" ]; then
        CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null)
    fi
    
    if [ -z "$CHANGED_FILES" ]; then
        log_info "没有检测到变更"
        return
    fi
    
    log_info "检测到变更文件:"
    echo "$CHANGED_FILES" | while read file; do
        echo "  - $file"
    done
    
    # 检查变更中的敏感信息
    log_info "检查变更中的敏感信息..."
    if git diff --cached 2>/dev/null | grep -E "^\+.*((password|secret|token|api_key)=.*)" | head -3; then
        log_failure "变更中包含可能的敏感信息！"
    else
        log_success "变更中未发现敏感信息"
    fi
    
    # 检查是否包含 .env 文件
    if echo "$CHANGED_FILES" | grep -q "\.env"; then
        log_failure "检测到 .env 文件变更（不应提交）！"
    else
        log_success "未提交 .env 文件"
    fi
    
    # 检查变更统计
    INSERTIONS=$(git diff --cached --numstat 2>/dev/null | awk '{sum+=$1} END {print sum}')
    DELETIONS=$(git diff --cached --numstat 2>/dev/null | awk '{sum+=$2} END {print sum}')
    log_info "变更统计：+${INSERTIONS:-0} -${DELETIONS:-0}"
}

# =============================================================================
# 内容质量检查
# =============================================================================

check_content_quality() {
    log_info "=== 内容质量检查 ==="
    
    # 检查 markdown 文件
    MD_FILES=$(find "${WORKSPACE_DIR}" -name "*.md" -type f | grep -v "node_modules" | grep -v ".git" | head -10)
    
    if [ -z "$MD_FILES" ]; then
        log_info "未发现 markdown 文件"
        return
    fi
    
    for file in $MD_FILES; do
        log_info "检查：$file"
        
        # 检查空文件
        if [ ! -s "$file" ]; then
            log_warning "空文件：$file"
            continue
        fi
        
        # 检查标题层级
        if ! head -1 "$file" | grep -q "^#"; then
            log_warning "缺少主标题：$file"
        fi
        
        # 检查死链接（简单检查）
        if grep -q "http://" "$file"; then
            log_warning "发现非 HTTPS 链接：$file"
        fi
        
        # 检查 TODO 标记
        if grep -q "TODO\|FIXME" "$file"; then
            log_warning "包含待办标记：$file"
        fi
    done
    
    log_success "内容检查完成"
}

# =============================================================================
# 文档完整性检查
# =============================================================================

check_documentation() {
    log_info "=== 文档完整性检查 ==="
    
    # 检查关键文档是否存在
    DOCS=("README.md" "AGENTS.md" "CONTRIBUTING.md" "CHANGELOG.md")
    
    for doc in "${DOCS[@]}"; do
        if [ -f "${WORKSPACE_DIR}/${doc}" ]; then
            log_success "文档存在：${doc}"
        else
            log_warning "缺少文档：${doc}"
        fi
    done
    
    # 检查 README 质量
    if [ -f "${WORKSPACE_DIR}/README.md" ]; then
        if grep -q "安装\|使用\|示例\|Install\|Usage\|Example" "${WORKSPACE_DIR}/README.md"; then
            log_success "README 包含基本说明"
        else
            log_warning "README 可能缺少关键信息"
        fi
    fi
}

# =============================================================================
# 生成报告
# =============================================================================

generate_report() {
    log_info "=== 生成质量报告 ==="
    
    # JSON 报告
    JSON_REPORT="${REPORT_FILE}.json"
    cat > "$JSON_REPORT" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "summary": {
        "total_checks": ${TOTAL_CHECKS},
        "passed": ${PASSED_CHECKS},
        "failed": ${FAILED_CHECKS},
        "warnings": ${WARNINGS}
    },
    "score": $(echo "scale=2; ${PASSED_CHECKS} * 100 / ${TOTAL_CHECKS}" | bc 2>/dev/null || echo "N/A"),
    "status": "$([ ${FAILED_CHECKS} -eq 0 ] && echo "PASS" || echo "FAIL")"
}
EOF
    
    # Markdown 报告
    MD_REPORT="${REPORT_FILE}.md"
    cat > "$MD_REPORT" << EOF
# 质量检查报告

**时间**: $(date +"%Y-%m-%d %H:%M:%S")
**工作空间**: ${WORKSPACE_DIR}

## 📊 摘要

| 指标 | 数值 |
|------|------|
| 总检查项 | ${TOTAL_CHECKS} |
| 通过 | ${PASSED_CHECKS} |
| 失败 | ${FAILED_CHECKS} |
| 警告 | ${WARNINGS} |
| 通过率 | $(echo "scale=1; ${PASSED_CHECKS} * 100 / ${TOTAL_CHECKS}" | bc 2>/dev/null || echo "N/A")% |

## ✅ 状态

$([ ${FAILED_CHECKS} -eq 0 ] && echo "**✅ 质量检查通过**" || echo "**❌ 质量检查未通过**")

## 📋 详细结果

详见上方输出。

## 🔧 建议改进

$(if [ ${WARNINGS} -gt 0 ]; then echo "- 处理 ${WARNINGS} 个警告项"; else echo "- 无警告，保持良好实践"; fi)
$(if [ ${FAILED_CHECKS} -gt 0 ]; then echo "- 修复 ${FAILED_CHECKS} 个失败项"; else echo ""; fi)

---
*报告由 quality-check.sh 自动生成*
EOF
    
    log_success "JSON 报告：${JSON_REPORT}"
    log_success "Markdown 报告：${MD_REPORT}"
}

# =============================================================================
# 主函数
# =============================================================================

show_help() {
    cat << EOF
质量检查脚本 - Quality Check Script

用法：$0 [选项]

选项:
  --code          仅检查代码质量
  --content       仅检查内容质量
  --diff          检查 git diff 变更
  --all           检查全部（默认）
  --output <dir>  指定输出目录
  --help          显示此帮助信息

示例:
  $0                    # 执行全部检查
  $0 --code             # 仅检查代码
  $0 --diff             # 检查 git 变更
  $0 --output ./reports # 指定输出目录

EOF
}

main() {
    local mode="all"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --code)
                mode="code"
                shift
                ;;
            --content)
                mode="content"
                shift
                ;;
            --diff)
                mode="diff"
                shift
                ;;
            --all)
                mode="all"
                shift
                ;;
            --output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "未知选项：$1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 创建输出目录
    mkdir -p "$OUTPUT_DIR"
    
    echo "========================================"
    echo "  质量检查 - Quality Check"
    echo "  时间：$(date +"%Y-%m-%d %H:%M:%S")"
    echo "========================================"
    echo ""
    
    case $mode in
        code)
            check_code_quality
            ;;
        content)
            check_content_quality
            ;;
        diff)
            check_git_diff
            ;;
        all)
            check_code_quality
            echo ""
            check_git_diff
            echo ""
            check_content_quality
            echo ""
            check_documentation
            ;;
    esac
    
    echo ""
    generate_report
    
    echo ""
    echo "========================================"
    echo "  检查完成"
    echo "  总检查：${TOTAL_CHECKS}"
    echo "  通过：${GREEN}${PASSED_CHECKS}${NC}"
    echo "  失败：${RED}${FAILED_CHECKS}${NC}"
    echo "  警告：${YELLOW}${WARNINGS}${NC}"
    echo "========================================"
    
    # 返回状态码
    if [ ${FAILED_CHECKS} -gt 0 ]; then
        exit 1
    fi
    exit 0
}

# 执行主函数
main "$@"
