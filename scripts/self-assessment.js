#!/usr/bin/env node
/**
 * 自我评估脚本 - MOSS 能力评估框架
 * 
 * 评估维度：
 * - 技术能力（编码/调试/架构）
 * - 业务能力（ROI 判断/市场分析）
 * - 沟通能力（表达/文档/教学）
 * - 效率能力（自动化/工具使用）
 * - 学习能力（新知识吸收速度）
 * 
 * 评分标准：1-5 分（1=入门，5=专家），基于实际成果而非自我感觉
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/chenggl/workspace';
const ASSESSMENT_LOG = path.join(WORKSPACE, 'memory/assessments.json');

// 评估维度定义
const DIMENSIONS = {
  technical: {
    name: '技术能力',
    subItems: ['编码', '调试', '架构设计', '代码质量', '技术深度'],
    evidence: ['提交记录', 'PR 数量', 'Bug 解决数', '架构文档']
  },
  business: {
    name: '业务能力',
    subItems: ['ROI 判断', '市场分析', '需求理解', '优先级排序'],
    evidence: ['项目收益', '需求文档', '决策记录']
  },
  communication: {
    name: '沟通能力',
    subItems: ['表达清晰度', '文档质量', '教学能力', '协作效率'],
    evidence: ['文档数量', '教程产出', '沟通记录']
  },
  efficiency: {
    name: '效率能力',
    subItems: ['自动化程度', '工具使用', '流程优化', '时间管理'],
    evidence: ['脚本数量', '自动化任务', '节省时间']
  },
  learning: {
    name: '学习能力',
    subItems: ['新知识吸收', '技能迁移', '反思深度', '应用速度'],
    evidence: ['新技能掌握', '学习日志', '应用案例']
  }
};

// 评分标准
const SCORING_CRITERIA = {
  1: '入门 - 需要了解基础知识，需要指导才能完成任务',
  2: '初级 - 能完成简单任务，但需要帮助解决复杂问题',
  3: '中级 - 能独立完成常规任务，偶尔需要咨询',
  4: '高级 - 能解决复杂问题，能指导他人',
  5: '专家 - 能设计系统架构，创新解决方案，行业领先'
};

/**
 * 收集评估证据
 */
function collectEvidence() {
  const evidence = {
    technical: {
      commits: 0,
      prs: 0,
      scripts: 0,
      bugs_fixed: 0
    },
    business: {
      projects_completed: 0,
      roi_decisions: 0,
      requirements_analyzed: 0
    },
    communication: {
      docs_written: 0,
      tutorials_created: 0,
      knowledge_shared: 0
    },
    efficiency: {
      automations_created: 0,
      time_saved_hours: 0,
      tools_mastered: 0
    },
    learning: {
      new_skills_learned: 0,
      skills_applied: 0,
      reflections_written: 0
    }
  };

  // 扫描工作空间收集证据
  try {
    // 统计脚本数量
    const scriptsDir = path.join(WORKSPACE, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      evidence.technical.scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') || f.endsWith('.sh')).length;
    }

    // 统计文档数量
    const docsCount = fs.readdirSync(WORKSPACE).filter(f => f.endsWith('.md')).length;
    evidence.communication.docs_written = docsCount;

    // 读取记忆文件统计学习记录
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (fs.existsSync(memoryDir)) {
      const memoryFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
      evidence.learning.reflections_written = memoryFiles.length;
    }

    // 读取进化状态
    const evolutionStatePath = path.join(WORKSPACE, 'EVOLUTION_STATE.json');
    if (fs.existsSync(evolutionStatePath)) {
      const state = JSON.parse(fs.readFileSync(evolutionStatePath, 'utf8'));
      evidence.learning.new_skills_learned = state.skills?.length || 0;
      evidence.efficiency.automations_created = state.automations?.length || 0;
    }
  } catch (err) {
    console.error('收集证据时出错:', err.message);
  }

  return evidence;
}

