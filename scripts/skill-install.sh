#!/bin/bash
# skill-install.sh - 多源技能安装系统
# 支持：OpenClaw 官方 GitHub + clawhub
# 包含：安装验证、回退机制、日志记录

set -e

WORKSPACE="/Users/chenggl/workspace"
SKILLS_DIR="$WORKSPACE/skills"
LOGS_DIR="$WORKSPACE/logs"
SKILLS_CONFIG="$WORKSPACE/skills/skills-config.json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 确保目录存在
mkdir -p "$LOGS_DIR" "$SKILLS_DIR"

echo "================================"
echo "🔧 多源技能安装系统"
echo "================================"
echo ""

# ============ 验证函数 ============

validate_skill() {
    local skill_name="$1"
    local skill_path="$SKILLS_DIR/$skill_name"
    
    log_step "验证技能：$skill_name"
    
    # 检查 SKILL.md 是否存在
    if [ ! -f "$skill_path/SKILL.md" ]; then
        log_error "❌ SKILL.md 不存在"
        return 1
    fi
    
    # 检查 SKILL.md 是否包含必要字段
    if ! grep -q "^name:" "$skill_path/SKILL.md" 2>/dev/null; then
        log_error "❌ SKILL.md 缺少 name 字段"
        return 1
    fi
    
    if ! grep -q "^description:" "$skill_path/SKILL.md" 2>/dev/null; then
        log_error "❌ SKILL.md 缺少 description 字段"
        return 1
    fi
    
    # 验证技能名称匹配
    local declared_name
    declared_name=$(grep "^name:" "$skill_path/SKILL.md" | cut -d: -f2 | tr -d ' ')
    if [ "$declared_name" != "$skill_name" ]; then
        log_error "❌ 技能名称不匹配：声明为 '$declared_name'，期望 '$skill_name'"
        return 1
    fi
    
    # 检查是否有有效的 description（不能是无关内容）
    local desc
    desc=$(grep "^description:" "$skill_path/SKILL.md" | cut -d: -f2-)
    if echo "$desc" | grep -qi "vietnam\|vietnamese\|uống\|ngủ\|health tracker" 2>/dev/null; then
        log_error "❌ 技能描述包含无关内容（可能是错误的技能）"
        return 1
    fi
    
    # 检查 description 是否包含 OpenClaw 相关关键词
    if ! echo "$desc" | grep -qi "openclaw\|skill\|security\|weather\|video\|frame" 2>/dev/null; then
        log_warn "⚠️  技能描述可能不正确，但继续安装"
    fi
    
    log_info "✅ 技能验证通过：$skill_name"
    return 0
}

# ============ 安装函数 ============

install_from_github() {
    local skill_name="$1"
    local skill_path="$SKILLS_DIR/$skill_name"
    local github_url="https://raw.githubusercontent.com/openclaw/openclaw/refs/heads/main/skills/$skill_name"
    
    log_step "尝试从 GitHub 安装：$skill_name"
    
    # 创建临时目录
    local temp_dir
    temp_dir=$(mktemp -d)
    
    # 下载 SKILL.md
    if curl -sLf "$github_url/SKILL.md" -o "$temp_dir/SKILL.md" 2>/dev/null; then
        # 验证下载的内容
        if [ -s "$temp_dir/SKILL.md" ] && grep -q "^name:" "$temp_dir/SKILL.md" 2>/dev/null; then
            # 创建技能目录
            rm -rf "$skill_path"
            mkdir -p "$skill_path"
            cp "$temp_dir/SKILL.md" "$skill_path/SKILL.md"
            
            # 下载 _meta.json 如果存在
            if curl -sLf "$github_url/_meta.json" -o "$temp_dir/_meta.json" 2>/dev/null && \
               [ -s "$temp_dir/_meta.json" ]; then
                cp "$temp_dir/_meta.json" "$skill_path/_meta.json"
            fi
            
            # 下载 SKILL.png 如果存在
            if curl -sLf "$github_url/SKILL.png" -o "$skill_path/SKILL.png" 2>/dev/null && \
               [ -s "$skill_path/SKILL.png" ]; then
                log_info "  📥 下载图标：SKILL.png"
            fi
            
            rm -rf "$temp_dir"
            log_info "✅ GitHub 安装成功：$skill_name"
            return 0
        fi
    fi
    
    rm -rf "$temp_dir"
    log_warn "⚠️  GitHub 安装失败：$skill_name"
    return 1
}

