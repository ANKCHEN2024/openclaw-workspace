#!/bin/bash
# skill-verify.sh - 技能可用性验证
# 测试每个技能是否能在 OpenClaw 中正常工作

set -e

WORKSPACE="/Users/chenggl/workspace"
SKILLS_DIR="$WORKSPACE/skills"
LOGS_DIR="$WORKSPACE/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo "================================"
echo "🧪 技能可用性验证"
echo "================================"
echo ""

# 验证函数
verify_skill() {
    local skill_name="$1"
    local skill_path="$SKILLS_DIR/$skill_name"
    
    echo ""
    log_step "验证技能：$skill_name"
    echo "--------------------------------"
    
    # 1. 检查目录结构
    if [ ! -d "$skill_path" ]; then
        log_error "❌ 技能目录不存在"
        return 1
    fi
    
    # 2. 检查 SKILL.md
    if [ ! -f "$skill_path/SKILL.md" ]; then
        log_error "❌ SKILL.md 不存在"
        return 1
    fi
    
    # 3. 检查必要字段
    local name desc
    name=$(grep "^name:" "$skill_path/SKILL.md" | cut -d: -f2 | tr -d ' ')
    desc=$(grep "^description:" "$skill_path/SKILL.md" | cut -d: -f2-)
    
    if [ -z "$name" ]; then
        log_error "❌ 缺少 name 字段"
        return 1
    fi
    
    if [ -z "$desc" ]; then
        log_error "❌ 缺少 description 字段"
        return 1
    fi
    
    # 4. 检查名称匹配
    if [ "$name" != "$skill_name" ]; then
        log_error "❌ 名称不匹配：$name ≠ $skill_name"
        return 1
    fi
    
    # 5. 检查描述质量（不能太短）
    if [ ${#desc} -lt 20 ]; then
        log_warn "⚠️  描述太短（${#desc} 字符）"
    fi
    
    # 6. 检查是否有触发器（trigger 或 description 中包含使用场景）
    if ! grep -qi "use when\|trigger\|activate" "$skill_path/SKILL.md" 2>/dev/null; then
        log_warn "⚠️  未找到明确的触发条件"
    fi
    
    # 7. 检查依赖（如果有）
    if grep -q "requires.*bins" "$skill_path/SKILL.md" 2>/dev/null; then
        local bins
        bins=$(grep "requires.*bins" "$skill_path/SKILL.md" | grep -o '"[^"]*"' | tr -d '"')
        for bin in $bins; do
            if command -v "$bin" &> /dev/null; then
                log_info "  ✓ 依赖已满足：$bin"
            else
                log_warn "  ⚠️  依赖缺失：$bin"
            fi
        done
    fi
    
    # 8. 检查是否有示例代码或说明
    if grep -qi "example\|usage" "$skill_path/SKILL.md" 2>/dev/null; then
        log_info "  ✓ 包含使用示例"
    fi
    
    log_info "✅ 技能验证通过：$skill_name"
    return 0
}

# 测试技能功能
test_skill_function() {
    local skill_name="$1"
    
    echo ""
    log_step "功能测试：$skill_name"
    echo "--------------------------------"
    
    case "$skill_name" in
        "weather")
            # 测试 weather 技能的核心功能（wttr.in API）
            if curl -s "wttr.in/?format=%C+%t" 2>/dev/null | grep -q "."; then
                log_info "✅ weather 功能测试通过（wttr.in 可访问）"
                return 0
            else
                log_warn "⚠️  weather 功能测试失败（wttr.in 不可访问）"
                return 1
            fi
            ;;
        "video-frames")
            # 检查 ffmpeg 是否可用
            if command -v ffmpeg &> /dev/null; then
                log_info "✅ video-frames 依赖满足（ffmpeg 已安装）"
                return 0
            else
                log_warn "⚠️  video-frames 依赖缺失（ffmpeg 未安装）"
                return 1
            fi
            ;;
        "healthcheck")
            # 检查是否有必要的系统命令
            if command -v ssh-keygen &> /dev/null && command -v sudo &> /dev/null; then
                log_info "✅ healthcheck 依赖满足"
                return 0
            else
                log_warn "⚠️  healthcheck 部分依赖缺失"
                return 1
            fi
            ;;
        "skill-creator")
            # 检查是否有 git 和必要工具
            if command -v git &> /dev/null; then
                log_info "✅ skill-creator 依赖满足（git 已安装）"
                return 0
            else
                log_warn "⚠️  skill-creator 依赖缺失（git 未安装）"
                return 1
            fi
            ;;
        *)
            log_info "ℹ️  无特定功能测试：$skill_name"
            return 0
            ;;
    esac
}

# 主流程
echo "开始验证所有技能..."
echo ""

TOTAL=0
PASSED=0
FAILED=0
FUNCTION_PASSED=0

for skill_dir in "$SKILLS_DIR"/*/; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        TOTAL=$((TOTAL + 1))
        
        # 跳过非技能目录
        if [ "$skill_name" = "skills-config.json" ] || [ "$skill_name" = ".clawhub" ]; then
            continue
        fi
        
        # 验证技能
        if verify_skill "$skill_name"; then
            PASSED=$((PASSED + 1))
            
            # 功能测试
            if test_skill_function "$skill_name"; then
                FUNCTION_PASSED=$((FUNCTION_PASSED + 1))
            fi
        else
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo "================================"
echo "📊 验证结果"
echo "================================"
echo "技能总数：$TOTAL"
echo "验证通过：$PASSED"
echo "验证失败：$FAILED"
echo "功能测试通过：$FUNCTION_PASSED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有技能验证通过！${NC}"
else
    echo -e "${RED}❌ 有 $FAILED 个技能验证失败${NC}"
fi

echo ""
echo "================================"
echo "✅ 验证完成 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"

# 记录日志
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 技能验证 - 总数:$TOTAL 通过:$PASSED 失败:$FAILED 功能测试:$FUNCTION_PASSED" >> "$LOGS_DIR/skill-verify.log"
