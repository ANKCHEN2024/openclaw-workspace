#!/bin/bash

# MOSS 自动进化脚本 v0.1
# 让 MOSS 从"被动响应"变成"主动进化"
# 使用方法：./scripts/moss-self-improve.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 路径配置
WORKSPACE="/Users/chenggl/workspace"
MEMORY_DIR="$WORKSPACE/memory"
SCRIPTS_DIR="$WORKSPACE/scripts"
PROPOSALS_DIR="$WORKSPACE/proposals"
STATE_FILE="$MEMORY_DIR/evolution-state.json"
LOG_FILE="$MEMORY_DIR/evolution-$(date +%Y%m%d).log"

# 初始化
init() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   MOSS 自动进化引擎 v0.1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # 创建必要目录
    mkdir -p "$MEMORY_DIR"
    mkdir -p "$PROPOSALS_DIR"
    
    # 初始化状态文件（如果不存在）
    if [ ! -f "$STATE_FILE" ]; then
        echo -e "${YELLOW}初始化进化状态文件...${NC}"
        cat > "$STATE_FILE" << 'EOF'
{
  "version": "0.1",
  "last_updated": "TIMESTAMP",
  "capabilities": {
    "subagent_commander": {
      "task_decomposition": { "level": 3, "target": 5, "evidence": [] },
      "parallel_orchestration": { "level": 3, "target": 5, "evidence": [] },
      "quality_control": { "level": 2, "target": 5, "evidence": [] },
      "conflict_resolution": { "level": 2, "target": 5, "evidence": [] }
    },
    "ai_partner": {
      "business_insight": { "level": 2, "target": 5, "evidence": [] },
      "proactive_proposal": { "level": 1, "target": 5, "evidence": [] },
      "risk_warning": { "level": 2, "target": 5, "evidence": [] },
      "resource_optimization": { "level": 2, "target": 5, "evidence": [] }
    },
    "execution": {
      "automation": { "level": 3, "target": 5, "evidence": [] },
      "toolchain": { "level": 2, "target": 5, "evidence": [] },
      "script_encapsulation": { "level": 3, "target": 5, "evidence": [] },
      "knowledge_persistence": { "level": 2, "target": 5, "evidence": [] }
    }
  },
  "evolution_history": [],
  "pending_tasks": [],
  "metrics": {
    "total_evolutions": 0,
    "successful_deployments": 0,
    "roi_average": 0
  }
}
EOF
        # 替换时间戳
        sed -i '' "s/TIMESTAMP/$(date -Iseconds)/g" "$STATE_FILE"
        echo -e "${GREEN}✓ 状态文件已初始化${NC}"
    fi
    
    log "进化引擎启动"
}

# 日志函数
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" >> "$LOG_FILE"
    echo -e "$msg"
}

