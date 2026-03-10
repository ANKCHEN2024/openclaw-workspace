#!/usr/bin/env node
/**
 * 智能学习路径计算算法
 * 
 * 基于知识图谱和 LanceDB，为 MOSS 创建个性化的智能学习路径推荐系统
 * 
 * 输入：
 * - 当前能力向量
 * - 目标能力向量
 * - 技能依赖图
 * - 时间约束
 * 
 * 输出：
 * - 最优学习顺序
 * - 预计时间投入
 * - 预期 ROI
 */

const fs = require('fs').promises;
const path = require('path');

// ==================== 配置 ====================

const CONFIG = {
  workspacePath: '/Users/chenggl/workspace',
  capabilityInventoryPath: '/Users/chenggl/workspace/capability-inventory.md',
  learningPlanPath: '/Users/chenggl/workspace/training/personalized-learning-plan.md',
  learningReportPath: '/Users/chenggl/workspace/training/learning-path-report.md',
  lancedbPath: '/Users/chenggl/workspace/lancedb',
  
  // 时间约束（小时/天）
  timeConstraints: {
    weekday: 3,  // 工作日每天 3 小时
    weekend: 5,  // 周末每天 5 小时
    weeklyTotal: 25 // 每周总学习时长
  },
  
  // ROI 计算权重
  roiWeights: {
    revenueImpact: 0.4,    // 收入影响
    projectBlocker: 0.3,   // 项目阻塞程度
    competitiveAdvantage: 0.2, // 竞争优势
    learningCurve: 0.1     // 学习曲线（越容易学权重越高）
  }
};

// ==================== 能力数据模型 ====================

/**
 * 能力项定义
 */
class Capability {
  constructor(name, current, target, priority, dependencies = []) {
    this.name = name;
    this.current = current;      // 当前水平 (1-5)
    this.target = target;        // 目标水平 (1-5)
    this.priority = priority;    // P0/P1/P2
    this.dependencies = dependencies; // 依赖的其他能力
    this.gap = target - current; // 能力缺口
    this.estimatedHours = this.calculateEstimatedHours();
    this.roi = this.calculateROI();
  }
  
  calculateEstimatedHours() {
    // 每个等级差距需要的学习时间（小时）
    const hoursPerLevel = {
      'P0': 8,   // 高优先级 - 投入更多时间快速掌握
      'P1': 6,   // 中优先级
      'P2': 4    // 低优先级
    };
    return this.gap * (hoursPerLevel[this.priority] || 5);
  }
  
  calculateROI() {
    // ROI = benefit / cost
    const benefit = this.calculateBenefit();
    const cost = this.estimatedHours;
    return benefit / cost;
  }
  
  calculateBenefit() {
    // benefit = revenue impact * 0.4 + project blocker * 0.3 + competitive advantage * 0.2
    const priorityScore = { 'P0': 1.0, 'P1': 0.6, 'P2': 0.3 };
    return this.gap * (priorityScore[this.priority] || 0.5) * 10;
  }
}

// ==================== 学习路径算法 ====================

/**
 * 学习路径计算器
 */
class LearningPathCalculator {
  constructor() {
    this.capabilities = [];
    this.skillGraph = new Map(); // 技能依赖图
    this.learningPath = [];
  }
  
  /**
   * 从 capability-inventory.md 加载能力数据
   */
  async loadCapabilities() {
    console.log('📊 加载能力清单...');
    
    try {
      const content = await fs.readFile(CONFIG.capabilityInventoryPath, 'utf-8');
      
      // 解析 markdown 表格
      const lines = content.split('\n');
      let currentCategory = '';
      
      for (const line of lines) {
        // 检测类别标题
        if (line.startsWith('### ')) {
          currentCategory = line.replace('### ', '').trim();
        }
        
        // 检测能力表格行
        if (line.includes('|') && line.includes('P0') || line.includes('P1') || line.includes('P2')) {
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          
          if (parts.length >= 5 && parts[0] !== '能力项') {
            const [name, currentStr, targetStr, gapStr, priority] = parts;
            
            // 解析数值
            const current = parseInt(currentStr) || 0;
            const target = parseInt(targetStr) || 0;
            
            if (name && current > 0 && target > 0) {
              const cap = new Capability(name, current, target, priority);
              cap.category = currentCategory;
              this.capabilities.push(cap);
            }
          }
        }
      }
      
      console.log(`✅ 加载 ${this.capabilities.length} 个能力项`);
      
    } catch (error) {
      console.error('❌ 加载能力清单失败:', error.message);
      // 使用默认能力数据
      this.loadDefaultCapabilities();
    }
  }
  
