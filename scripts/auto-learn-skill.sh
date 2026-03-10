#!/bin/bash
# =============================================================================
# auto-learn-skill.sh - 自动学习单个技能
# =============================================================================
# 用途：自动化技能学习流程
# 1. 下载技能
# 2. 阅读 SKILL.md
# 3. 运行测试
# 4. 集成到工作流
# 5. 更新技能清单
#
# 用法：./auto-learn-skill.sh <skill-name> [options]
# 示例：./auto-learn-skill.sh video-frames
#       ./auto-learn-skill.sh github --force
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SKILLS_DIR="/Users/chenggl/workspace/skills"
TRAINING_DIR="/Users/chenggl/workspace/training"
LOG_FILE="${TRAINING_DIR}/skill-install-log.md"
INVENTORY_FILE="${TRAINING_DIR}/capability-inventory.md"

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

# 检查参数
if [ -z "$1" ]; then
    log_error "请提供技能名称"
    echo "用法：$0 <skill-name> [options]"
    echo "示例：$0 video-frames"
    echo "      $0 github --force"
    exit 1
fi

SKILL_NAME="$1"
FORCE_FLAG="${2:-}"

# 创建必要的目录
mkdir -p "$SKILLS_DIR" "$TRAINING_DIR"

# 初始化日志文件
if [ ! -f "$LOG_FILE" ]; then
    cat > "$LOG_FILE" << 'EOF'
# 技能安装日志

_自动记录所有通过 auto-learn-skill.sh 安装的技能_

## 安装记录

EOF
fi

# =============================================================================
# 步骤 1: 下载技能
# =============================================================================
log_info "步骤 1/5: 下载技能 [$SKILL_NAME]"

INSTALL_CMD="clawhub install $SKILL_NAME"
if [ "$FORCE_FLAG" == "--force" ]; then
    INSTALL_CMD="$INSTALL_CMD --force"
    log_warning "使用 --force 强制安装"
fi

if eval "$INSTALL_CMD"; then
    log_success "技能 [$SKILL_NAME] 下载成功"
    
    # 记录到日志
    echo "### $(date '+%Y-%m-%d %H:%M') - $SKILL_NAME" >> "$LOG_FILE"
    echo "- 状态：✅ 安装成功" >> "$LOG_FILE"
    echo "- 路径：$SKILLS_DIR/$SKILL_NAME" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
else
    log_error "技能 [$SKILL_NAME] 下载失败"
    echo "### $(date '+%Y-%m-%d %H:%M') - $SKILL_NAME" >> "$LOG_FILE"
    echo "- 状态：❌ 安装失败" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    exit 1
fi

# =============================================================================
# 步骤 2: 阅读 SKILL.md
# =============================================================================
log_info "步骤 2/5: 阅读 SKILL.md"

SKILL_MD_PATH="$SKILLS_DIR/$SKILL_NAME/SKILL.md"

if [ -f "$SKILL_MD_PATH" ]; then
    log_success "找到 SKILL.md: $SKILL_MD_PATH"
    
    # 提取技能描述
    log_info "技能描述:"
    echo "---"
    head -20 "$SKILL_MD_PATH"
    echo "---"
    
    # 记录技能描述到日志
    echo "### $(date '+%Y-%m-%d %H:%M') - $SKILL_NAME 学习笔记" >> "$LOG_FILE"
    echo "\`\`\`" >> "$LOG_FILE"
    head -20 "$SKILL_MD_PATH" >> "$LOG_FILE"
    echo "\`\`\`" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
else
    log_warning "未找到 SKILL.md，技能可能不包含文档"
fi

# =============================================================================
# 步骤 3: 运行测试
# =============================================================================
log_info "步骤 3/5: 运行测试"