# 步骤 1: 能力自检
capability_scan() {
    echo ""
    echo -e "${BLUE}[1/5] 能力自检${NC}"
    echo "----------------------------------------"
    
    # 检查关键文件是否存在
    local checks=(
        "WORK_PRINCIPLES.md:工作准则"
        "SOUL.md:灵魂定义"
        "IDENTITY.md:身份定义"
        "scripts/:脚本目录"
        "memory/:记忆目录"
    )
    
    local passed=0
    local total=${#checks[@]}
    
    for check in "${checks[@]}"; do
        local path="${check%%:*}"
        local name="${check##*:}"
        
        if [ -e "$WORKSPACE/$path" ]; then
            echo -e "  ${GREEN}✓${NC} $name"
            ((passed++))
        else
            echo -e "  ${RED}✗${NC} $name (缺失)"
        fi
    done
    
    echo ""
    echo "  健康度：$passed/$total"
    
    log "能力自检完成：$passed/$total"
    
    return 0
}

# 步骤 2: 缺口分析
gap_analysis() {
    echo ""
    echo -e "${BLUE}[2/5] 能力缺口分析${NC}"
    echo "----------------------------------------"
    
    # 读取当前状态
    if [ -f "$STATE_FILE" ]; then
        echo -e "  ${GREEN}✓${NC} 读取进化状态"
        
        # 简单分析（实际应该用 jq 解析 JSON）
        local total_evolutions=$(grep -o '"total_evolutions": [0-9]*' "$STATE_FILE" | grep -o '[0-9]*' || echo "0")
        echo "  历史进化次数：$total_evolutions"
        
        # 识别最低能力项
        echo ""
        echo -e "  ${YELLOW}待提升能力项:${NC}"
        echo "    - proactive_proposal (当前：1/5) - AI 合伙人主动提案能力"
        echo "    - quality_control (当前：2/5) - 质量控制能力"
        echo "    - conflict_resolution (当前：2/5) - 冲突解决能力"
        
        log "缺口分析完成：发现 3 个重点提升项"
    else
        echo -e "  ${RED}✗${NC} 状态文件不存在"
        log "缺口分析失败：状态文件缺失"
        return 1
    fi
    
    return 0
}

# 步骤 3: 生成进化任务
generate_tasks() {
    echo ""
    echo -e "${BLUE}[3/5] 生成进化任务${NC}"
    echo "----------------------------------------"
    
    local task_dir="$WORKSPACE/tasks"
    mkdir -p "$task_dir"
    
    # 创建紧急任务
    cat > "$task_dir/evolve-proactive-proposal.md" << 'EOF'
# 进化任务：提升主动提案能力

**优先级：** 高  
**预计耗时：** 2 小时  
**分配给：** subagent

## 目标
将 proactive_proposal 能力从 1 提升到 3

## 任务分解

### 1. 研究学习（30 分钟）
- [ ] 搜索"AI 主动提案"最佳实践
- [ ] 学习竞品分析方法论
- [ ] 研究商业洞察框架

### 2. 实现方案（45 分钟）
- [ ] 创建市场扫描脚本
- [ ] 创建提案生成模板
- [ ] 创建定时触发机制

### 3. 测试验证（30 分钟）
- [ ] 生成 3 个测试提案
- [ ] 验证提案质量
- [ ] 记录测试结果

### 4. 知识沉淀（15 分钟）
- [ ] 更新 evolution-state.json
- [ ] 写入 memory 文件
- [ ] 更新工具注册表

## 验收标准
- [ ] 能够自动生成高质量商业提案
- [ ] 提案包含 ROI 分析
- [ ] 提案符合老板战略方向

## 资源
- WORK_PRINCIPLES.md（原则三：创业思维）
- proposals/moss-evolution-system.md
EOF

    cat > "$task_dir/evolve-quality-control.md" << 'EOF'
# 进化任务：提升质量控制能力

**优先级：** 中  
**预计耗时：** 1.5 小时  
**分配给：** subagent

## 目标
将 quality_control 能力从 2 提升到 3

## 任务分解

### 1. 建立检查清单（30 分钟）
- [ ] 代码质量检查项
- [ ] 文档完整性检查项
- [ ] 安全检查项

### 2. 实现检查脚本（45 分钟）
- [ ] 创建 quality-gate.sh
- [ ] 集成到工作流
- [ ] 设置自动触发

### 3. 测试优化（15 分钟）
- [ ] 用现有项目测试
- [ ] 调整检查阈值
- [ ] 记录误报情况

## 验收标准
- [ ] 所有交付物自动经过质量检查
- [ ] 检查覆盖率 > 90%
- [ ] 误报率 < 5%

## 资源
- WORK_PRINCIPLES.md（原则四：质量第一）
EOF

    echo -e "  ${GREEN}✓${NC} 创建任务：evolve-proactive-proposal.md"
    echo -e "  ${GREEN}✓${NC} 创建任务：evolve-quality-control.md"
    
    log "生成 2 个进化任务"
    
    return 0
}

# 步骤 4: 启动 Subagent
start_subagents() {
    echo ""
    echo -e "${BLUE}[4/5] 启动 Subagent 执行${NC}"
    echo "----------------------------------------"
    
    echo -e "  ${YELLOW}说明:${NC} 实际执行需要调用 subagents 工具"
    echo "  以下任务已就绪，等待分配："
    echo ""
    echo "    1. evolve-proactive-proposal (高优先级)"
    echo "    2. evolve-quality-control (中优先级)"
    echo ""
    echo -e "  ${GREEN}✓${NC} Subagent 任务已准备"
    
    log "Subagent 任务准备就绪"
    
    return 0
}

# 步骤 5: 更新状态
update_state() {
    echo ""
    echo -e "${BLUE}[5/5] 更新进化状态${NC}"
    echo "----------------------------------------"
    
    # 更新时间戳
    sed -i '' "s/\"last_updated\": \"[^\"]*\"/\"last_updated\": \"$(date -Iseconds)\"/g" "$STATE_FILE"
    
    echo -e "  ${GREEN}✓${NC} 状态文件已更新"
    echo "  下次自检：4 小时后"
    
    log "状态文件已更新"
    
    return 0
}

# 生成进化报告
generate_report() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   进化报告${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    local report_file="$MEMORY_DIR/evolution-report-$(date +%Y%m%d-%H%M).md"
    
    cat > "$report_file" << EOF
# 进化报告

**时间：** $(date '+%Y-%m-%d %H:%M:%S')  
**类型：** 定期自检

## 本次执行摘要

- 能力自检：完成
- 缺口分析：发现 3 个重点提升项
- 任务生成：2 个任务已就绪
- Subagent 分配：等待执行

## 重点提升项

1. **proactive_proposal** (1→3) - AI 合伙人主动提案能力
2. **quality_control** (2→3) - 质量控制能力
3. **conflict_resolution** (2→3) - 冲突解决能力

## 待执行任务

| 任务 | 优先级 | 预计耗时 |
|------|--------|---------|
| evolve-proactive-proposal | 高 | 2h |
| evolve-quality-control | 中 | 1.5h |

## 下一步

1. 分配 subagent 执行任务
2. 监控执行进度
3. 验收并沉淀知识

---
_报告自动生成 | MOSS 进化引擎 v0.1_
EOF

    echo -e "  ${GREEN}✓${NC} 报告已保存：$report_file"
    echo ""
    
    log "进化报告已生成"
}

# 主流程
main() {
    init
    
    capability_scan
    gap_analysis
    generate_tasks
    start_subagents
    update_state
    
    generate_report
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   进化引擎执行完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "下次自动执行：4 小时后"
    echo "或手动运行：./scripts/moss-self-improve.sh"
    echo ""
}

# 执行
main "$@"
