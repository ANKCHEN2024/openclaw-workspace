#!/usr/bin/env node
/**
 * 进化触发器 - 检测是否需要启动进化流程
 * 
 * 触发条件：
 * - 能力评估 <3 分（需要改进）
 * - 新项目需求（需要新技能）
 * - 技术更新（需要学习新技术）
 * - 效率瓶颈（需要优化流程）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/chenggl/workspace';
const TRIGGER_LOG = path.join(WORKSPACE, 'memory/evolution-triggers.json');
const ASSESSMENT_LOG = path.join(WORKSPACE, 'memory/assessments.json');
const EVOLUTION_STATE = path.join(WORKSPACE, 'EVOLUTION_STATE.json');

// 触发器类型
const TRIGGER_TYPES = {
  LOW_SCORE: {
    id: 'low_score',
    name: '能力评分过低',
    description: '某项能力评估低于 3 分，需要改进',
    priority: 'high'
  },
  NEW_PROJECT: {
    id: 'new_project',
    name: '新项目需求',
    description: '新项目需要新技能',
    priority: 'medium'
  },
  TECH_UPDATE: {
    id: 'tech_update',
    name: '技术更新',
    description: '需要学习新技术以保持竞争力',
    priority: 'medium'
  },
  EFFICIENCY_BOTTLENECK: {
    id: 'efficiency_bottleneck',
    name: '效率瓶颈',
    description: '检测到重复劳动，需要自动化优化',
    priority: 'high'
  },
  SCHEDULED: {
    id: 'scheduled',
    name: '定期进化',
    description: '每周例行进化检查',
    priority: 'low'
  }
};

/**
 * 检查能力评分是否过低
 */
