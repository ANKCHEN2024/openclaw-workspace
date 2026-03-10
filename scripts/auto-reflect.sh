#!/bin/bash

# MOSS 自动反思脚本 v0.1
# 每次会话结束时自动运行，记录反思和学到的教训
# 使用方法：./scripts/auto-reflect.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 路径配置
WORKSPACE="/Users/chenggl/workspace"
MEMORY_DIR="$WORKSPACE/memory"
TODAY=$(date +%Y-%m-%d)
REFLECT_FILE="$MEMORY_DIR/${TODAY}-reflect.md"

# 初始化
init() {
    mkdir -p "$MEMORY_DIR"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   MOSS 自动反思 v0.1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 生成反思内容
generate_reflection() {
    local date_str=$(date '+%Y-%m-%d %H:%M:%S')
    local day_of_week=$(date '+%A')
    
    # 检查是否已存在今日反思文件
    if [ -f "$REFLECT_FILE" ]; then
        echo -e "${YELLOW}今日反思文件已存在，追加内容...${NC}"
        echo "" >> "$REFLECT_FILE"
        echo "---" >> "$REFLECT_FILE"
        echo "" >> "$REFLECT_FILE"
    fi
    
    cat >> "$REFLECT_FILE" << EOF
## 🤔 会话反思 [$date_str]

### ✅ 今天做得好的
- [待填写]

### 🔄 可以改进的
- [待填写]

### 💡 学到的教训
- [待填写]

### 📝 待办事项
- [ ] [待填写]

### 🎯 明天优先事项
- [ ] [待填写]

---
EOF

    echo -e "${GREEN}✓ 反思模板已创建：$REFLECT_FILE${NC}"
}

# 提示用户填写
prompt_user() {
    echo ""
    echo -e "${YELLOW}请花 2 分钟填写反思内容:${NC}"
    echo ""
    echo "文件位置：$REFLECT_FILE"
    echo ""
    echo "快速填写建议："
    echo "  1. 打开文件"
    echo "  2. 替换 [待填写] 为你的实际内容"
    echo "  3. 保存关闭"
    echo ""
    echo -e "${BLUE}或者让 AI 帮你自动填充（推荐）:${NC}"
    echo "  在下次会话开始时说：'帮我填充昨天的反思'"
    echo ""
}

# 更新进化状态
update_evolution_state() {
    local state_file="$MEMORY_DIR/evolution-state.json"
    
    if [ -f "$state_file" ]; then
        # 添加反思记录到进化历史
        echo -e "${GREEN}✓ 进化状态将在今晚批量更新${NC}"
    fi
}

# 主流程
main() {
    init
    generate_reflection
    prompt_user
    update_evolution_state
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   反思完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "记住：${YELLOW}写下来 > 脑子记${NC} 📝"
    echo ""
}

# 执行
main "$@"
