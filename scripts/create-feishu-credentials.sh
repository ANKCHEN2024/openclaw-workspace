#!/bin/bash

# 飞书 Bot 凭证批量创建脚本
# 用法：./create-feishu-credentials.sh
# 
# 功能：
# 1. 交互式为 5 个 Bot 创建 1Password 凭证
# 2. 自动验证凭证可用性
# 3. 生成配置备份

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1Password 保险库名称（可根据实际情况修改）
VAULT="Personal"

# Bot 配置数组
declare -a BOTS=(
    "MOSS-CEO:MOSS-CEO 助理:磊哥的 AI 总助理，负责决策支持、项目协调与资源分配"
    "MOSS-PM:MOSS-项目经理:项目交付助手，负责进度跟踪、任务分配与汇报生成"
    "MOSS-Finance:MOSS-财务助手:财务数据助手，负责预算跟踪、费用提醒与报表生成"
    "MOSS-HR:MOSS-人事助手:人力资源助手，负责考勤、招聘、培训与员工服务"
    "MOSS-Tech:MOSS-技术顾问:技术支持顾问，负责代码审查、技术咨询与部署支持"
)

# 统计
passed=0
failed=0
skipped=0

# 打印横幅
print_banner() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}       飞书 Bot 1Password 凭证创建脚本       ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo -e "${BLUE}此脚本将帮助你为 5 个飞书 Bot 创建 1Password 凭证${NC}"
    echo -e "${BLUE}请确保：${NC}"
    echo -e "  1. 已安装 1Password CLI"
    echo -e "  2. 已登录 1Password 账户"
    echo -e "  3. 已在飞书开放平台创建应用"
    echo ""
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    # 检查 1Password CLI
    if ! command -v op &> /dev/null; then
        echo -e "${RED}✗ 1Password CLI 未安装${NC}"
        echo ""
        echo "请先安装 1Password CLI："
        echo "  macOS:  brew install --cask 1password-cli"
        echo "  其他：  https://developer.1password.com/docs/cli/"
        exit 1
    fi
    echo -e "${GREEN}✓ 1Password CLI 已安装 ($(op --version))${NC}"
    
    # 检查是否已登录
    if ! op account get &> /dev/null 2>&1; then
        echo -e "${YELLOW}! 未登录 1Password，正在引导登录...${NC}"
        op signin
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ 登录失败${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✓ 1Password 已登录${NC}"
    
    # 检查保险库是否存在
    if ! op vault get "${VAULT}" &> /dev/null 2>&1; then
        echo -e "${YELLOW}! 保险库 '${VAULT}' 不存在，使用默认保险库${NC}"
        VAULT=$(op vault list | grep -m 1 "Private" | awk '{print $2}')
        if [ -z "$VAULT" ]; then
            VAULT="Private"
        fi
        echo -e "${BLUE}使用保险库：${VAULT}${NC}"
    else
        echo -e "${GREEN}✓ 保险库 '${VAULT}' 可用${NC}"
    fi
    
    echo ""
}

# 获取飞书凭证信息
get_feishu_credentials() {
    local bot_name=$1
    local bot_desc=$2
    
    echo ""
    echo -e "${CYAN}----------------------------------------${NC}"
    echo -e "${CYAN}正在配置：${bot_name}${NC}"
    echo -e "${CYAN}描述：${bot_desc}${NC}"
    echo -e "${CYAN}----------------------------------------${NC}"
    echo ""
    
    echo -e "${BLUE}请从飞书开放平台获取凭证信息：${NC}"
    echo "  1. 访问 https://open.feishu.cn/app"
    echo "  2. 找到应用「${bot_name}」"
    echo "  3. 进入「基本信息」获取 App ID"
    echo "  4. 进入「凭证管理」获取其他凭证"
    echo ""
    
    # 读取用户输入
    read -p "App ID: " app_id
    if [ -z "$app_id" ]; then
        echo -e "${YELLOW}! App ID 为空，跳过此 Bot${NC}"
        ((skipped++))
        return 1
    fi
    
    read -sp "App Secret: " app_secret
    echo ""
    if [ -z "$app_secret" ]; then
        echo -e "${RED}✗ App Secret 不能为空${NC}"
        ((failed++))
        return 1
    fi
    
    read -sp "Verify Token: " verify_token
    echo ""
    if [ -z "$verify_token" ]; then
        echo -e "${YELLOW}! Verify Token 为空，将使用空值${NC}"
    fi
    
    read -sp "Encrypt Key: " encrypt_key
    echo ""
    if [ -z "$encrypt_key" ]; then
        echo -e "${YELLOW}! Encrypt Key 为空，将使用空值${NC}"
    fi
    
    echo ""
    
    # 返回凭证（通过全局变量）
    CRED_APP_ID="$app_id"
    CRED_APP_SECRET="$app_secret"
    CRED_VERIFY_TOKEN="$verify_token"
    CRED_ENCRYPT_KEY="$encrypt_key"
    
    return 0
}