function checkLowScore() {
  const triggers = [];
  
  try {
    if (fs.existsSync(ASSESSMENT_LOG)) {
      const assessments = JSON.parse(fs.readFileSync(ASSESSMENT_LOG, 'utf8'));
      const latest = assessments[assessments.length - 1];
      
      if (latest && latest.dimensions) {
        Object.entries(latest.dimensions).forEach(([key, data]) => {
          if (data.score < 3) {
            triggers.push({
              type: TRIGGER_TYPES.LOW_SCORE,
              dimension: key,
              dimensionName: data.name,
              currentScore: data.score,
              targetScore: 3,
              detectedAt: new Date().toISOString(),
              reason: `${data.name}评分为${data.score}分，低于目标值 3 分`
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('检查能力评分时出错:', err.message);
  }
  
  return triggers;
}

/**
 * 检查新项目需求
 */
function checkNewProject() {
  const triggers = [];
  
  try {
    // 检查是否有新的项目目录
    const projectsDir = path.join(WORKSPACE, 'projects');
    if (fs.existsSync(projectsDir)) {
      const projects = fs.readdirSync(projectsDir);
      
      // 读取进化状态，检查是否有新项目未被处理
      if (fs.existsSync(EVOLUTION_STATE)) {
        const state = JSON.parse(fs.readFileSync(EVOLUTION_STATE, 'utf8'));
        const knownProjects = state.projects || [];
        
        projects.forEach(project => {
          if (!knownProjects.includes(project)) {
            triggers.push({
              type: TRIGGER_TYPES.NEW_PROJECT,
              project: project,
              detectedAt: new Date().toISOString(),
              reason: `检测到新项目 "${project}"，可能需要新技能`
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('检查新项目时出错:', err.message);
  }
  
  return triggers;
}

/**
 * 检查技术更新需求
 */
function checkTechUpdate() {
  const triggers = [];
  
  try {
    // 检查技能清单中的技术是否有更新版本
    if (fs.existsSync(EVOLUTION_STATE)) {
      const state = JSON.parse(fs.readFileSync(EVOLUTION_STATE, 'utf8'));
      const skills = state.skills || [];
      
      // 这里可以集成 npm outdated 或类似检查
      // 简化版本：检查技能最后更新时间是否超过 3 个月
      const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      
      skills.forEach(skill => {
        if (skill.learnedAt && new Date(skill.learnedAt).getTime() < threeMonthsAgo) {
          triggers.push({
            type: TRIGGER_TYPES.TECH_UPDATE,
            skill: skill.name,
            learnedAt: skill.learnedAt,
            detectedAt: new Date().toISOString(),
            reason: `技能 "${skill.name}" 已学习超过 3 个月，建议复习或更新`
          });
        }
      });
    }
  } catch (err) {
    console.error('检查技术更新时出错:', err.message);
  }
  
  return triggers;
}

/**
 * 检查效率瓶颈
 */
function checkEfficiencyBottleneck() {
  const triggers = [];
  
  try {
    // 检查是否有重复执行的手动任务
    // 简化版本：检查 cron 任务执行频率
    const cronLog = path.join(WORKSPACE, 'memory/cron-executions.json');
    if (fs.existsSync(cronLog)) {
      const executions = JSON.parse(fs.readFileSync(cronLog, 'utf8'));
      
      // 统计最近 7 天的执行次数
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentExecutions = executions.filter(e => new Date(e.timestamp).getTime() > sevenDaysAgo);
      
      // 如果同一任务执行超过 10 次，建议自动化
      const taskCounts = {};
      recentExecutions.forEach(e => {
        taskCounts[e.task] = (taskCounts[e.task] || 0) + 1;
      });
      
      Object.entries(taskCounts).forEach(([task, count]) => {
        if (count > 10) {
          triggers.push({
            type: TRIGGER_TYPES.EFFICIENCY_BOTTLENECK,
            task: task,
            executionCount: count,
            detectedAt: new Date().toISOString(),
            reason: `任务 "${task}" 在 7 天内执行${count}次，建议自动化`
          });
        }
      });
    }
  } catch (err) {
    console.error('检查效率瓶颈时出错:', err.message);
  }
  
  return triggers;
}

/**
 * 检测所有触发条件
 */
function detectTriggers() {
  console.log('🔍 检测进化触发条件...');
  console.log('=' .repeat(50));
  
  const allTriggers = [
    ...checkLowScore(),
    ...checkNewProject(),
    ...checkTechUpdate(),
    ...checkEfficiencyBottleneck()
  ];
  
  // 按优先级排序
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allTriggers.sort((a, b) => priorityOrder[a.type.priority] - priorityOrder[b.type.priority]);
  
  console.log(`检测到 ${allTriggers.length} 个进化触发条件:`);
  console.log('');
  
  allTriggers.forEach((trigger, index) => {
    console.log(`${index + 1}. ${trigger.type.name} [${trigger.type.priority.toUpperCase()}]`);
    console.log(`   原因：${trigger.reason}`);
    console.log(`   时间：${trigger.detectedAt}`);
    console.log('');
  });
  
  // 保存触发记录
  saveTriggers(allTriggers);
  
  return allTriggers;
}

/**
 * 保存触发记录
 */
function saveTriggers(triggers) {
  try {
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    let allTriggers = [];
    if (fs.existsSync(TRIGGER_LOG)) {
      allTriggers = JSON.parse(fs.readFileSync(TRIGGER_LOG, 'utf8'));
    }
    
    // 添加新触发记录
    triggers.forEach(trigger => {
      allTriggers.push({
        ...trigger,
        status: 'pending',
        id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    });
    
    // 保留最近 200 条记录
    allTriggers = allTriggers.slice(-200);
    
    fs.writeFileSync(TRIGGER_LOG, JSON.stringify(allTriggers, null, 2));
  } catch (err) {
    console.error('保存触发记录失败:', err.message);
  }
}

/**
 * 获取待处理的触发器
 */
function getPendingTriggers() {
  try {
    if (fs.existsSync(TRIGGER_LOG)) {
      const allTriggers = JSON.parse(fs.readFileSync(TRIGGER_LOG, 'utf8'));
      return allTriggers.filter(t => t.status === 'pending');
    }
  } catch (err) {
    console.error('读取触发记录失败:', err.message);
  }
  return [];
}

/**
 * 标记触发器为已完成
 */
function markTriggerComplete(triggerId) {
  try {
    if (fs.existsSync(TRIGGER_LOG)) {
      const allTriggers = JSON.parse(fs.readFileSync(TRIGGER_LOG, 'utf8'));
      const trigger = allTriggers.find(t => t.id === triggerId);
      
      if (trigger) {
        trigger.status = 'completed';
        trigger.completedAt = new Date().toISOString();
        fs.writeFileSync(TRIGGER_LOG, JSON.stringify(allTriggers, null, 2));
        return true;
      }
    }
  } catch (err) {
    console.error('更新触发器状态失败:', err.message);
  }
  return false;
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--pending')) {
    const pending = getPendingTriggers();
    console.log(JSON.stringify(pending, null, 2));
  } else if (args.includes('--complete') && args[1]) {
    const success = markTriggerComplete(args[1]);
    console.log(JSON.stringify({ success }));
  } else {
    detectTriggers();
  }
}

module.exports = { detectTriggers, getPendingTriggers, markTriggerComplete, TRIGGER_TYPES };