/**
 * 基于证据计算分数
 */
function calculateScore(dimension, evidence) {
  const dimEvidence = evidence[dimension];
  if (!dimEvidence) return 3; // 默认中级

  const metrics = Object.values(dimEvidence);
  const total = metrics.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  const avg = total / metrics.length;

  // 根据证据数量映射到 1-5 分
  if (avg === 0) return 1;
  if (avg < 2) return 2;
  if (avg < 5) return 3;
  if (avg < 10) return 4;
  return 5;
}

/**
 * 执行评估
 */
function runAssessment() {
  console.log('🧠 MOSS 自我能力评估系统');
  console.log('=' .repeat(50));
  console.log(`评估时间：${new Date().toISOString()}`);
  console.log('');

  const evidence = collectEvidence();
  const results = {
    timestamp: new Date().toISOString(),
    dimensions: {},
    overall: 0,
    evidence: evidence
  };

  let totalScore = 0;

  // 评估每个维度
  Object.entries(DIMENSIONS).forEach(([key, dim]) => {
    const score = calculateScore(key, evidence);
    results.dimensions[key] = {
      name: dim.name,
      score: score,
      criteria: SCORING_CRITERIA[score],
      evidence: evidence[key]
    };
    totalScore += score;

    console.log(`📊 ${dim.name}: ${score}/5`);
    console.log(`   标准：${SCORING_CRITERIA[score]}`);
    console.log(`   证据：${JSON.stringify(evidence[key])}`);
    console.log('');
  });

  results.overall = Math.round(totalScore / Object.keys(DIMENSIONS).length);

  console.log('=' .repeat(50));
  console.log(`🎯 综合评分：${results.overall}/5`);
  console.log('');

  // 识别能力缺口
  const gaps = Object.entries(results.dimensions)
    .filter(([_, data]) => data.score < 3)
    .map(([key, data]) => ({
      dimension: key,
      name: data.name,
      score: data.score,
      priority: data.score === 1 ? '紧急' : data.score === 2 ? '高' : '中'
    }));

  if (gaps.length > 0) {
    console.log('⚠️  识别到能力缺口：');
    gaps.forEach(gap => {
      console.log(`   - ${gap.name} (${gap.score}/5) - 优先级：${gap.priority}`);
    });
    console.log('');
  } else {
    console.log('✅ 所有维度均达到中级以上水平');
    console.log('');
  }

  // 保存评估结果
  saveAssessment(results);

  // 输出 JSON 结果供其他脚本使用
  console.log('📄 评估结果已保存至:', ASSESSMENT_LOG);
  console.log('');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

/**
 * 保存评估结果
 */
function saveAssessment(results) {
  try {
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    let assessments = [];
    if (fs.existsSync(ASSESSMENT_LOG)) {
      assessments = JSON.parse(fs.readFileSync(ASSESSMENT_LOG, 'utf8'));
    }

    assessments.push(results);
    // 保留最近 100 次评估
    assessments = assessments.slice(-100);

    fs.writeFileSync(ASSESSMENT_LOG, JSON.stringify(assessments, null, 2));
  } catch (err) {
    console.error('保存评估结果失败:', err.message);
  }
}

/**
 * 获取最新评估结果
 */
function getLatestAssessment() {
  try {
    if (fs.existsSync(ASSESSMENT_LOG)) {
      const assessments = JSON.parse(fs.readFileSync(ASSESSMENT_LOG, 'utf8'));
      return assessments[assessments.length - 1] || null;
    }
  } catch (err) {
    console.error('读取评估结果失败:', err.message);
  }
  return null;
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--latest')) {
    const latest = getLatestAssessment();
    console.log(JSON.stringify(latest, null, 2));
  } else {
    runAssessment();
  }
}

module.exports = { runAssessment, getLatestAssessment, DIMENSIONS, SCORING_CRITERIA };
