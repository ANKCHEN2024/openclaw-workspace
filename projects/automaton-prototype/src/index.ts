/**
 * Automaton Prototype - 简化版 AI Agent
 * 
 * 基础生存机制原型开发 Phase 1
 * 
 * 核心功能：
 * 1. Agent 核心循环（Think → Act → Observe → Repeat）
 * 2. 虚拟钱包系统（模拟余额，无需真实区块链）
 * 3. 生存状态监控（normal/low_compute/critical/dead）
 * 4. 简单任务执行能力（API 调用、文件操作）
 * 5. 成本追踪和"死亡"判定
 */

import { Agent } from './core/Agent';
import { Config } from './config/Config';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import * as dotenv from 'dotenv';
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Automaton Prototype - AI Agent 生存机制原型           ║');
  console.log('║     Phase 1: 基础生存机制                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 获取配置
  const config = Config.getInstance();
  const agentName = config.get('agentName');
  const initialBalance = config.get('initialBalance');

  console.log('📋 配置信息:');
  console.log(`  Agent 名称：${agentName}`);
  console.log(`  初始余额：${initialBalance}`);
  console.log(`  Tick 间隔：${config.get('tickIntervalMs')}ms`);
  console.log(`  低算力阈值：${config.get('lowComputeThreshold')}`);
  console.log(`  临界阈值：${config.get('criticalThreshold')}`);
  console.log(`  死亡阈值：${config.get('deadThreshold')}`);
  console.log('');

  // 创建 Agent
  const agentId = `agent_${Date.now()}`;
  const agent = new Agent(agentId, agentName, initialBalance);

  // 添加一些初始任务
  agent.addTask({
    id: 'init_task_1',
    type: 'file_write',
    description: '创建初始日志目录',
    parameters: {
      filePath: './logs/initialization.log',
      content: `Agent ${agentName} 初始化日志 - ${new Date().toISOString()}\n`
    },
    priority: 10,
    createdAt: Date.now()
  });

  agent.addTask({
    id: 'init_task_2',
    type: 'file_write',
    description: '创建配置文件备份',
    parameters: {
      filePath: './logs/config_backup.json',
      content: JSON.stringify(config.getAll(), null, 2)
    },
    priority: 8,
    createdAt: Date.now()
  });

  // 优雅退出处理
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  收到中断信号，正在停止 Agent...');
    agent.stop();
    agent.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⚠️  收到终止信号，正在停止 Agent...');
    agent.stop();
    agent.destroy();
    process.exit(0);
  });

  // 启动 Agent
  console.log('\n🚀 启动 Agent 核心循环...\n');
  agent.start();

  // 演示：运行 30 秒后自动停止（用于测试）
  // 实际使用时可以注释掉这行，让 Agent 持续运行
  setTimeout(() => {
    console.log('\n\n⏰ 演示时间到，自动停止 Agent...');
    agent.stop();
    
    // 输出最终报告
    console.log('\n\n📊 ════════════ 最终报告 ════════════');
    const state = agent.getState();
    if (state) {
      console.log(`Agent: ${state.name}`);
      console.log(`最终状态：${state.survivalState}`);
      console.log(`最终余额：${state.balance}`);
      console.log(`总思考次数：${state.totalThoughts}`);
      console.log(`总行动次数：${state.totalActions}`);
      console.log(`总观察次数：${state.totalObservations}`);
      console.log(`总花费：${agent.getBalance() < initialBalance ? initialBalance - agent.getBalance() : 0}`);
      
      console.log('\n💰 花费明细:');
      const spending = agent.getBalance() < initialBalance ? 
        (initialBalance - agent.getBalance()) : 0;
      console.log(`  总消耗：${spending}`);
    }
    console.log('═══════════════════════════════════════\n');
    
    agent.destroy();
    process.exit(0);
  }, 30000); // 30 秒演示
}

// 运行主程序
main().catch(error => {
  console.error('❌ 程序运行出错:', error);
  process.exit(1);
});
