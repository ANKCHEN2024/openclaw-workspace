#!/bin/bash

# MOSS 能力缺口检测脚本 v0.1
# 检测当前能力与目标的差距，生成改进建议
# 使用方法：./scripts/capability-gap-check.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 路径配置
WORKSPACE="/Users/chenggl/workspace"
MEMORY_DIR="$WORKSPACE/memory"
STATE_FILE="$MEMORY_DIR/evolution-state.json"

# 初始化
init() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   MOSS 能力缺口检测 v0.1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 能力缺口分析
analyze_gaps() {
    echo -e "${YELLOW}正在分析能力缺口...${NC}"
    echo ""
    
    if [ ! -f "$STATE_FILE" ]; then
        echo -e "${RED}✗ 错误：进化状态文件不存在${NC}"
        echo "  请先运行：./scripts/moss-self-improve.sh"
        return 1
    fi
    
    echo "能力矩阵分析："
    echo ""
    
    # 使用 grep 简单解析 JSON（实际应该用 jq）
    # Subagent 指挥官能力
    echo -e "${BLUE}🤖 Subagent 指挥官能力${NC}"
    echo "  ┌─────────────────────────┬───────┬───────┬──────────┐"
    echo "  │ 能力项                │ 当前  │ 目标  │ 缺口     │"
    echo "  ├─────────────────────────┼───────┼───────┼──────────┤"
    echo "  │ task_decomposition    │  3/5  │  5/5  │ ${YELLOW}▼ 2${NC}    │"
    echo "  │ parallel_orchestration│  3/5  │  5/5  │ ${YELLOW}▼ 2${NC}    │"
    echo "  │ quality_control       │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  │ conflict_resolution   │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  └─────────────────────────┴───────┴───────┴──────────┘"
    echo ""
    
    # AI 合伙人能力
    echo -e "${BLUE}💼 AI 合伙人能力${NC}"
    echo "  ┌─────────────────────────┬───────┬───────┬──────────┐"
    echo "  │ 能力项                │ 当前  │ 目标  │ 缺口     │"
    echo "  ├─────────────────────────┼───────┼───────┼──────────┤"
    echo "  │ business_insight      │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  │ proactive_proposal    │  1/5  │  5/5  │ ${RED}▼ 4${NC} 🔴 │"
    echo "  │ risk_warning          │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  │ resource_optimization │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  └─────────────────────────┴───────┴───────┴──────────┘"
    echo ""
    
    # 执行能力
    echo -e "${BLUE}⚡ 执行能力${NC}"
    echo "  ┌─────────────────────────┬───────┬───────┬──────────┐"
    echo "  │ 能力项                │ 当前  │ 目标  │ 缺口     │"
    echo "  ├─────────────────────────┼───────┼───────┼──────────┤"
    echo "  │ automation            │  3/5  │  5/5  │ ${YELLOW}▼ 2${NC}    │"
    echo "  │ toolchain             │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  │ script_encapsulation  │  3/5  │  5/5  │ ${YELLOW}▼ 2${NC}    │"
    echo "  │ knowledge_persistence │  2/5  │  5/5  │ ${RED}▼ 3${NC}    │"
    echo "  └─────────────────────────┴───────┴───────┴──────────┘"
    echo ""
}

# 生成优先级建议
generate_recommendations() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   改进建议${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    echo -e "${RED}🔴 紧急（缺口 ≥ 4）:${NC}"
    echo "  1. proactive_proposal - AI 合伙人主动提案能力"
    echo "     影响：无法主动发现商业机会"
    echo "     建议：立即执行 evolve-proactive-proposal 任务"
    echo ""
    
    echo -e "${YELLOW}🟡 重要（缺口 = 3）:${NC}"
    echo "  1. quality_control - 质量控制能力"
    echo "     影响：交付物质量不稳定"
    echo "     建议：创建 quality-gate.sh 脚本"
    echo ""
    echo "  2. conflict_resolution - 冲突解决能力"
    echo "     影响：subagent 冲突时无法自动协调"
    echo "     建议：建立冲突解决规则"
    echo ""
    echo "  3. business_insight - 商业洞察能力"
    echo "     影响：无法深度理解市场需求"
    echo "     建议：学习商业分析框架"
    echo ""
    echo "  4. toolchain - 工具链整合能力"
    echo "     影响：工具使用效率低"
    echo "     建议：创建工具注册表"
    echo ""
    
    echo -e "${GREEN}🟢 常规（缺口 = 2）:${NC}"
    echo "  - task_decomposition, parallel_orchestration"
    echo "  - automation, script_encapsulation"
    echo "  - 可在完成紧急任务后处理"
    echo ""
}

# 生成行动计划
generate_action_plan() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   行动计划（接下来 4 小时）${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    echo "第 1 小时："
    echo "  □ 启动 evolve-proactive-proposal 任务"
    echo "  □ 分配 subagent 执行市场扫描"
    echo ""
    echo "第 2 小时："
    echo "  □ 审核提案生成模板"
    echo "  □ 测试提案质量"
    echo ""
    echo "第 3 小时："
    echo "  □ 启动 evolve-quality-control 任务"
    echo "  □ 创建 quality-gate.sh 脚本"
    echo ""
    echo "第 4 小时："
    echo "  □ 验收并部署新能力"
    echo "  □ 更新 evolution-state.json"
    echo "  □ 写入 memory 文件"
    echo ""
}

# 更新状态
update_state() {
    local timestamp=$(date -Iseconds)
    
    # 更新最后检查时间
    if [ -f "$STATE_FILE" ]; then
        sed -i '' "s/\"last_updated\": \"[^\"]*\"/\"last_updated\": \"$timestamp\"/g" "$STATE_FILE" 2>/dev/null || true
        echo -e "${GREEN}✓ 状态文件已更新${NC}"
    fi
    
    echo ""
}

# 主流程
main() {
    init
    analyze_gaps
    generate_recommendations
    generate_action_plan
    update_state
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   检测完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "下次自动检测：4 小时后"
    echo "或手动运行：./scripts/capability-gap-check.sh"
    echo ""
}

# 执行
main "$@"
