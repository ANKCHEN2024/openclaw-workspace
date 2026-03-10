#!/bin/bash

# 飞书 Bot 连接测试脚本
# 用法：./test-feishu-bots.sh
#
# 功能：
# 1. 验证所有 Bot 的 1Password 凭证
# 2. 测试飞书 API 连接
# 3. 生成测试报告

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 1Password 保险库名称
VAULT="Personal"

# Bot 列表
declare -a BOTS=(
    "MOSS-CEO:Feishu MOSS-CEO"
    "MOSS-PM:Feishu MOSS-PM"
    "MOSS-Finance:Feishu MOSS-Finance"
    "MOSS-HR:Feishu MOSS-HR"
    "MOSS-Tech:Feishu MOSS-Tech"
)

# 统计
passed=0
failed=0
warnings=0

# 打印横幅
print_banner() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}           飞书 Bot 连接测试                 ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo -e "测试时间：$(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "保险库：${VAULT}"
    echo ""
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}[1/3] 检查依赖...${NC}"
    
    if ! command -v op &> /dev/null; then
        echo -e "${RED}✗ 1Password CLI 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ 1Password CLI 已安装${NC}"
    
    if ! op account get &> /dev/null 2>&1; then
        echo -e "${YELLOW}  ! 未登录 1Password，正在登录...${NC}"
        op signin
    fi
    echo -e "${GREEN}  ✓ 1Password 已登录${NC}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "${YELLOW}  ! curl 未安装，跳过 API 测试${NC}"
        SKIP_API=true
    else
        echo -e "${GREEN}  ✓ curl 已安装${NC}"
        SKIP_API=false
    fi
    
    echo ""
}

# 测试凭证读取
test_credentials() {
    local bot_key=$1
    local credential_name=$2
    
    echo -e "${YELLOW}[2/3] 测试凭证：${bot_key}${NC}"
    
    # 测试 app_id
    if app_id=$(op read "op://${VAULT}/${credential_name}/app_id" 2>/dev/null); then
        echo -e "${GREEN}  ✓ app_id 读取成功${NC}"
    else
        echo -e "${RED}  ✗ app_id 读取失败${NC}"
        ((failed++))
        return 1
    fi
    
    # 测试 app_secret
    if app_secret=$(op read "op://${VAULT}/${credential_name}/password" 2>/dev/null); then
        echo -e "${GREEN}  ✓ app_secret 读取成功${NC}"
    else
        echo -e "${RED}  ✗ app_secret 读取失败${NC}"
        ((failed++))
        return 1
    fi
    
    # 测试 verify_token（可选）
    if verify_token=$(op read "op://${VAULT}/${credential_name}/verify_token" 2>/dev/null); then
        if [ -n "$verify_token" ]; then
            echo -e "${GREEN}  ✓ verify_token 读取成功${NC}"
        else
            echo -e "${YELLOW}  ! verify_token 为空${NC}"
            ((warnings++))
        fi
    else
        echo -e "${YELLOW}  ! verify_token 字段不存在${NC}"
        ((warnings++))
    fi
    
    # 测试 encrypt_key（可选）
    if encrypt_key=$(op read "op://${VAULT}/${credential_name}/encrypt_key" 2>/dev/null); then
        if [ -n "$encrypt_key" ]; then
            echo -e "${GREEN}  ✓ encrypt_key 读取成功${NC}"
        else
            echo -e "${YELLOW}  ! encrypt_key 为空${NC}"
            ((warnings++))
        fi
    else
        echo -e "${YELLOW}  ! encrypt_key 字段不存在${NC}"
        ((warnings++))
    fi
    
    ((passed++))
    echo ""
    return 0
}

# 测试飞书 API 连接
test_feishu_api() {
    local bot_key=$1
    local credential_name=$2
    
    if [ "$SKIP_API" = true ]; then
        echo -e "${YELLOW}  ! 跳过 API 测试（curl 未安装）${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}  测试飞书 API 连接...${NC}"
    
    # 获取凭证
    local app_id=$(op read "op://${VAULT}/${credential_name}/app_id" 2>/dev/null)
    local app_secret=$(op read "op://${VAULT}/${credential_name}/password" 2>/dev/null)
    
    if [ -z "$app_id" ] || [ -z "$app_secret" ]; then
        echo -e "${RED}  ✗ 凭证不完整，跳过 API 测试${NC}"
        return 1
    fi
    
    # 调用飞书 API 获取 tenant_access_token
    local response=$(curl -s -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
        -H "Content-Type: application/json" \
        -d "{\"app_id\":\"${app_id}\",\"app_secret\":\"${app_secret}\"}")
    
    # 解析响应
    local code=$(echo "$response" | grep -o '"code":[0-9]*' | cut -d':' -f2)
    
    if [ "$code" = "0" ]; then
        echo -e "${GREEN}  ✓ API 连接成功${NC}"
        return 0
    else
        local msg=$(echo "$response" | grep -o '"msg":"[^"]*"' | cut -d'"' -f4)
        echo -e "${RED}  ✗ API 连接失败：${msg}${NC}"
        echo -e "     响应：${response}"
        ((failed++))
        return 1
    fi
}

