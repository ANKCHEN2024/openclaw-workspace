#!/usr/bin/env node
/**
 * 进化系统测试脚本
 * 验证所有组件是否正常工作
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/chenggl/workspace';

console.log('🧪 MOSS 自动进化系统 - 组件测试');
console.log('=' .repeat(60));
console.log('');

const tests = [];

// 测试 1: 检查脚本文件是否存在
console.log('📁 测试 1: 检查脚本文件');
const scripts = [
  'scripts/self-assessment.js',
  'scripts/trigger-evolution.js',
  'scripts/auto-evolution-loop.sh',
  'scripts/validate-evolution.js'
];

scripts.forEach(script => {
  const scriptPath = path.join(WORKSPACE, script);
  const exists = fs.existsSync(scriptPath);
  tests.push({
    name: script,
    passed: exists,
    type: 'file_check'
  });
  console.log(`   ${exists ? '✅' : '❌'} ${script}`);
});
console.log('');

// 测试 2: 检查数据文件
console.log('📊 测试 2: 检查数据文件');
const dataFiles = [
  'EVOLUTION_STATE.json',
  'memory/assessments.json',
  'memory/evolution-triggers.json',
  'memory/evolution-validations.json'
];

dataFiles.forEach(file => {
  const filePath = path.join(WORKSPACE, file);
  const exists = fs.existsSync(filePath);
  tests.push({
    name: file,
    passed: exists,
    type: 'data_check'
  });
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});
console.log('');

// 测试 3: 检查 Dashboard 组件
console.log('🖥️  测试 3: 检查 Dashboard 组件');
const dashboardFiles = [
  'workspace-dashboard/backend/src/services/evolutionService.js',
  'workspace-dashboard/backend/src/routes/evolution.js',
  'workspace-dashboard/frontend/src/views/EvolutionTracking.vue',
  'workspace-dashboard/frontend/src/api/evolution.js'
];

dashboardFiles.forEach(file => {
  const filePath = path.join(WORKSPACE, file);
  const exists = fs.existsSync(filePath);
  tests.push({
    name: file,
    passed: exists,
    type: 'dashboard_check'
  });
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});
console.log('');

// 测试 4: 检查文档
console.log('📚 测试 4: 检查文档');
const docs = [
  'auto-evolution-guide.md'
];

docs.forEach(doc => {
  const docPath = path.join(WORKSPACE, doc);
  const exists = fs.existsSync(docPath);
  tests.push({
    name: doc,
    passed: exists,
    type: 'doc_check'
  });
  console.log(`   ${exists ? '✅' : '❌'} ${doc}`);
});
console.log('');

// 测试 5: 检查 SOUL.md 进化日志
console.log('📝 测试 5: 检查 SOUL.md 进化日志');
const soulPath = path.join(WORKSPACE, 'SOUL.md');
if (fs.existsSync(soulPath)) {
  const content = fs.readFileSync(soulPath, 'utf8');
  const hasEvolutionLog = content.includes('自动进化') || content.includes('进化日志');
  tests.push({
    name: 'SOUL.md 进化日志',
    passed: hasEvolutionLog,
    type: 'soul_check'
  });
  console.log(`   ${hasEvolutionLog ? '✅' : '❌'} SOUL.md 包含进化日志`);
} else {
  tests.push({
    name: 'SOUL.md',
    passed: false,
    type: 'soul_check'
  });
  console.log('   ❌ SOUL.md 不存在');
}
console.log('');

// 测试 6: 验证评估数据
console.log('📈 测试 6: 验证评估数据');
const assessmentPath = path.join(WORKSPACE, 'memory/assessments.json');
if (fs.existsSync(assessmentPath)) {
  try {
    const assessments = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
    const hasData = assessments.length > 0;
    const hasDimensions = hasData && assessments[0].dimensions;
    
    tests.push({
      name: '评估记录存在',
      passed: hasData,
      type: 'data_validation'
    });
    console.log(`   ${hasData ? '✅' : '❌'} 评估记录：${assessments.length}条`);
    
    if (hasDimensions) {
      const dimCount = Object.keys(assessments[0].dimensions).length;
      tests.push({
        name: '评估维度完整',
        passed: dimCount === 5,
        type: 'data_validation'
      });
      console.log(`   ${dimCount === 5 ? '✅' : '⚠️'} 评估维度：${dimCount}个`);
    }
  } catch (err) {
    tests.push({
      name: '评估数据解析',
      passed: false,
      type: 'data_validation'
    });
    console.log(`   ❌ 评估数据解析失败：${err.message}`);
  }
} else {
  tests.push({
    name: '评估文件',
    passed: false,
    type: 'data_validation'
  });
  console.log('   ❌ 评估文件不存在');
}
console.log('');

// 测试 7: 验证状态文件
console.log('🔄 测试 7: 验证进化状态');
const statePath = path.join(WORKSPACE, 'EVOLUTION_STATE.json');
if (fs.existsSync(statePath)) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const hasEvolutionCount = state.evolutionCount > 0;
    const hasSkills = state.skills && state.skills.length > 0;
    
    tests.push({
      name: '进化计数',
      passed: hasEvolutionCount,
      type: 'state_validation'
    });
    console.log(`   ${hasEvolutionCount ? '✅' : '❌'} 进化次数：${state.evolutionCount || 0}`);
    
    tests.push({
      name: '技能清单',
      passed: hasSkills,
      type: 'state_validation'
    });
    console.log(`   ${hasSkills ? '✅' : '⚠️'} 技能数量：${state.skills?.length || 0}`);
  } catch (err) {
    tests.push({
      name: '状态文件解析',
      passed: false,
      type: 'state_validation'
    });
    console.log(`   ❌ 状态文件解析失败：${err.message}`);
  }
} else {
  tests.push({
    name: '状态文件',
    passed: false,
    type: 'state_validation'
  });
  console.log('   ❌ 状态文件不存在');
}
console.log('');

// 总结
console.log('=' .repeat(60));
const passed = tests.filter(t => t.passed).length;
const total = tests.length;
const successRate = Math.round((passed / total) * 100);

console.log(`📊 测试结果：${passed}/${total} 通过 (${successRate}%)`);
console.log('');

if (successRate === 100) {
  console.log('🎉 所有测试通过！自动进化系统已就绪！');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   1. 访问 Dashboard: http://localhost:3000/evolution-tracking');
  console.log('   2. 配置 cron 定时任务（可选）:');
  console.log('      crontab -e');
  console.log('      0 2 * * 0 bash /Users/chenggl/workspace/scripts/auto-evolution-loop.sh');
  console.log('   3. 手动执行进化循环:');
  console.log('      bash /Users/chenggl/workspace/scripts/auto-evolution-loop.sh');
} else {
  console.log('⚠️  部分测试未通过，请检查上述失败项');
  console.log('');
  console.log('🔧 修复建议:');
  tests.filter(t => !t.passed).forEach(t => {
    console.log(`   - ${t.name}`);
  });
}

console.log('');
console.log('📄 详细文档：/Users/chenggl/workspace/auto-evolution-guide.md');
console.log('');

// 输出 JSON 结果
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    passed,
    total,
    successRate,
    tests
  }, null, 2));
}

process.exit(passed === total ? 0 : 1);