  /**
   * 加载默认能力数据（用于测试）
   */
  loadDefaultCapabilities() {
    console.log('⚠️  使用默认能力数据...');
    
    this.capabilities = [
      // Subagent 指挥官能力
      new Capability('任务分解', 3, 5, 'P0', []),
      new Capability('并行调度', 3, 5, 'P0', ['任务分解']),
      new Capability('质量控制', 2, 5, 'P0', ['任务分解']),
      new Capability('冲突解决', 2, 5, 'P1', ['质量控制']),
      
      // AI 合伙人能力
      new Capability('商业洞察', 2, 5, 'P0', []),
      new Capability('主动提案', 3, 5, 'P0', ['商业洞察']),
      new Capability('ROI 判断', 3, 5, 'P0', ['商业洞察']),
      new Capability('风险预警', 2, 5, 'P1', ['商业洞察']),
      
      // 技术执行能力
      new Capability('FFmpeg 视频处理', 3, 5, 'P0', []),
      new Capability('AI API 集成', 4, 5, 'P0', []),
      new Capability('LanceDB 向量搜索', 2, 5, 'P1', []),
      new Capability('Python 自动化', 3, 5, 'P1', []),
      
      // 业务能力
      new Capability('AI 短剧全流程', 3, 5, 'P0', ['FFmpeg 视频处理']),
      new Capability('项目管理', 3, 5, 'P0', []),
      new Capability('收入增长策略', 2, 5, 'P0', ['商业洞察']),
    ];
  }
  
  /**
   * 构建技能依赖图
   */
  buildSkillGraph() {
    console.log('🕸️  构建技能依赖图...');
    
    for (const cap of this.capabilities) {
      this.skillGraph.set(cap.name, cap);
    }
    
    console.log(`✅ 技能图包含 ${this.skillGraph.size} 个节点`);
  }
  
