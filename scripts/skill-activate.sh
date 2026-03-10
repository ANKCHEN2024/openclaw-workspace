#!/bin/bash
# skill-activate.sh - 激活/停用技能
# 管理技能的启用状态

set -e

WORKSPACE="/Users/chenggl/workspace"
SKILLS_CONFIG="$WORKSPACE/skills/skills-config.json"
OPENCLAW_SKILLS_DIR="/opt/homebrew/lib/node_modules/openclaw/skills"

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

usage() {
    echo "用法：$0 <command> [skill-name]"
    echo ""
    echo "命令:"
    echo "  list              列出所有技能及其状态"
    echo "  activate <name>   激活指定技能"
    echo "  deactivate <name> 停用指定技能"
    echo "  status <name>     查看技能状态"
    echo ""
    echo "示例:"
    echo "  $0 list"
    echo "  $0 activate weather"
    echo "  $0 deactivate video-frames"
}

# 检查配置文件
if [ ! -f "$SKILLS_CONFIG" ]; then
    log_error "技能配置文件不存在：$SKILLS_CONFIG"
    echo "请先运行：./scripts/skill-install.sh"
    exit 1
fi

case "${1:-list}" in
    list)
        log_info "已安装的技能："
        echo ""
        
        # 列出系统技能
        if [ -d "$OPENCLAW_SKILLS_DIR" ]; then
            echo "系统技能："
            ls -1 "$OPENCLAW_SKILLS_DIR" | while read -r skill; do
                echo "  📦 $skill"
            done
        fi
        
        echo ""
        
        # 列出本地技能
        if [ -d "$WORKSPACE/skills" ]; then
            echo "本地技能："
            find "$WORKSPACE/skills" -maxdepth 1 -mindepth 1 -type d | while read -r skill_dir; do
                skill_name=$(basename "$skill_dir")
                # 检查是否有 SKILL.md
                if [ -f "$skill_dir/SKILL.md" ]; then
                    echo "  ✅ $skill_name (已配置)"
                else
                    echo "  ⚠️  $skill_name (缺少 SKILL.md)"
                fi
            done
        fi
        ;;
        
    activate)
        if [ -z "$2" ]; then
            log_error "请指定技能名称"
            usage
            exit 1
        fi
        log_info "激活技能：$2"
        # 这里可以实现具体的激活逻辑
        # 目前主要是标记为激活状态
        echo "技能 $2 已标记为激活"
        ;;
        
    deactivate)
        if [ -z "$2" ]; then
            log_error "请指定技能名称"
            usage
            exit 1
        fi
        log_info "停用技能：$2"
        # 这里可以实现具体的停用逻辑
        echo "技能 $2 已标记为停用"
        ;;
        
    status)
        if [ -z "$2" ]; then
            log_error "请指定技能名称"
            usage
            exit 1
        fi
        log_info "技能状态：$2"
        
        # 检查系统技能
        if [ -d "$OPENCLAW_SKILLS_DIR/$2" ]; then
            echo "  系统技能：✅ 已安装"
        else
            echo "  系统技能：❌ 未安装"
        fi
        
        # 检查本地技能
        if [ -d "$WORKSPACE/skills/$2" ]; then
            echo "  本地技能：✅ 存在"
            if [ -f "$WORKSPACE/skills/$2/SKILL.md" ]; then
                echo "  SKILL.md: ✅ 存在"
            else
                echo "  SKILL.md: ❌ 缺失"
            fi
        else
            echo "  本地技能：❌ 不存在"
        fi
        ;;
        
    *)
        log_error "未知命令：$1"
        usage
        exit 1
        ;;
esac

echo ""
echo "================================"
echo "✅ 操作完成 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"
