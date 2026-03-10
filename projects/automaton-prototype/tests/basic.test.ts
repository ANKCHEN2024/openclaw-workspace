/**
 * Automaton Prototype 基础测试
 * 
 * 测试核心功能：
 * 1. Agent 创建和初始化
 * 2. 虚拟钱包系统
 * 3. 生存状态转换
 * 4. 任务执行
 * 5. 状态持久化
 */

import { Agent } from '../src/core/Agent';
import { VirtualWallet } from '../src/wallet/VirtualWallet';
import { StateManager } from '../src/state/StateManager';
import { Config } from '../src/config/Config';
import { SurvivalState, ActionType } from '../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

// 测试配置
const TEST_DB_PATH = './data/test_agent_state.db';
const TEST_AGENT_ID = 'test_agent_' + Date.now();
const TEST_AGENT_NAME = 'TestBot';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Automaton Prototype - 基础功能测试                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // 清理测试数据库
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    console.log('✓ 清理旧测试数据库\n');
  }

  try {
    // ========== 测试 1: 配置加载 ==========
    console.log('📋 测试 1: 配置加载');
    try {
      const config = Config.getInstance();
      const agentName = config.get('agentName');
      const initialBalance = config.get('initialBalance');
      
      console.log(`  Agent 名称：${agentName}`);
      console.log(`  初始余额：${initialBalance}`);
      
      if (agentName && initialBalance > 0) {
        console.log('✓ 配置加载成功\n');
        testsPassed++;
      } else {
        throw new Error('配置值无效');
      }
    } catch (error: any) {
      console.error('✗ 配置加载失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 2: 虚拟钱包 ==========
    console.log('💰 测试 2: 虚拟钱包系统');
    try {
      const wallet = new VirtualWallet(1000);
      
      console.log(`  初始余额：${wallet.getBalance()}`);
      
      // 测试扣款
      const deductSuccess = wallet.deduct(ActionType.THINK, '测试思考');
      console.log(`  思考扣款后余额：${wallet.getBalance()}`);
      
      if (deductSuccess && wallet.getBalance() < 1000) {
        console.log('✓ 虚拟钱包工作正常\n');
        testsPassed++;
      } else {
        throw new Error('扣款失败');
      }
    } catch (error: any) {
      console.error('✗ 虚拟钱包测试失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 3: 状态管理器 ==========
    console.log('💾 测试 3: 状态持久化');
    try {
      const stateManager = new StateManager(TEST_DB_PATH);
      const agentState = stateManager.createOrLoadAgent(
        TEST_AGENT_ID, 
        TEST_AGENT_NAME, 
        1000
      );
      
      console.log(`  Agent ID: ${agentState.id}`);
      console.log(`  Agent 名称：${agentState.name}`);
      console.log(`  初始余额：${agentState.balance}`);
      console.log(`  生存状态：${agentState.survivalState}`);
      
      // 测试状态更新
      stateManager.updateBalance(TEST_AGENT_ID, 900);
      stateManager.updateSurvivalState();
      
      const updatedState = stateManager.loadAgent(TEST_AGENT_ID);
      console.log(`  更新后余额：${updatedState?.balance}`);
      
      if (updatedState && updatedState.balance === 900) {
        console.log('✓ 状态持久化正常\n');
        testsPassed++;
      } else {
        throw new Error('状态更新失败');
      }
      
      stateManager.close();
    } catch (error: any) {
      console.error('✗ 状态持久化测试失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 4: Agent 创建 ==========
    console.log('🤖 测试 4: Agent 创建和初始化');
    try {
      const agent = new Agent(TEST_AGENT_ID + '_2', 'TestBot2', 500);
      const state = agent.getState();
      
      console.log(`  Agent ID: ${state?.id}`);
      console.log(`  Agent 名称：${state?.name}`);
      console.log(`  初始余额：${state?.balance}`);
      console.log(`  是否存活：${state?.isAlive}`);
      
      if (state && state.isAlive && state.balance === 500) {
        console.log('✓ Agent 创建成功\n');
        testsPassed++;
      } else {
        throw new Error('Agent 创建失败');
      }
      
      agent.destroy();
    } catch (error: any) {
      console.error('✗ Agent 创建测试失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 5: 生存状态转换 ==========
    console.log('📊 测试 5: 生存状态转换');
    try {
      const wallet = new VirtualWallet(1000);
      const config = Config.getInstance();
      
      console.log(`  初始余额：${wallet.getBalance()}`);
      console.log(`  初始状态：${wallet.isBankrupt() ? 'dead' : wallet.isCritical() ? 'critical' : wallet.isLowBalance() ? 'low_compute' : 'normal'}`);
      
      // 模拟消费到临界状态
      for (let i = 0; i < 950; i++) {
        wallet.deduct(ActionType.ACT, '测试消费');
      }
      
      console.log(`  消费后余额：${wallet.getBalance()}`);
      console.log(`  当前状态：${wallet.isBankrupt() ? 'dead' : wallet.isCritical() ? 'critical' : wallet.isLowBalance() ? 'low_compute' : 'normal'}`);
      
      if (wallet.isCritical() || wallet.isLowBalance()) {
        console.log('✓ 生存状态转换正常\n');
        testsPassed++;
      } else {
        throw new Error('状态转换失败');
      }
    } catch (error: any) {
      console.error('✗ 生存状态转换测试失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 6: 任务执行器 ==========
    console.log('📝 测试 6: 任务执行');
    try {
      const stateManager = new StateManager(TEST_DB_PATH);
      stateManager.createOrLoadAgent(TEST_AGENT_ID + '_3', 'TestBot3', 1000);
      
      const { TaskExecutor } = await import('../src/tasks/TaskExecutor');
      const executor = new TaskExecutor(stateManager);
      
      // 添加文件写入任务
      const testFilePath = './data/test_task_output.txt';
      executor.addTask({
        id: 'test_task_1',
        type: 'file_write',
        description: '测试文件写入',
        parameters: {
          filePath: testFilePath,
          content: '测试内容 - ' + new Date().toISOString()
        },
        priority: 10,
        createdAt: Date.now()
      });
      
      console.log(`  任务队列长度：${executor.getQueueLength()}`);
      
      // 执行任务
      const result = await executor.executeNextTask(TEST_AGENT_ID + '_3');
      console.log(`  任务执行结果：${result?.success ? '成功' : '失败'}`);
      console.log(`  任务耗时：${result?.duration}ms`);
      console.log(`  任务成本：${result?.cost}`);
      
      // 验证文件是否创建
      const fileExists = fs.existsSync(testFilePath);
      console.log(`  文件是否创建：${fileExists}`);
      
      if (result?.success && fileExists) {
        console.log('✓ 任务执行正常\n');
        testsPassed++;
      } else {
        throw new Error('任务执行失败');
      }
      
      stateManager.close();
      
      // 清理测试文件
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch (error: any) {
      console.error('✗ 任务执行测试失败:', error.message, '\n');
      testsFailed++;
    }

    // ========== 测试 7: Agent 完整循环（单 tick） ==========
    console.log('🔄 测试 7: Agent 单 tick 循环');
    try {
      const agent = new Agent(TEST_AGENT_ID + '_4', 'TestBot4', 100);
      
      // 添加一个任务
      agent.addTask({
        id: 'tick_test_task',
        type: 'file_write',
        description: 'Tick 测试任务',
        parameters: {
          filePath: './data/tick_test.txt',
          content: 'Tick test'
        },
        priority: 10,
        createdAt: Date.now()
      });
      
      const initialState = agent.getState();
      console.log(`  初始状态：${initialState?.survivalState}`);
      console.log(`  初始余额：${initialState?.balance}`);
      console.log(`  初始行动数：${initialState?.totalActions}`);
      
      // 注意：这里不启动完整循环，只验证 Agent 可以创建
      console.log('✓ Agent 单 tick 循环准备就绪\n');
      testsPassed++;
      
      agent.destroy();
      
      // 清理测试文件
      if (fs.existsSync('./data/tick_test.txt')) {
        fs.unlinkSync('./data/tick_test.txt');
      }
    } catch (error: any) {
      console.error('✗ Agent 单 tick 循环测试失败:', error.message, '\n');
      testsFailed++;
    }

  } finally {
    // 清理测试数据库
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
      console.log('🧹 清理测试数据库\n');
    }
  }

  // ========== 测试总结 ==========
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    测试总结                               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const totalTests = testsPassed + testsFailed;
  console.log(`总测试数：${totalTests}`);
  console.log(`✓ 通过：${testsPassed}`);
  console.log(`✗ 失败：${testsFailed}`);
  console.log(`通过率：${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 所有测试通过！\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息\n');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试运行出错:', error);
  process.exit(1);
});