# 检查是否有测试脚本
TEST_SCRIPT="$SKILLS_DIR/$SKILL_NAME/test.sh"
if [ -f "$TEST_SCRIPT" ]; then
    log_info "发现测试脚本，运行测试..."
    if bash "$TEST_SCRIPT"; then
        log_success "测试通过"
    else
        log_warning "测试失败，但技能已安装"
    fi
else
    log_info "未发现测试脚本，跳过测试步骤"
fi

# 检查技能是否可执行
if [ -f "$SKILLS_DIR/$SKILL_NAME/run.sh" ]; then
    log_info "技能包含 run.sh，验证执行权限..."
    chmod +x "$SKILLS_DIR/$SKILL_NAME/run.sh"
    log_success "执行权限已设置"
fi

# =============================================================================
# 步骤 4: 集成到工作流
# =============================================================================
log_info "步骤 4/5: 集成到工作流"

# 检查是否有集成脚本
INTEGRATE_SCRIPT="$SKILLS_DIR/$SKILL_NAME/integrate.sh"
if [ -f "$INTEGRATE_SCRIPT" ]; then
    log_info "发现集成脚本，执行集成..."
    if bash "$INTEGRATE_SCRIPT"; then
        log_success "集成成功"
    else
        log_warning "集成失败，需要手动配置"
    fi
else
    log_info "未发现集成脚本，技能已就绪可直接使用"
fi

# 添加到 PATH（如果需要）
BIN_PATH="$SKILLS_DIR/$SKILL_NAME/bin"
if [ -d "$BIN_PATH" ]; then
    log_info "发现 bin 目录，建议添加到 PATH:"
    echo "export PATH=\"$BIN_PATH:\$PATH\"" >> ~/.zshrc
    log_success "已添加到 ~/.zshrc"
fi

# =============================================================================
# 步骤 5: 更新技能清单
# =============================================================================
log_info "步骤 5/5: 更新技能清单"

# 更新 capability-inventory.md
if [ -f "$INVENTORY_FILE" ]; then
    # 检查技能是否已存在于清单中
    if grep -q "$SKILL_NAME" "$INVENTORY_FILE"; then
        log_info "技能已在清单中，更新状态..."
    else
        log_info "添加新技能到清单..."
        
        # 获取当前日期
        TODAY=$(date '+%Y-%m-%d')
        
        # 添加到已掌握技能部分
        if grep -q "## 已掌握技能" "$INVENTORY_FILE"; then
            sed -i.bak "/## 已掌握技能/a\\
- $SKILL_NAME (熟练度：入门 | 学习时间：$TODAY)" "$INVENTORY_FILE"
            rm -f "${INVENTORY_FILE}.bak"
            log_success "技能已添加到已掌握技能清单"
        else
            log_warning "未在清单中找到'已掌握技能'部分，手动添加"
        fi
    fi
else
    log_warning "技能清单文件不存在，创建新清单..."
    cat > "$INVENTORY_FILE" << EOF
# 能力清单

_最后更新：$(date '+%Y-%m-%d %H:%M')_

## 已掌握技能

- $SKILL_NAME (熟练度：入门 | 学习时间：$(date '+%Y-%m-%d'))

## 学习中技能

## 待学习技能

## 技能统计

- 已掌握：1
- 学习中：0
- 待学习：0

EOF
    log_success "技能清单已创建"
fi

# =============================================================================
# 完成
# =============================================================================
echo ""
log_success "=========================================="
log_success "技能 [$SKILL_NAME] 学习完成！"
log_success "=========================================="
echo ""
echo "📁 技能路径：$SKILLS_DIR/$SKILL_NAME"
echo "📄 文档路径：$SKILL_MD_PATH"
echo "📝 安装日志：$LOG_FILE"
echo "📋 能力清单：$INVENTORY_FILE"
echo ""
log_info "下一步："
echo "1. 阅读完整文档：cat $SKILL_MD_PATH"
echo "2. 查看使用示例：ls $SKILLS_DIR/$SKILL_NAME/examples/"
echo "3. 开始使用技能！"
echo ""