  /**
   * 拓扑排序 - 考虑依赖关系的学习顺序
   */
  topologicalSort() {
    const visited = new Set();
    const result = [];
    const visiting = new Set(); // 用于检测循环依赖
    
    const visit = (capName) => {
      if (visited.has(capName)) return true;
      if (visiting.has(capName)) {
        console.warn(`⚠️  检测到循环依赖：${capName}`);
        return false;
      }
      
      visiting.add(capName);
      const cap = this.skillGraph.get(capName);
      
      if (cap && cap.dependencies) {
        for (const dep of cap.dependencies) {
          if (!visit(dep)) return false;
        }
      }
      
      visiting.delete(capName);
      visited.add(capName);
      result.push(capName);
      return true;
    };
    
    // 按优先级排序
    const sorted = [...this.capabilities].sort((a, b) => {
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    for (const cap of sorted) {
      visit(cap.name);
    }
    
    return result;
  }
  
  /**
   * 计算最优学习路径
   */
  calculateOptimalPath() {
    console.log('🧮 计算最优学习路径...');
    
    const sortedNames = this.topologicalSort();
    const path = [];
    let totalHours = 0;
    
    for (const name of sortedNames) {
      const cap = this.skillGraph.get(name);
      if (cap && cap.gap > 0) {
        path.push({
          order: path.length + 1,
          capability: cap.name,
          category: cap.category,
          current: cap.current,
          target: cap.target,
          priority: cap.priority,
          estimatedHours: cap.estimatedHours,
          roi: cap.roi.toFixed(2),
          dependencies: cap.dependencies,
          cumulativeHours: totalHours + cap.estimatedHours
        });
        totalHours += cap.estimatedHours;
      }
    }
    
    this.learningPath = path;
    console.log(`✅ 生成 ${path.length} 步学习路径，总计 ${totalHours} 小时`);
    
    return path;
  }
  
  /**
   * 生成周学习计划
   */
  generateWeeklyPlan(weekStart) {
    const weekHours = CONFIG.timeConstraints.weeklyTotal;
    const weeklyPlan = [];
    let remainingHours = weekHours;
    
    for (const step of this.learningPath) {
      if (remainingHours <= 0) break;
      
      const hoursThisWeek = Math.min(step.estimatedHours, remainingHours);
      
      weeklyPlan.push({
        week: weekStart,
        capability: step.capability,
        hours: hoursThisWeek,
        progress: (hoursThisWeek / step.estimatedHours * 100).toFixed(0) + '%',
        priority: step.priority
      });
      
      remainingHours -= hoursThisWeek;
    }
    
    return weeklyPlan;
  }
  
  /**
   * 生成月度学习计划
   */
  generateMonthlyPlan(monthStart) {
    const monthHours = CONFIG.timeConstraints.weeklyTotal * 4; // 4 周
    const monthlyPlan = [];
    let remainingHours = monthHours;
    let weekOffset = 0;
    
    for (const step of this.learningPath) {
      if (remainingHours <= 0) break;
      
      const hoursThisMonth = Math.min(step.estimatedHours, remainingHours);
      const weekNum = Math.floor(weekOffset / CONFIG.timeConstraints.weeklyTotal) + 1;
      
      monthlyPlan.push({
        month: monthStart,
        week: weekNum,
        capability: step.capability,
        hours: hoursThisMonth,
        priority: step.priority,
        roi: step.roi
      });
      
      remainingHours -= hoursThisMonth;
      weekOffset += hoursThisMonth;
    }
    
    return monthlyPlan;
  }
  
  /**
   * 生成学习资源推荐
   */
  generateLearningResources(capabilityName) {
    const resourceMap = {
      'FFmpeg 视频处理': {
        resources: [
          'FFmpeg 官方文档：https://ffmpeg.org/documentation.html',
          'B 站教程：FFmpeg 从入门到精通',
          '实战项目：批量视频转码工具'
        ],
        practice: '为 AI 短剧平台创建自动化视频处理脚本'
      },
      '商业洞察': {
        resources: [
          '《商业模式新生代》',
          '36 氪 AI 行业报告',
          '晚点 LatePost 深度文章'
        ],
        practice: '每周分析 1 个 AI 创业案例'
      },
      'Subagent 并行调度': {
        resources: [
          'OpenClaw 官方文档',
          '并发编程最佳实践',
          '任务分解模式'
        ],
        practice: '优化现有 subagent 调度逻辑'
      },
      '质量控制': {
        resources: [
          '代码审查清单',
          '自动化测试入门',
          '质量管理框架'
        ],
        practice: '建立 subagent 输出质量检查机制'
      },
      'LanceDB 向量搜索': {
        resources: [
          'LanceDB 官方文档',
          '向量数据库原理',
          '语义搜索实践'
        ],
        practice: '优化记忆检索效率'
      }
    };
    
    return resourceMap[capabilityName] || {
      resources: ['官方文档', '实战教程', '社区讨论'],
      practice: '创建小型实践项目'
    };
  }
  
  /**
   * 生成个性化学习计划（Markdown）
   */
  generateLearningPlanMarkdown() {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const monthStart = now.toISOString().slice(0, 7); // YYYY-MM
    const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
    
    const weeklyPlan = this.generateWeeklyPlan(weekStart);
    const monthlyPlan = this.generateMonthlyPlan(monthStart);
    
    let md = `# MOSS 个性化学习计划\n\n`;
    md += `> 生成时间：${now.toISOString().slice(0, 10)}\n`;
    md += `> 算法版本：v1.0\n`;
    md += `> 每周可用时间：${CONFIG.timeConstraints.weeklyTotal} 小时\n\n`;
    
    md += `---\n\n`;
    
    // 本周学习
    md += `## 本周学习（${weekStart} ~ ${this.getWeekEnd(weekStart)}）\n\n`;
    
    const p0Tasks = weeklyPlan.filter(t => t.priority === 'P0');
    const p1Tasks = weeklyPlan.filter(t => t.priority === 'P1');
    const p2Tasks = weeklyPlan.filter(t => t.priority === 'P2');
    
    md += `### 优先级 1（每天 2 小时）\n\n`;
    if (p0Tasks.length > 0) {
      for (const task of p0Tasks) {
        const resources = this.generateLearningResources(task.capability);
        md += `#### ${task.capability}\n`;
        md += `- **为什么学**：高优先级能力缺口，直接影响项目进度\n`;
        md += `- **学习资源**：\n`;
        for (const res of resources.resources) {
          md += `  - ${res}\n`;
        }
        md += `- **实践项目**：${resources.practice}\n`;
        md += `- **预计投入**：${task.hours} 小时（本周进度 ${task.progress}）\n\n`;
      }
    } else {
      md += `暂无 P0 优先级任务\n\n`;
    }
    
    md += `### 优先级 2（每天 1 小时）\n\n`;
    if (p1Tasks.length > 0) {
      for (const task of p1Tasks) {
        md += `1. **${task.capability}** - ${task.hours} 小时（进度 ${task.progress}）\n`;
      }
      md += `\n`;
    } else {
      md += `暂无 P1 优先级任务\n\n`;
    }
    
    // 本月学习
    md += `---\n\n`;
    md += `## 本月学习（${monthStart}）\n\n`;
    
    const weekGroups = {};
    for (const task of monthlyPlan) {
      if (!weekGroups[task.week]) weekGroups[task.week] = [];
      weekGroups[task.week].push(task);
    }
    
    for (const [weekNum, tasks] of Object.entries(weekGroups)) {
      md += `### 第${weekNum}周\n`;
      for (const task of tasks) {
        md += `- ${task.capability} (${task.hours}小时，ROI: ${task.roi})\n`;
      }
      md += `\n`;
    }
    
    // 本季学习
    md += `---\n\n`;
    md += `## 本季学习（2026 ${quarter}）\n\n`;
    md += `### 季度目标\n`;
    md += `1. 综合能力提升至 3.8/5\n`;
    md += `2. 掌握所有 P0 优先级技能\n`;
    md += `3. 建立自动化学习追踪系统\n\n`;
    
    md += `### 关键里程碑\n`;
    md += `- 4 月：完成 Subagent 指挥能力升级\n`;
    md += `- 5 月：完成 AI 合伙人能力升级\n`;
    md += `- 6 月：形成独特竞争优势\n\n`;
    
    // 学习路径总览
    md += `---\n\n`;
    md += `## 学习路径总览\n\n`;
    md += `| 顺序 | 能力项 | 当前→目标 | 优先级 | 预计时长 | ROI |\n`;
    md += `|------|--------|-----------|--------|----------|-----|\n`;
    
    for (const step of this.learningPath.slice(0, 15)) {
      md += `| ${step.order} | ${step.capability} | ${step.current}→${step.target} | ${step.priority} | ${step.estimatedHours}h | ${step.roi} |\n`;
    }
    
    if (this.learningPath.length > 15) {
      md += `| ... | 还有${this.learningPath.length - 15}项 | ... | ... | ... | ... |\n`;
    }
    
    return md;
  }
  
  /**
   * 生成学习路径报告
   */
  generateLearningReport() {
    const now = new Date();
    const totalHours = this.learningPath.reduce((sum, step) => sum + step.estimatedHours, 0);
    const avgROI = this.learningPath.reduce((sum, step) => sum + parseFloat(step.roi), 0) / this.learningPath.length;
    
    let report = `# MOSS 学习路径分析报告\n\n`;
    report += `> 生成时间：${now.toISOString().slice(0, 10)}\n`;
    report += `> 分析维度：能力缺口 + ROI + 依赖关系\n\n`;
    
    report += `## 📊 总体概况\n\n`;
    report += `- **能力项总数**：${this.capabilities.length}\n`;
    report += `- **需要提升**：${this.learningPath.length}\n`;
    report += `- **预计总投入**：${totalHours} 小时\n`;
    report += `- **平均 ROI**：${avgROI.toFixed(2)}\n`;
    report += `- **预计完成周期**：${Math.ceil(totalHours / CONFIG.timeConstraints.weeklyTotal)} 周\n\n`;
    
    report += `## 🎯 优先级分布\n\n`;
    const p0Count = this.learningPath.filter(s => s.priority === 'P0').length;
    const p1Count = this.learningPath.filter(s => s.priority === 'P1').length;
    const p2Count = this.learningPath.filter(s => s.priority === 'P2').length;
    
    report += `- **P0（紧急重要）**：${p0Count} 项\n`;
    report += `- **P1（重要）**：${p1Count} 项\n`;
    report += `- **P2（次要）**：${p2Count} 项\n\n`;
    
    report += `## 📈 ROI 排行榜\n\n`;
    report += `| 排名 | 能力项 | ROI | 优先级 | 投入时长 |\n`;
    report += `|------|--------|-----|--------|----------|\n`;
    
    const sortedByROI = [...this.learningPath].sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));
    for (let i = 0; i < Math.min(10, sortedByROI.length); i++) {
      const step = sortedByROI[i];
      report += `| ${i + 1} | ${step.capability} | ${step.roi} | ${step.priority} | ${step.estimatedHours}h |\n`;
    }
    
    report += `\n## ⚠️  风险提示\n\n`;
    report += `1. **时间风险**：每周${CONFIG.timeConstraints.weeklyTotal}小时可能不足\n`;
    report += `2. **依赖风险**：部分能力存在前置依赖，需按顺序学习\n`;
    report += `3. **实践风险**：缺乏真实项目场景可能影响掌握速度\n\n`;
    
    report += `## ✅ 成功标准\n\n`;
    report += `- [ ] 明确未来 7 天的学习内容\n`;
    report += `- [ ] 明确未来 30 天的学习方向\n`;
    report += `- [ ] 建立可持续的学习节奏\n`;
    report += `- [ ] 学习进度可视化\n\n`;
    
    return report;
  }
  