install_from_clawhub() {
    local skill_name="$1"
    local skill_path="$SKILLS_DIR/$skill_name"
    
    log_step "尝试从 clawhub 安装：$skill_name"
    
    if command -v clawhub &> /dev/null; then
        if clawhub install "$skill_name" --force 2>&1; then
            log_info "✅ clawhub 安装成功：$skill_name"
            return 0
        fi
    fi
    
    log_warn "⚠️  clawhub 安装失败：$skill_name"
    return 1
}

install_skill() {
    local skill_name="$1"
    local skill_path="$SKILLS_DIR/$skill_name"
    
    echo ""
    log_info "开始安装：$skill_name"
    echo "--------------------------------"
    
    # 检查是否已存在且有效
    if [ -d "$skill_path" ] && validate_skill "$skill_name" 2>/dev/null; then
        log_info "✓ 技能已存在且有效，跳过"
        return 0
    fi
    
    # 多源安装（按优先级）
    # 1. 优先 GitHub（OpenClaw 官方源）
    if install_from_github "$skill_name"; then
        if validate_skill "$skill_name"; then
            return 0
        else
            log_warn "⚠️  GitHub 安装但验证失败，尝试 clawhub"
        fi
    fi
    
    # 2. 回退到 clawhub
    if install_from_clawhub "$skill_name"; then
        if validate_skill "$skill_name"; then
            return 0
        else
            log_error "❌ clawhub 安装但验证失败"
        fi
    fi
    
    log_error "❌ 所有源都失败：$skill_name"
    return 1
}

# ============ 主流程 ============

INSTALLED_COUNT=0
FAILED_COUNT=0

# 读取技能配置
if [ -f "$SKILLS_CONFIG" ]; then
    log_info "读取技能配置：$SKILLS_CONFIG"
    
    # 解析技能列表
    SKILLS=$(cat "$SKILLS_CONFIG" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$SKILLS" ]; then
        log_info "需要安装的技能："
        echo "$SKILLS" | while read -r skill; do
            echo "  - $skill"
        done
        echo ""
        
        # 安装每个技能
        for skill in $SKILLS; do
            if [ -n "$skill" ]; then
                if install_skill "$skill"; then
                    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
                else
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                fi
            fi
        done
        
        echo ""
        echo "================================"
        echo "📊 安装统计"
        echo "================================"
        echo "成功：$INSTALLED_COUNT"
        echo "失败：$FAILED_COUNT"
        echo ""
    else
        log_warn "配置文件中没有技能列表"
    fi
else
    log_warn "技能配置文件不存在：$SKILLS_CONFIG"
fi

# 检查本地技能
if [ -d "$SKILLS_DIR" ]; then
    log_info "本地技能目录：$SKILLS_DIR"
    ls -1 "$SKILLS_DIR" 2>/dev/null | grep -v "^\." | while read -r skill; do
        echo "  - $skill"
    done
fi

echo ""
echo "================================"
echo "✅ 技能安装完成 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"
echo ""

# 记录日志
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 技能安装完成 - 成功:$INSTALLED_COUNT 失败:$FAILED_COUNT" >> "$LOGS_DIR/skill-install.log"

# 自动运行验证
echo ""
log_info "运行技能验证..."
if [ -x "$WORKSPACE/scripts/skill-verify.sh" ]; then
    "$WORKSPACE/scripts/skill-verify.sh" 2>&1 | tail -20
fi
