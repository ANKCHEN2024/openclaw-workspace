#!/usr/bin/env node
/**
 * 学习进度追踪脚本
 * 
 * 功能：
 * 1. 记录每日学习时长
 * 2. 追踪技能掌握进度
 * 3. 生成每周学习报告
 * 4. 更新能力清单
 */

const fs = require('fs').promises;
const path = require('path');

// ==================== 配置 ====================

const CONFIG = {
  workspacePath: '/Users/chenggl/workspace',
  progressLogPath: '/Users/chenggl/workspace/training/learning-progress-log.json',
  weeklyReportPath: '/Users/chenggl/workspace/training/weekly-learning-report.md',
  capabilityInventoryPath: '/Users/chenggl/workspace/capability-inventory.md',
  dashboardDataPath: '/Users/chenggl/workspace/dashboard/public/data/learning-progress.json'
};

// ==================== 学习进度追踪器 ====================

class LearningProgressTracker {
  constructor() {
    this.progressData = {
      sessions: [],        // 学习会话记录
      skills: {},          // 技能进度
      weeklyStats: {},     // 每周统计
      lastUpdated: null
    };
  }
  
  /**
   * 加载现有进度数据
   */
  async loadProgressData() {
    try {
      const content = await fs.readFile(CONFIG.progressLogPath, 'utf-8');
      this.progressData = JSON.parse(content);
      console.log('✅ 已加载进度数据');
    } catch (error) {
      console.log('📝 创建新的进度数据文件');
      this.progressData = {
        sessions: [],
        skills: {},
        weeklyStats: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * 保存进度数据
   */
  async saveProgressData() {
    this.progressData.lastUpdated = new Date().toISOString();
    await fs.writeFile(CONFIG.progressLogPath, JSON.stringify(this.progressData, null, 2), 'utf-8');
    console.log('✅ 进度数据已保存');
  }
  
  /**
   * 记录学习会话
   */
  async logSession(skillName, durationMinutes, notes = '') {
    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      skill: skillName,
      duration: durationMinutes,
      notes: notes
    };
    
    this.progressData.sessions.push(session);
    
    // 更新技能进度
    if (!this.progressData.skills[skillName]) {
      this.progressData.skills[skillName] = {
        totalMinutes: 0,
        sessions: 0,
        startDate: session.date,
        lastPracticed: session.date
      };
    }
    
    this.progressData.skills[skillName].totalMinutes += durationMinutes;
    this.progressData.skills[skillName].sessions += 1;
    this.progressData.skills[skillName].lastPracticed = session.date;
    
    // 更新每周统计
    const weekKey = this.getWeekKey(new Date());
    if (!this.progressData.weeklyStats[weekKey]) {
      this.progressData.weeklyStats[weekKey] = {
        totalMinutes: 0,
        sessions: 0,
        skills: {}
      };
    }
    
    this.progressData.weeklyStats[weekKey].totalMinutes += durationMinutes;
    this.progressData.weeklyStats[weekKey].sessions += 1;
    
    if (!this.progressData.weeklyStats[weekKey].skills[skillName]) {
      this.progressData.weeklyStats[weekKey].skills[skillName] = 0;
    }
    this.progressData.weeklyStats[weekKey].skills[skillName] += durationMinutes;
    
    await this.saveProgressData();
    
    console.log(`✅ 记录学习会话：${skillName} - ${durationMinutes}分钟`);
    return session;
  }
  
  /**
   * 获取技能进度
   */
  getSkillProgress(skillName) {
    const skill = this.progressData.skills[skillName];
    if (!skill) return null;
    
    const totalHours = (skill.totalMinutes / 60).toFixed(1);
    const sessions = skill.sessions;
    const avgSession = (skill.totalMinutes / sessions).toFixed(0);
    
    return {
      skill: skillName,
      totalHours,
      sessions,
      avgSessionMinutes: avgSession,
      startDate: skill.startDate,
      lastPracticed: skill.lastPracticed
    };
  }
  
  /**
   * 获取每周统计
   */
  getWeeklyStats(weekKey) {
    return this.progressData.weeklyStats[weekKey] || null;
  }
  
  /**
   * 获取最近 N 周的统计
   */
  getRecentWeeksStats(weeks = 4) {
    const keys = Object.keys(this.progressData.weeklyStats).sort().slice(-weeks);
    return keys.map(key => ({
      week: key,
      ...this.progressData.weeklyStats[key]
    }));
  }
  
  /**
   * 生成每周学习报告
   */
  async generateWeeklyReport() {
    const now = new Date();
    const weekKey = this.getWeekKey(now);
    const weekStats = this.getWeeklyStats(weekKey);
    const recentWeeks = this.getRecentWeeksStats(4);
    
    let report = `# 每周学习报告\n\n`;
    report += `> 生成时间：${now.toISOString().slice(0, 10)}\n`;
    report += `> 周次：${weekKey}\n\n`;
    
    report += `## 📊 本周概览\n\n`;
    
    if (weekStats) {
      const hours = (weekStats.totalMinutes / 60).toFixed(1);
      report += `- **学习时长**：${hours} 小时（${weekStats.totalMinutes} 分钟）\n`;
      report += `- **学习次数**：${weekStats.sessions} 次\n`;
      report += `- **涉及技能**：${Object.keys(weekStats.skills).length} 个\n\n`;
      
      report += `### 技能分布\n\n`;
      report += `| 技能 | 时长（分钟） | 占比 |\n`;
      report += `|------|-------------|------|\n`;
      
      for (const [skill, minutes] of Object.entries(weekStats.skills)) {
        const percentage = ((minutes / weekStats.totalMinutes) * 100).toFixed(1);
        report += `| ${skill} | ${minutes} | ${percentage}% |\n`;
      }
    } else {
      report += `本周暂无学习记录\n\n`;
    }
    
    report += `\n## 📈 近 4 周趋势\n\n`;
    report += `| 周次 | 总时长（小时） | 学习次数 | 技能数 |\n`;
    report += `|------|---------------|----------|--------|\n`;
    
    for (const week of recentWeeks) {
      const hours = (week.totalMinutes / 60).toFixed(1);
      report += `| ${week.week} | ${hours} | ${week.sessions} | ${Object.keys(week.skills).length} |\n`;
    }
    
    report += `\n## 🎯 累计成就\n\n`;
    report += `- **总学习时长**：${(this.getTotalMinutes() / 60).toFixed(1)} 小时\n`;
    report += `- **总学习次数**：${this.progressData.sessions.length} 次\n`;
    report += `- **涉及技能**：${Object.keys(this.progressData.skills).length} 个\n`;
    report += `- **连续学习天数**：${this.getStreakDays()} 天\n\n`;
    
    report += `## 💡 学习建议\n\n`;
    report += this.generateRecommendations();
    
    // 保存报告
    await fs.writeFile(CONFIG.weeklyReportPath, report, 'utf-8');
    console.log(`✅ 每周报告已保存：${CONFIG.weeklyReportPath}`);
    
    return report;
  }
  
  /**
   * 更新能力清单
   */
  async updateCapabilityInventory() {
    console.log('🔄 更新能力清单...');
    
    try {
      let content = await fs.readFile(CONFIG.capabilityInventoryPath, 'utf-8');
      
      // 更新历史数据部分
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const totalHours = (this.getTotalMinutes() / 60).toFixed(1);
      
      // 查找并更新历史数据表格
      const lines = content.split('\n');
      const newLines = [];
      let inHistoryTable = false;
      let historyTableUpdated = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('| 日期 | 综合评分 | 关键事件 |')) {
          inHistoryTable = true;
          newLines.push(line);
          continue;
        }
        
        if (inHistoryTable && line.trim().startsWith('|---')) {
          // 在分隔符后添加新记录
          if (!historyTableUpdated) {
            newLines.push(`| ${dateStr} | 3.3/5 | 学习${totalHours}小时 |`);
            historyTableUpdated = true;
          }
          inHistoryTable = false;
        }
        
        newLines.push(line);
      }
      
      // 如果没有找到表格，在末尾添加
      if (!historyTableUpdated) {
        newLines.push(`\n### 最新记录\n| ${dateStr} | 3.3/5 | 学习${totalHours}小时 |\n`);
      }
      
      await fs.writeFile(CONFIG.capabilityInventoryPath, newLines.join('\n'), 'utf-8');
      console.log('✅ 能力清单已更新');
      
    } catch (error) {
      console.error('❌ 更新能力清单失败:', error.message);
    }
  }
  