  /**
   * 辅助函数：获取周一日期
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }
  
  getWeekEnd(weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }
  
  /**
   * 执行完整计算流程
   */
  async run() {
    console.log('🚀 开始计算学习路径...\n');
    
    await this.loadCapabilities();
    this.buildSkillGraph();
    this.calculateOptimalPath();
    
    // 生成学习计划
    const planMd = this.generateLearningPlanMarkdown();
    await fs.writeFile(CONFIG.learningPlanPath, planMd, 'utf-8');
    console.log(`✅ 学习计划已保存：${CONFIG.learningPlanPath}`);
    
    // 生成学习报告
    const reportMd = this.generateLearningReport();
    await fs.writeFile(CONFIG.learningReportPath, reportMd, 'utf-8');
    console.log(`✅ 学习报告已保存：${CONFIG.learningReportPath}`);
    
    console.log('\n🎉 学习路径计算完成！\n');
    
    return {
      totalCapabilities: this.capabilities.length,
      learningPathLength: this.learningPath.length,
      totalHours: this.learningPath.reduce((sum, step) => sum + step.estimatedHours, 0),
      avgROI: (this.learningPath.reduce((sum, step) => sum + parseFloat(step.roi), 0) / this.learningPath.length).toFixed(2)
    };
  }
}

// ==================== 主程序 ====================

async function main() {
  const calculator = new LearningPathCalculator();
  const result = await calculator.run();
  
  console.log('📊 计算结果摘要:');
  console.log(`   - 能力项总数：${result.totalCapabilities}`);
  console.log(`   - 学习路径长度：${result.learningPathLength} 步`);
  console.log(`   - 预计总时长：${result.totalHours} 小时`);
  console.log(`   - 平均 ROI: ${result.avgROI}`);
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LearningPathCalculator, CONFIG };
