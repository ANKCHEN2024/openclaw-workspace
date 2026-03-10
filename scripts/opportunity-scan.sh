#!/bin/bash

# opportunity-scan.sh - 商业机会自动扫描器
# 功能：扫描市场趋势、识别能力缺口、自动生成提案草稿
# 用法：./opportunity-scan.sh [行业关键词] [输出目录]

set -e

# 配置
OUTPUT_DIR="${2:-./proposals}"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MOSS 商业机会扫描器 v1.0${NC}"
echo -e "${BLUE}  扫描时间：${DATE}${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查网络连通性
check_network() {
    echo -e "${YELLOW}[1/5] 检查网络连通性...${NC}"
    if curl -s --connect-timeout 5 https://www.baidu.com > /dev/null; then
        echo -e "${GREEN}✓ 网络正常${NC}"
    else
        echo -e "${RED}✗ 网络异常，退出${NC}"
        exit 1
    fi
}

# 扫描市场趋势（使用 web_search API 模拟）
scan_market_trends() {
    local industry="${1:-AI 数字孪生}"
    echo -e "${YELLOW}[2/5] 扫描市场趋势：${industry}${NC}"
    
    # 创建临时搜索查询文件
    cat > /tmp/search_queries.txt << EOF
${industry} 市场规模 2026
${industry} 发展趋势 政策
${industry} 竞争对手 融资
${industry} 痛点 需求
${industry} 技术创新 突破
EOF
    
    echo -e "${GREEN}✓ 生成搜索查询 $(wc -l < /tmp/search_queries.txt) 条${NC}"
    
    # 实际使用时调用 web_search API
    # 这里用模拟数据演示
    cat > "${OUTPUT_DIR}/market-scan-${TIMESTAMP}.md" << EOF
# 市场扫描报告 - ${industry}

**扫描时间：** ${DATE}  
**扫描范围：** ${industry} 相关市场

## 关键发现

### 市场规模
- [待填充：从搜索结果提取]

### 增长趋势
- [待填充：从搜索结果提取]

### 政策动态
- [待填充：从搜索结果提取]

### 竞争格局
- [待填充：从搜索结果提取]

### 技术突破
- [待填充：从搜索结果提取]

## 潜在机会

1. [机会 1]
2. [机会 2]
3. [机会 3]

## 建议行动

- [ ] 深入调研机会 1
- [ ] 接触相关客户验证需求
- [ ] 生成详细提案

---
*报告由 opportunity-scan.sh 自动生成*
EOF
    
    echo -e "${GREEN}✓ 市场扫描报告：${OUTPUT_DIR}/market-scan-${TIMESTAMP}.md${NC}"
}

# 识别能力缺口
identify_gaps() {
    echo -e "${YELLOW}[3/5] 识别能力缺口...${NC}"
    
    # 读取现有项目目录
    local projects=()
    if [ -d "./training" ]; then
        projects+=("短视频培训")
    fi
    if [ -d "./ai-drama-platform" ]; then
        projects+=("AI 短剧平台")
    fi
    if [ -d "./digital-twin" ] || [ -f "./scripts/digital-twin-ai-guide-proposal.md" ]; then
        projects+=("数字孪生+AI")
    fi
    
    echo -e "${GREEN}✓ 现有业务方向：${projects[*]}${NC}"
    
    # 能力缺口分析（简化版）
    cat > "${OUTPUT_DIR}/capability-gaps-${TIMESTAMP}.md" << EOF
# 能力缺口分析

**分析时间：** ${DATE}

## 现有能力清单

### 技术能力
- [x] 数字孪生三维可视化
- [x] AI 视频生成（集成 API）
- [x] 短视频脚本自动化
- [x] Subagent 协作开发
- [ ] 自研视频生成模型（缺口）
- [ ] 实时语音交互（缺口）
- [ ] 多模态大模型微调（缺口）

### 业务能力
- [x] 政府/园区项目交付
- [x] 内容生产自动化
- [ ] SaaS 产品运营（缺口）
- [ ] 规模化获客（缺口）
- [ ] 渠道合作伙伴管理（缺口）

### 资源能力
- [x] 现有客户基础（20+ 项目）
- [x] 开发团队（5 人+）
- [ ] 专职销售团队（缺口）
- [ ] 市场营销预算（缺口）
- [ ] 行业展会资源（缺口）

## 优先级排序

| 缺口 | 影响 | 紧急度 | 建议行动 |
|------|------|--------|---------|
| SaaS 运营经验 | 高 | 中 | 招募运营合伙人 |
| 销售团队 | 高 | 高 | 2 个月内组建 |
| 自研模型 | 中 | 低 | 观察技术成熟度 |

---
*分析由 opportunity-scan.sh 自动生成*
EOF
    
    echo -e "${GREEN}✓ 能力缺口分析：${OUTPUT_DIR}/capability-gaps-${TIMESTAMP}.md${NC}"
}

