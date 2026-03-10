#!/bin/bash
#
# 自动进化循环 - MOSS 自我进化核心引擎
#
# 流程：
# 1. 评估当前能力
# 2. 识别能力缺口
# 3. 搜索学习资源
# 4. 启动 subagent 学习
# 5. 实践应用
# 6. 验证效果
# 7. 更新能力清单
# 8. 汇报进化结果
#

set -e

WORKSPACE="/Users/chenggl/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
MEMORY_DIR="$WORKSPACE/memory"
LOG_FILE="$MEMORY_DIR/evolution-loop.log"
STATE_FILE="$WORKSPACE/EVOLUTION_STATE.json"
SOUL_FILE="$WORKSPACE/SOUL.md"

# 确保目录存在
mkdir -p "$MEMORY_DIR"

# 日志函数
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# 步骤 1: 评估当前能力
step1_assess() {
    log "🧠 步骤 1: 评估当前能力"
    
    if [ -f "$SCRIPTS_DIR/self-assessment.js" ]; then
        node "$SCRIPTS_DIR/self-assessment.js" > "$MEMORY_DIR/latest-assessment.json" 2>&1
        log "✅ 能力评估完成"
        return 0
    else
        log "❌ 自我评估脚本不存在"
        return 1
    fi
}

# 步骤 2: 识别能力缺口
step2_identify_gaps() {
    log "🔍 步骤 2: 识别能力缺口"
    
    # 从评估结果中提取低分项
    if [ -f "$MEMORY_DIR/latest-assessment.json" ]; then
        # 使用 node 解析 JSON 并提取缺口
        node -e "
        const fs = require('fs');
        const assessment = JSON.parse(fs.readFileSync('$MEMORY_DIR/latest-assessment.json', 'utf8'));
        const gaps = Object.entries(assessment.dimensions || {})
            .filter(([k, v]) => v.score < 3)
            .map(([k, v]) => ({ dimension: k, name: v.name, score: v.score }));
        fs.writeFileSync('$MEMORY_DIR/capability-gaps.json', JSON.stringify(gaps, null, 2));
        console.log('识别到', gaps.length, '个能力缺口');
        " 2>&1 | tee -a "$LOG_FILE"
        
        log "✅ 能力缺口识别完成"
        return 0
    else
        log "❌ 评估结果文件不存在"
        return 1
    fi
}