# 检查 OpenClaw 配置
check_openclaw_config() {
    echo -e "${YELLOW}[3/3] 检查 OpenClaw 配置...${NC}"
    
    local config_file="${HOME}/.openclaw/feishu-bots-config.yaml"
    
    if [ -f "$config_file" ]; then
        echo -e "${GREEN}  ✓ 配置文件存在：${config_file}${NC}"
        
        # 检查是否包含所有 Bot 配置
        local bot_count=$(grep -c "feishu-moss-" "$config_file" 2>/dev/null || echo "0")
        if [ "$bot_count" -ge 5 ]; then
            echo -e "${GREEN}  ✓ 配置包含 ${bot_count} 个 Bot${NC}"
        else
            echo -e "${YELLOW}  ! 配置仅包含 ${bot_count} 个 Bot（期望 5 个）${NC}"
            ((warnings++))
        fi
        
        # 检查是否使用 1Password 集成
        if grep -q "op read" "$config_file"; then
            echo -e "${GREEN}  ✓ 已配置 1Password 集成${NC}"
        else
            echo -e "${RED}  ✗ 未检测到 1Password 集成${NC}"
            ((failed++))
        fi
    else
        echo -e "${RED}  ✗ 配置文件不存在：${config_file}${NC}"
        echo -e "${YELLOW}  提示：请参考 docs/feishu-app-checklist.md 创建配置${NC}"
        ((failed++))
    fi
    
    echo ""
}

# 打印测试报告
print_report() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}              测试报告                      ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo -e "凭证测试：${GREEN}通过 ${passed}${NC}  ${RED}失败 ${failed}${NC}  ${YELLOW}警告 ${warnings}${NC}"
    echo ""
    
    if [ $failed -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✓ 所有测试通过！${NC}"
        echo ""
        echo "下一步："
        echo "  1. 重启 OpenClaw: openclaw restart"
        echo "  2. 检查 Bot 状态：openclaw status"
        echo "  3. 在测试群验证消息功能"
    elif [ $failed -eq 0 ]; then
        echo -e "${YELLOW}⚠ 测试通过但有警告${NC}"
        echo ""
        echo "警告项："
        echo "  - 部分可选字段未配置（verify_token, encrypt_key）"
        echo "  - 如不需要消息加密可忽略"
        echo ""
        echo "下一步："
        echo "  1. 重启 OpenClaw: openclaw restart"
        echo "  2. 检查 Bot 状态：openclaw status"
    else
        echo -e "${RED}✗ 测试失败，请修复以下问题：${NC}"
        echo ""
        echo "失败项："
        echo "  - 凭证读取失败或 API 连接失败"
        echo ""
        echo "排查步骤："
        echo "  1. 检查 1Password 中凭证是否正确"
        echo "  2. 检查飞书应用是否已发布"
        echo "  3. 检查网络连接"
        echo "  4. 重新运行配置脚本：./scripts/create-feishu-credentials.sh"
    fi
    
    echo ""
    echo -e "测试完成时间：$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# 主函数
main() {
    print_banner
    check_dependencies
    
    # 测试每个 Bot 的凭证
    for bot_entry in "${BOTS[@]}"; do
        bot_key="${bot_entry%%:*}"
        credential_name="${bot_entry##*:}"
        
        if test_credentials "$bot_key" "$credential_name"; then
            test_feishu_api "$bot_key" "$credential_name"
        fi
        
        echo ""
    done
    
    # 检查 OpenClaw 配置
    check_openclaw_config
    
    # 打印报告
    print_report
    
    # 返回状态
    if [ $failed -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# 捕获错误
trap 'echo -e "${RED}脚本执行出错${NC}"; exit 1' ERR

# 运行主函数
main