# 创建 1Password 凭证项
create_1password_item() {
    local bot_key=$1
    local bot_name=$2
    
    local item_name="Feishu ${bot_key}"
    
    echo -e "${YELLOW}正在创建 1Password 凭证项：${item_name}${NC}"
    
    # 检查是否已存在
    if op item get "${item_name}" --vault "${VAULT}" &> /dev/null 2>&1; then
        echo -e "${YELLOW}! 凭证项已存在，将更新${NC}"
        
        # 更新现有项
        op item edit "${item_name}" \
            --vault "${VAULT}" \
            username="${CRED_APP_ID}" \
            password="${CRED_APP_SECRET}" \
            --field "app_id=${CRED_APP_ID}" \
            --field "verify_token=${CRED_VERIFY_TOKEN}" \
            --field "encrypt_key=${CRED_ENCRYPT_KEY}" \
            --field "website=https://open.feishu.cn" \
            &> /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 凭证已更新${NC}"
            ((passed++))
            return 0
        else
            echo -e "${RED}✗ 凭证更新失败${NC}"
            ((failed++))
            return 1
        fi
    else
        # 创建新项
        op item create \
            --vault "${VAULT}" \
            --title "${item_name}" \
            --category password \
            username="${CRED_APP_ID}" \
            password="${CRED_APP_SECRET}" \
            --field "app_id=${CRED_APP_ID}" \
            --field "verify_token=${CRED_VERIFY_TOKEN}" \
            --field "encrypt_key=${CRED_ENCRYPT_KEY}" \
            --field "website=https://open.feishu.cn" \
            &> /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 凭证已创建${NC}"
            ((passed++))
            return 0
        else
            echo -e "${RED}✗ 凭证创建失败${NC}"
            ((failed++))
            return 1
        fi
    fi
}

# 验证凭证
verify_credentials() {
    local bot_key=$1
    
    local item_name="Feishu ${bot_key}"
    
    echo -e "${YELLOW}验证凭证...${NC}"
    
    # 读取并验证
    local app_id=$(op read "op://${VAULT}/${item_name}/app_id" 2>/dev/null)
    local app_secret=$(op read "op://${VAULT}/${item_name}/password" 2>/dev/null)
    local verify_token=$(op read "op://${VAULT}/${item_name}/verify_token" 2>/dev/null)
    local encrypt_key=$(op read "op://${VAULT}/${item_name}/encrypt_key" 2>/dev/null)
    
    if [ -n "$app_id" ] && [ -n "$app_secret" ]; then
        echo -e "${GREEN}✓ 凭证验证成功${NC}"
        echo -e "  App ID: ${app_id:0:10}..."
        return 0
    else
        echo -e "${RED}✗ 凭证验证失败${NC}"
        return 1
    fi
}

# 生成配置备份
generate_config_backup() {
    echo ""
    echo -e "${CYAN}----------------------------------------${NC}"
    echo -e "${CYAN}生成配置备份${NC}"
    echo -e "${CYAN}----------------------------------------${NC}"
    
    local backup_dir="${HOME}/.openclaw/backups"
    mkdir -p "${backup_dir}"
    
    local backup_file="${backup_dir}/feishu-bots-config.$(date +%Y%m%d_%H%M%S).yaml"
    
    # 检查原配置文件
    local config_file="${HOME}/.openclaw/feishu-bots-config.yaml"
    if [ -f "$config_file" ]; then
        cp "$config_file" "$backup_file"
        echo -e "${GREEN}✓ 配置已备份：${backup_file}${NC}"
    else
        echo -e "${YELLOW}! 原配置文件不存在，跳过备份${NC}"
    fi
    
    echo ""
}

# 打印摘要
print_summary() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}              配置完成摘要                  ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo -e "保险库：${VAULT}"
    echo ""
    echo -e "创建成功：${GREEN}${passed}${NC}"
    echo -e "创建失败：${RED}${failed}${NC}"
    echo -e "跳过：${YELLOW}${skipped}${NC}"
    echo ""
    
    if [ $failed -gt 0 ] || [ $skipped -gt 0 ]; then
        echo -e "${YELLOW}⚠ 部分 Bot 配置未完成，请检查上述输出${NC}"
        echo ""
        echo "下一步："
        echo "  1. 修复失败的配置"
        echo "  2. 运行验证脚本：./scripts/test-feishu-bots.sh"
        echo "  3. 更新 OpenClaw 配置：~/.openclaw/feishu-bots-config.yaml"
    else
        echo -e "${GREEN}✓ 所有 Bot 凭证创建成功！${NC}"
        echo ""
        echo "下一步："
        echo "  1. 验证凭证：./scripts/test-feishu-bots.sh"
        echo "  2. 更新 OpenClaw 配置：~/.openclaw/feishu-bots-config.yaml"
        echo "  3. 重启 OpenClaw：openclaw restart"
        echo "  4. 检查状态：openclaw status"
    fi
    
    echo ""
    echo -e "${BLUE}凭证存储位置：${NC}"
    for bot_entry in "${BOTS[@]}"; do
        bot_key="${bot_entry%%:*}"
        echo "  - op://${VAULT}/Feishu ${bot_key}/"
    done
    echo ""
}

# 主函数
main() {
    print_banner
    check_dependencies
    
    echo -e "${GREEN}==================================${NC}"
    echo -e "${GREEN}开始配置飞书 Bot 凭证${NC}"
    echo -e "${GREEN}==================================${NC}"
    
    # 遍历每个 Bot
    for bot_entry in "${BOTS[@]}"; do
        bot_key="${bot_entry%%:*}"
        bot_name=$(echo "${bot_entry#*:}" | cut -d':' -f1)
        bot_desc=$(echo "${bot_entry#*:}" | cut -d':' -f2)
        
        # 获取凭证
        if get_feishu_credentials "$bot_name" "$bot_desc"; then
            # 创建凭证项
            if create_1password_item "$bot_key" "$bot_name"; then
                # 验证凭证
                verify_credentials "$bot_key"
            fi
        fi
        
        echo ""
    done
    
    # 生成配置备份
    generate_config_backup
    
    # 打印摘要
    print_summary
}

# 捕获错误
trap 'echo -e "${RED}脚本执行出错${NC}"; exit 1' ERR

# 运行主函数
main