# 自动生成提案草稿
generate_proposal() {
    echo -e "${YELLOW}[4/5] 生成提案草稿...${NC}"
    
    # 读取模板
    local template="${OUTPUT_DIR}/TEMPLATE-business-opportunity.md"
    if [ ! -f "$template" ]; then
        echo -e "${RED}✗ 模板文件不存在：$template${NC}"
        return 1
    fi
    
    # 生成提案草稿
    cat > "${OUTPUT_DIR}/proposal-draft-${TIMESTAMP}.md" << EOF
# 商业机会提案草稿

> **生成时间：** ${DATE}  
> **状态：** 草稿（需人工完善）  
> **来源：** opportunity-scan.sh 自动生成

---

## 📋 机会描述

**一句话定义：** [待填写]

**核心痛点：**
- [待填写]
- [待填写]
- [待填写]

**解决方案：** [待填写]

---

## 📊 市场分析

**目标用户：** [待填写]

**市场规模：** [待填写 - 从 market-scan-${TIMESTAMP}.md 提取]

**竞争格局：** [待填写]

---

## 💰 ROI 评估

**投入估算：** [待填写]

**收益预测：** [待填写]

**投资回收期：** [待填写]

**首年 ROI：** [待填写]

---

## 🚀 执行计划

**阶段一：MVP** - [时间周期]
- [ ] [待填写]

**阶段二：产品化** - [时间周期]
- [ ] [待填写]

**阶段三：规模化** - [时间周期]
- [ ] [待填写]

---

## ✅ 决策建议

**推荐指数：** ⭐⭐⭐⭐⭐ [待评分]

**评级：** P0/P1/P2 [待确定]

**下一步：** [待填写]

---
*草稿由 opportunity-scan.sh 自动生成 - 请人工完善后提交审批*
EOF
    
    echo -e "${GREEN}✓ 提案草稿：${OUTPUT_DIR}/proposal-draft-${TIMESTAMP}.md${NC}"
}

# 推送到 proposals 目录并通知
notify_completion() {
    echo -e "${YELLOW}[5/5] 完成推送...${NC}"
    
    # 列出所有生成的文件
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  扫描完成！生成文件：${NC}"
    echo -e "${GREEN}========================================${NC}"
    ls -lh "${OUTPUT_DIR}"/*-${TIMESTAMP}.* 2>/dev/null || echo "无文件生成"
    echo ""
    
    # 生成摘要
    cat << EOF
📊 扫描摘要
━━━━━━━━━━━━━━━━━━━━━━━━
时间：${DATE}
输出目录：${OUTPUT_DIR}
生成文件：3 个
  - market-scan-${TIMESTAMP}.md（市场趋势）
  - capability-gaps-${TIMESTAMP}.md（能力缺口）
  - proposal-draft-${TIMESTAMP}.md（提案草稿）

✅ 下一步行动：
1. 阅读 market-scan-*.md 了解市场动态
2. 检查 capability-gaps-*.md 识别能力短板
3. 完善 proposal-draft-*.md 并提交审批

💡 提示：使用以下命令查看生成的文件
  cat ${OUTPUT_DIR}/proposal-draft-${TIMESTAMP}.md
EOF
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# 主函数
main() {
    local industry="${1:-AI 数字孪生 短视频培训}"
    
    echo ""
    echo -e "扫描行业：${industry}"
    echo ""
    
    # 确保输出目录存在
    mkdir -p "${OUTPUT_DIR}"
    
    # 执行扫描流程
    check_network
    scan_market_trends "${industry}"
    identify_gaps
    generate_proposal
    notify_completion
    
    echo -e "${GREEN}✓ 扫描完成！${NC}"
}

# 执行
main "$@"
