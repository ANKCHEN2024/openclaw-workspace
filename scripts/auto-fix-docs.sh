#!/bin/bash
# auto-fix-docs.sh - 自动修复文档关联问题
# 不仅检查，还会自动添加缺失的引用

set -e

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

echo "🔧 开始自动修复文档关联..."

# 标准引用头部（用于项目文档）
PRINCIPLES_HEADER="> **工作准则**：本项目遵循 \`../WORK_PRINCIPLES.md\` 全部 15 条准则，特别是：
> - 第 2 条：24 小时不间断开发
> - 第 4 条：质量第一（零缺陷交付）
> - 第 6 条：定时汇报
> - 第 8 条：Subagent 优先（并行开发）
> - 第 10 条：写下来>脑子记
> - 第 12 条：快速迭代（MVP 优先）
> - 第 13 条：透明沟通
"

# 项目文档列表
PROJECT_DOCS=(
    "ai-drama-platform/DEVELOPMENT_TASK.md"
    "ai-drama-platform/COMMAND_CENTER.md"
    "ai-drama-platform/README.md"
    "short-video-platform/PROJECT_SUMMARY.md"
    "short-video-platform/PROJECT_PLAN.md"
    "short-video-platform/README.md"
)

FIXED_COUNT=0

# 自动修复项目文档引用
for doc in "${PROJECT_DOCS[@]}"; do
    if [ -f "$WORKSPACE/$doc" ]; then
        if ! grep -q "WORK_PRINCIPLES.md" "$WORKSPACE/$doc" 2>/dev/null; then
            echo "🔧 修复：$doc"
            
            # 读取文件内容
            CONTENT=$(cat "$WORKSPACE/$doc")
            
            # 在标题后插入引用
            if [[ "$CONTENT" == *"# "* ]]; then
                # 提取第一行（标题）
                FIRST_LINE=$(echo "$CONTENT" | head -1)
                REST=$(echo "$CONTENT" | tail -n +2)
                
                # 写入新内容
                echo "$FIRST_LINE" > "$WORKSPACE/$doc"
                echo "" >> "$WORKSPACE/$doc"
                echo "$PRINCIPLES_HEADER" >> "$WORKSPACE/$doc"
                echo "$REST" >> "$WORKSPACE/$doc"
                
                echo "   ✅ 已添加 WORK_PRINCIPLES.md 引用"
                ((FIXED_COUNT++))
            else
                echo "   ⚠️  无法识别标题格式，跳过"
            fi
        else
            echo "✅ 已引用：$doc"
        fi
    fi
done

# 确保目录存在
for dir in decisions training logs; do
    if [ ! -d "$WORKSPACE/$dir" ]; then
        echo "🔧 创建目录：$dir"
        mkdir -p "$WORKSPACE/$dir"
        ((FIXED_COUNT++))
    fi
done

# 确保 README 文件存在
if [ ! -f "$WORKSPACE/decisions/README.md" ]; then
    echo "🔧 创建 decisions/README.md"
    cat > "$WORKSPACE/decisions/README.md" << 'EOF'
# 决策日志

记录重要决策、权衡分析和经验教训。

## 为什么要记录决策？

根据 `../WORK_PRINCIPLES.md`：
- **第 5 条**：自我反思与迭代 —— 经验固化
- **第 10 条**：写下来 > 脑子记
- **第 13 条**：透明沟通

## 决策模板

```markdown
# 决策标题

**日期**: YYYY-MM-DD  
**决策者**: [谁做的决策]  
**状态**: 已执行 / 进行中 / 已撤销

## 背景
为什么要做这个决策？

## 选项分析
| 选项 | 优点 | 缺点 | 评估 |
|------|------|------|------|
| 选项 A | ... | ... | ... |
| 选项 B | ... | ... | ... |

## 最终决策
选择了哪个方案？为什么？

## 实施计划
- [ ] 任务 1
- [ ] 任务 2

## 预期结果
期望达到什么效果？

## 复盘日期
YYYY-MM-DD（建议 1-2 周后复盘）

## 复盘结果
（到期后填写）
```

## 相关文件

- `../WORK_PRINCIPLES.md` - 工作准则
- `../MEMORY.md` - 长期记忆
- `../memory/YYYY-MM-DD.md` - 每日笔记
EOF
    ((FIXED_COUNT++))
fi

if [ ! -f "$WORKSPACE/training/README.md" ]; then
    echo "🔧 创建 training/README.md"
    cat > "$WORKSPACE/training/README.md" << 'EOF'
# 能力培训大纲

根据 `../WORK_PRINCIPLES.md` 第 7 条：**自行组织培训，保持世界一流**

## 培训目标

持续提升 MOSS 和 subagent 团队的能力，确保：
- 技术能力保持行业一流
- 工作效率持续优化
- 知识体系不断更新

## 培训分类

### 技术能力
- AI API 集成 - 国产 AI 服务使用
- Node.js 高级 - Express、异步编程
- Vue 3 开发 - 组件设计、状态管理
- Python 自动化 - 脚本编写、数据处理
- FFmpeg 视频处理 - 编解码、滤镜、合成

### 工程能力
- Subagent 协作 - 任务分解、并行开发
- 代码审查 - 质量把控、最佳实践
- 测试驱动开发 - 单元测试、集成测试
- DevOps - CI/CD、部署、监控

## 培训计划

### 每周
- 至少完成 1 个技术主题学习
- 至少完成 1 次代码审查实践
- 更新培训材料

### 每月
- 能力评估（自评 + 老板反馈）
- 培训计划调整
- 新技术调研

## 相关资源

- `../decisions/` - 决策日志
- `../memory/` - 每日笔记
- `../MEMORY.md` - 长期记忆
EOF
    ((FIXED_COUNT++))
fi

# 生成修复报告
echo ""
echo "================================"
echo "🔧 自动修复完成 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"
echo ""
echo "修复项目数：$FIXED_COUNT"
echo ""

# 记录到日志
LOG_FILE="$WORKSPACE/logs/auto-fix-docs.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 修复 $FIXED_COUNT 个项目" >> "$LOG_FILE"

echo "✅ 所有修复完成！"
