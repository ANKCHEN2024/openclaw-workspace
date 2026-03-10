#!/bin/bash
# skill-repair.sh - 修复技能问题
# 检查并修复常见的技能配置问题

set -e

WORKSPACE="/Users/chenggl/workspace"
SKILLS_DIR="$WORKSPACE/skills"
OPENCLAW_SKILLS_DIR="/opt/homebrew/lib/node_modules/openclaw/skills"
LOGS_DIR="$WORKSPACE/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

mkdir -p "$LOGS_DIR"

echo "🔧 开始技能健康检查和修复..."
echo ""

FIXED_COUNT=0
ISSUES_FOUND=0

# 检查 1：检查本地技能的 SKILL.md 文件
log_info "检查本地技能的 SKILL.md 文件..."
if [ -d "$SKILLS_DIR" ]; then
    for skill_dir in "$SKILLS_DIR"/*/; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            if [ ! -f "$skill_dir/SKILL.md" ]; then
                log_warn "⚠️  $skill_name 缺少 SKILL.md"
                ((ISSUES_FOUND++))
                
                # 尝试修复：创建基础 SKILL.md
                read -p "  是否创建基础 SKILL.md？(y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    cat > "$skill_dir/SKILL.md" << EOF
# $skill_name Skill

## Description
[Brief description of what this skill does]

## Location
\`$skill_dir\`

## Usage
[How to use this skill]

## Dependencies
[List any dependencies]

## Examples
[Usage examples]
EOF
                    log_info "✅ 已创建 $skill_name/SKILL.md"
                    ((FIXED_COUNT++))
                fi
            else
                echo "  ✅ $skill_name/SKILL.md"
            fi
        fi
    done
fi

# 检查 2：检查技能配置文件
log_info "检查技能配置文件..."
SKILLS_CONFIG="$SKILLS_DIR/skills-config.json"
if [ ! -f "$SKILLS_CONFIG" ]; then
    log_warn "⚠️  技能配置文件不存在"
    ((ISSUES_FOUND++))
    
    read -p "  是否创建默认配置？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > "$SKILLS_CONFIG" << 'EOF'
{
  "skills": [],
  "autoUpdate": true,
  "lastUpdated": null
}
EOF
        log_info "✅ 已创建 skills-config.json"
        ((FIXED_COUNT++))
    fi
else
    echo "  ✅ skills-config.json 存在"
fi

# 检查 3：检查 clawhub CLI
log_info "检查 clawhub CLI..."
if command -v clawhub &> /dev/null; then
    echo "  ✅ clawhub CLI 已安装"
else
    log_warn "⚠️  clawhub CLI 未安装"
    ((ISSUES_FOUND++))
    echo "  安装命令：npm install -g clawhub"
fi

# 检查 4：检查系统技能目录
log_info "检查系统技能目录..."
if [ -d "$OPENCLAW_SKILLS_DIR" ]; then
    SYSTEM_SKILLS=$(ls -1 "$OPENCLAW_SKILLS_DIR" | wc -l | tr -d ' ')
    echo "  ✅ 系统技能数：$SYSTEM_SKILLS"
else
    log_warn "⚠️  系统技能目录不存在"
    ((ISSUES_FOUND++))
fi

# 检查 5：验证 SKILL.md 格式
log_info "验证 SKILL.md 格式..."
if [ -d "$SKILLS_DIR" ]; then
    for skill_dir in "$SKILLS_DIR"/*/; do
        if [ -f "$skill_dir/SKILL.md" ]; then
            skill_name=$(basename "$skill_dir")
            # 检查是否包含必要的字段
            if ! grep -q "Location" "$skill_dir/SKILL.md" 2>/dev/null; then
                log_warn "⚠️  $skill_name/SKILL.md 缺少 Location 字段"
                ((ISSUES_FOUND++))
            else
                echo "  ✅ $skill_name/SKILL.md 格式正确"
            fi
        fi
    done
fi

echo ""
echo "================================"
echo "📊 检查结果"
echo "================================"
echo ""
echo "发现问题：$ISSUES_FOUND"
echo "已修复：$FIXED_COUNT"
echo "待处理：$((ISSUES_FOUND - FIXED_COUNT))"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    log_info "✅ 所有技能健康状态良好！"
else
    log_warn "⚠️  发现 $ISSUES_FOUND 个问题，已修复 $FIXED_COUNT 个"
fi

# 记录日志
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 技能检查：发现 $ISSUES_FOUND 个问题，修复 $FIXED_COUNT 个" >> "$LOGS_DIR/skill-repair.log"

echo ""
echo "日志位置：$LOGS_DIR/skill-repair.log"