  /**
   * 生成 Dashboard 数据
   */
  async generateDashboardData() {
    const dashboardData = {
      lastUpdated: new Date().toISOString(),
      totalSkillsLearned: Object.keys(this.progressData.skills).length,
      totalLearningHours: (this.getTotalMinutes() / 60).toFixed(1),
      weeklyStats: this.getRecentWeeksStats(4),
      currentStreak: this.getStreakDays(),
      topSkills: this.getTopSkills(5),
      nextRecommendedSkill: this.getNextRecommendedSkill()
    };
    
    // 确保目录存在
    const dir = path.dirname(CONFIG.dashboardDataPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(CONFIG.dashboardDataPath, JSON.stringify(dashboardData, null, 2), 'utf-8');
    console.log(`✅ Dashboard 数据已生成：${CONFIG.dashboardDataPath}`);
    
    return dashboardData;
  }
  
  /**
   * 辅助函数
   */
  getWeekKey(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }
  
  getTotalMinutes() {
    return this.progressData.sessions.reduce((sum, s) => sum + s.duration, 0);
  }
  
  getStreakDays() {
    if (this.progressData.sessions.length === 0) return 0;
    
    const dates = [...new Set(this.progressData.sessions.map(s => s.date.slice(0, 10)))]
      .sort()
      .reverse();
    
    let streak = 1;
    const today = new Date().toISOString().slice(0, 10);
    
    if (dates[0] !== today) {
      // 如果今天没有学习，检查昨天
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (dates[0] !== yesterday) return 0;
    }
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
  
  getTopSkills(limit = 5) {
    return Object.entries(this.progressData.skills)
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .slice(0, limit)
      .map(([name, data]) => ({
        name,
        hours: (data.totalMinutes / 60).toFixed(1),
        sessions: data.sessions
      }));
  }
  
  getNextRecommendedSkill() {
    // 简单实现：返回学习时间最少的技能
    const skills = Object.keys(this.progressData.skills);
    if (skills.length === 0) return 'FFmpeg 视频处理';
    
    const minSkill = skills.reduce((min, name) => {
      return this.progressData.skills[name].totalMinutes < this.progressData.skills[min].totalMinutes 
        ? name 
        : min;
    });
    
    return minSkill;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    const totalHours = this.getTotalMinutes() / 60;
    if (totalHours < 10) {
      recommendations.push('- 💪 增加学习时长，建议每周至少 10 小时');
    }
    
    const skillCount = Object.keys(this.progressData.skills).length;
    if (skillCount < 3) {
      recommendations.push('- 🎯 拓展学习范围，当前技能较少');
    }
    
    const streak = this.getStreakDays();
    if (streak < 3) {
      recommendations.push('- 🔥 建立学习习惯，保持连续性');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- ✅ 学习状态良好，继续保持！');
    }
    
    return recommendations.join('\n') + '\n';
  }
  
  /**
   * 运行完整流程
   */
  async run() {
    console.log('🚀 开始追踪学习进度...\n');
    
    await this.loadProgressData();
    
    // 生成每周报告
    await this.generateWeeklyReport();
    
    // 更新能力清单
    await this.updateCapabilityInventory();
    
    // 生成 Dashboard 数据
    const dashboardData = await this.generateDashboardData();
    
    console.log('\n🎉 学习进度追踪完成！\n');
    console.log('📊 数据摘要:');
    console.log(`   - 总学习时长：${dashboardData.totalLearningHours} 小时`);
    console.log(`   - 涉及技能：${dashboardData.totalSkillsLearned} 个`);
    console.log(`   - 连续学习：${dashboardData.currentStreak} 天`);
    console.log(`   - 下一个推荐：${dashboardData.nextRecommendedSkill}`);
    
    return dashboardData;
  }
}

// ==================== CLI 命令 ====================

async function main() {
  const args = process.argv.slice(2);
  const tracker = new LearningProgressTracker();
  
  if (args.length === 0) {
    // 默认：运行完整流程
    await tracker.run();
  } else if (args[0] === 'log') {
    // log <skill> <minutes> [notes]
    const skill = args[1];
    const minutes = parseInt(args[2]) || 30;
    const notes = args.slice(3).join(' ');
    
    await tracker.loadProgressData();
    await tracker.logSession(skill, minutes, notes);
  } else if (args[0] === 'report') {
    // report
    await tracker.loadProgressData();
    await tracker.generateWeeklyReport();
  } else if (args[0] === 'dashboard') {
    // dashboard
    await tracker.loadProgressData();
    await tracker.generateDashboardData();
  } else if (args[0] === 'status') {
    // status [skill]
    await tracker.loadProgressData();
    
    if (args[1]) {
      const progress = tracker.getSkillProgress(args[1]);
      if (progress) {
        console.log(`📊 ${progress.skill}:`);
        console.log(`   总时长：${progress.totalHours} 小时`);
        console.log(`   学习次数：${progress.sessions}`);
        console.log(`   平均每次：${progress.avgSessionMinutes} 分钟`);
      } else {
        console.log(`暂无 ${args[1]} 的学习记录`);
      }
    } else {
      console.log(`📊 总学习时长：${(tracker.getTotalMinutes() / 60).toFixed(1)} 小时`);
      console.log(`📊 涉及技能：${Object.keys(tracker.progressData.skills).length} 个`);
      console.log(`🔥 连续学习：${tracker.getStreakDays()} 天`);
    }
  } else {
    console.log('用法:');
    console.log('  node track-learning-progress.js              # 运行完整流程');
    console.log('  node track-learning-progress.js log <skill> <minutes> [notes]');
    console.log('  node track-learning-progress.js report       # 生成每周报告');
    console.log('  node track-learning-progress.js dashboard    # 生成 Dashboard 数据');
    console.log('  node track-learning-progress.js status [skill]');
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LearningProgressTracker, CONFIG };