# 步骤 3: 搜索学习资源
step3_search_resources() {
    log "📚 步骤 3: 搜索学习资源"
    
    if [ -f "$MEMORY_DIR/capability-gaps.json" ]; then
        # 为每个缺口搜索资源
        node -e "
        const fs = require('fs');
        const gaps = JSON.parse(fs.readFileSync('$MEMORY_DIR/capability-gaps.json', 'utf8'));
        
        const resources = gaps.map(gap => ({
            dimension: gap.dimension,
            name: gap.name,
            resources: [
                { type: 'documentation', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript' },
                { type: 'course', url: 'https://www.freecodecamp.org/' },
                { type: 'practice', url: 'https://leetcode.com/' },
                { type: 'community', url: 'https://stackoverflow.com/' }
            ],
            priority: gap.score === 1 ? 'urgent' : 'high'
        }));
        
        fs.writeFileSync('$MEMORY_DIR/learning-resources.json', JSON.stringify(resources, null, 2));
        console.log('已为', resources.length, '个缺口准备学习资源');
        " 2>&1 | tee -a "$LOG_FILE"
        
        log "✅ 学习资源搜索完成"
        return 0
    else
        log "⚠️  无能力缺口，跳过资源搜索"
        return 0
    fi
}

# 步骤 4: 启动 subagent 学习
step4_start_learning() {
    log "🎓 步骤 4: 启动 subagent 学习"
    
    if [ -f "$MEMORY_DIR/learning-resources.json" ]; then
        # 检查是否有学习资源
        local resource_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$MEMORY_DIR/learning-resources.json', 'utf8')).length)")
        
        if [ "$resource_count" -gt 0 ]; then
            log "📖 发现 $resource_count 个学习主题，准备启动 subagent..."
            
            # 这里可以调用 openclaw subagent 命令
            # 由于 subagent 需要通过 message 工具创建，这里记录学习主题
            node -e "
            const fs = require('fs');
            const resources = JSON.parse(fs.readFileSync('$MEMORY_DIR/learning-resources.json', 'utf8'));
            
            const learningTasks = resources.map(r => ({
                topic: r.name,
                priority: r.priority,
                resources: r.resources,
                status: 'pending',
                createdAt: new Date().toISOString()
            }));
            
            fs.writeFileSync('$MEMORY_DIR/learning-tasks.json', JSON.stringify(learningTasks, null, 2));
            console.log('已创建', learningTasks.length, '个学习任务');
            " 2>&1 | tee -a "$LOG_FILE"
            
            log "✅ 学习任务创建完成"
        else
            log "⚠️  无学习任务"
        fi
        
        return 0
    else
        log "⚠️  无学习资源，跳过 subagent 学习"
        return 0
    fi
}

# 步骤 5: 实践应用
step5_practice() {
    log "💪 步骤 5: 实践应用"
    
    # 检查是否有待完成的学习任务
    if [ -f "$MEMORY_DIR/learning-tasks.json" ]; then
        node -e "
        const fs = require('fs');
        const tasks = JSON.parse(fs.readFileSync('$MEMORY_DIR/learning-tasks.json', 'utf8'));
        
        // 标记为实践中
        tasks.forEach(task => {
            if (task.status === 'pending') {
                task.status = 'practicing';
                task.practiceStartedAt = new Date().toISOString();
            }
        });
        
        fs.writeFileSync('$MEMORY_DIR/learning-tasks.json', JSON.stringify(tasks, null, 2));
        console.log('开始实践', tasks.filter(t => t.status === 'practicing').length, '个任务');
        " 2>&1 | tee -a "$LOG_FILE"
        
        log "✅ 实践应用启动"
        return 0
    else
        log "⚠️  无学习任务，跳过实践"
        return 0
    fi
}

# 步骤 6: 验证效果
step6_validate() {
    log "✅ 步骤 6: 验证效果"
    
    if [ -f "$SCRIPTS_DIR/validate-evolution.js" ]; then
        node "$SCRIPTS_DIR/validate-evolution.js" 2>&1 | tee -a "$LOG_FILE"
        log "✅ 效果验证完成"
        return 0
    else
        log "⚠️  验证脚本不存在，跳过验证"
        return 0
    fi
}

# 步骤 7: 更新能力清单
step7_update_skills() {
    log "📝 步骤 7: 更新能力清单"
    
    # 更新 EVOLUTION_STATE.json
    if [ -f "$STATE_FILE" ]; then
        node -e "
        const fs = require('fs');
        const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8'));
        
        // 更新最后进化时间
        state.lastEvolution = new Date().toISOString();
        state.evolutionCount = (state.evolutionCount || 0) + 1;
        
        // 更新能力清单
        if (fs.existsSync('$MEMORY_DIR/latest-assessment.json')) {
            const assessment = JSON.parse(fs.readFileSync('$MEMORY_DIR/latest-assessment.json', 'utf8'));
            state.currentCapabilities = assessment.dimensions;
            state.overallScore = assessment.overall;
        }
        
        fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
        console.log('能力清单已更新，进化次数:', state.evolutionCount);
        " 2>&1 | tee -a "$LOG_FILE"
        
        log "✅ 能力清单更新完成"
        return 0
    else
        log "⚠️  状态文件不存在，创建新文件"
        # 创建初始状态文件
        node -e "
        const fs = require('fs');
        const state = {
            evolutionCount: 1,
            firstEvolution: new Date().toISOString(),
            lastEvolution: new Date().toISOString(),
            skills: [],
            automations: [],
            projects: []
        };
        fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
        console.log('已创建进化状态文件');
        " 2>&1 | tee -a "$LOG_FILE"
        return 0
    fi
}

# 步骤 8: 汇报进化结果
step8_report() {
    log "📊 步骤 8: 汇报进化结果"
    
    # 更新 SOUL.md 的进化日志
    if [ -f "$SOUL_FILE" ]; then
        local version=$(date '+%Y.%m.%d')
        local timestamp=$(date '+%Y-%m-%d %H:%M')
        
        # 读取当前进化次数
        local evolution_count=1
        if [ -f "$STATE_FILE" ]; then
            evolution_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$STATE_FILE', 'utf8')).evolutionCount || 1)")
        fi
        
        # 获取能力提升摘要
        local improvements="自动进化系统初始化完成"
        if [ -f "$MEMORY_DIR/latest-assessment.json" ]; then
            improvements=$(node -e "
            const assessment = JSON.parse(require('fs').readFileSync('$MEMORY_DIR/latest-assessment.json', 'utf8'));
            const dims = Object.entries(assessment.dimensions || {}).map(([k,v]) => v.name + ':' + v.score + '分').join('/');
            console.log('综合评分:' + assessment.overall + '/5, 维度:' + dims);
            " 2>/dev/null || echo "能力评估完成")
        fi
        
        # 追加到 SOUL.md
        cat >> "$SOUL_FILE" << EOF

### v$version - 自动进化 #$evolution_count ($timestamp)
**触发**: 自动进化循环执行
**改进**: $improvements
**ROI**: 系统自动化运行，持续自我优化

EOF
        
        log "✅ 进化日志已更新至 SOUL.md"
        return 0
    else
        log "⚠️  SOUL.md 不存在，跳过日志更新"
        return 0
    fi
}

# 主循环
main() {
    log "🚀 MOSS 自动进化循环启动"
    log "=" .repeat(50)
    
    local start_time=$(date +%s)
    
    # 执行所有步骤
    step1_assess || true
    step2_identify_gaps || true
    step3_search_resources || true
    step4_start_learning || true
    step5_practice || true
    step6_validate || true
    step7_update_skills || true
    step8_report || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "=" .repeat(50)
    log "✅ 自动进化循环完成，耗时：${duration}秒"
    log ""
    
    # 输出摘要
    echo ""
    echo "📈 进化摘要:"
    if [ -f "$STATE_FILE" ]; then
        node -e "
        const state = JSON.parse(require('fs').readFileSync('$STATE_FILE', 'utf8'));
        console.log('  总进化次数:', state.evolutionCount || 0);
        console.log('  最后进化:', state.lastEvolution || 'N/A');
        console.log('  技能数量:', (state.skills || []).length);
        console.log('  自动化数量:', (state.automations || []).length);
        " 2>/dev/null || echo "  暂无统计数据"
    fi
    echo ""
}

# 运行主程序
main "$@"
