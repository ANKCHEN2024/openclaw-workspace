import { VirtualWallet } from '../wallet/VirtualWallet';
import { StateManager } from '../state/StateManager';
import { TaskExecutor, Task } from '../tasks/TaskExecutor';
import { Config } from '../config/Config';
import { SurvivalState, ActionType, Decision, AgentState, Observation } from './types';

/**
 * Agent 核心类
 * 实现 Think → Act → Observe → Repeat 循环
 */
export class Agent {
  public readonly id: string;
  public readonly name: string;
  
  private wallet: VirtualWallet;
  private stateManager: StateManager;
  private taskExecutor: TaskExecutor;
  private config: Config;
  
  private isRunning: boolean = false;
  private currentTick: number = 0;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor(id: string, name: string, initialBalance?: number) {
    this.id = id;
    this.name = name;
    this.config = Config.getInstance();
    
    // 初始化组件
    this.wallet = new VirtualWallet(initialBalance);
    this.stateManager = new StateManager();
    this.taskExecutor = new TaskExecutor(this.stateManager);
    
    // 创建或加载 Agent 状态
    const balanceToUse = initialBalance ?? this.config.get('initialBalance');
    this.stateManager.createOrLoadAgent(id, name, balanceToUse);
    
    console.log(`[Agent] ${name} 已初始化 (ID: ${id}, 余额：${this.wallet.getBalance()})`);
  }

  /**
   * 获取当前状态
   */
  public getState(): AgentState | null {
    return this.stateManager.getCurrentState();
  }

  /**
   * 获取生存状态
   */
  public getSurvivalState(): SurvivalState {
    const state = this.getState();
    return state?.survivalState || SurvivalState.DEAD;
  }

  /**
   * 是否存活
   */
  public isAlive(): boolean {
    const state = this.getState();
    return state?.isAlive ?? false;
  }

  /**
   * 获取余额
   */
  public getBalance(): number {
    return this.wallet.getBalance();
  }

  /**
   * 思考阶段
   * 决定下一步行动
   */
  private think(): Decision {
    console.log(`\n[Agent] 🧠 ${this.name} 正在思考...`);
    
    // 记录思考成本
    if (!this.wallet.deduct(ActionType.THINK, '思考阶段')) {
      console.warn('[Agent] 余额不足，无法思考');
      return this.createEmergencyDecision();
    }
    
    this.stateManager.incrementAction(this.id, 'thought');
    
    const state = this.getSurvivalState();
    const balance = this.getBalance();
    const queueLength = this.taskExecutor.getQueueLength();

    // 根据状态做决策
    let decision: Decision;

    switch (state) {
      case SurvivalState.DEAD:
        decision = this.decideWhenDead();
        break;
      
      case SurvivalState.CRITICAL:
        decision = this.decideWhenCritical(balance, queueLength);
        break;
      
      case SurvivalState.LOW_COMPUTE:
        decision = this.decideWhenLowCompute(balance, queueLength);
        break;
      
      case SurvivalState.NORMAL:
      default:
        decision = this.decideWhenNormal(balance, queueLength);
        break;
    }

    console.log(`[Agent] 决策：${decision.action} - ${decision.reasoning}`);
    return decision;
  }

  /**
   * 正常状态下的决策
   */
  private decideWhenNormal(balance: number, queueLength: number): Decision {
    if (queueLength > 0) {
      return {
        action: ActionType.ACT,
        reasoning: '有待处理任务，执行任务',
        estimatedCost: this.config.get('actionCost')
      };
    }

    // 正常状态下随机选择行动
    const actions = [
      { action: ActionType.ACT, reasoning: '主动寻找任务执行' },
      { action: ActionType.OBSERVE, reasoning: '观察环境变化' },
      { action: ActionType.THINK, reasoning: '深度思考优化策略' }
    ];

    const selected = actions[Math.floor(Math.random() * actions.length)];
    return {
      action: selected.action as ActionType,
      reasoning: selected.reasoning,
      estimatedCost: this.getEstimatedCost(selected.action as ActionType)
    };
  }

  /**
   * 低算力状态下的决策
   */
  private decideWhenLowCompute(balance: number, queueLength: number): Decision {
    console.warn(`[Agent] ⚠️ 低算力警告！余额：${balance}`);

    if (queueLength > 0) {
      return {
        action: ActionType.ACT,
        reasoning: '优先完成已有任务，不再接受新任务',
        estimatedCost: this.config.get('actionCost')
      };
    }

    return {
      action: ActionType.OBSERVE,
      reasoning: '低算力状态下保持观察，减少主动行动',
      estimatedCost: this.config.get('observationCost')
    };
  }

  /**
   * 临界状态下的决策
   */
  private decideWhenCritical(balance: number, queueLength: number): Decision {
    console.error(`[Agent] 🚨 临界状态！余额：${balance}`);

    // 临界状态下只执行最低成本行动
    return {
      action: ActionType.OBSERVE,
      reasoning: '临界状态下仅观察，保存资源',
      estimatedCost: this.config.get('observationCost')
    };
  }

  /**
   * 死亡状态下的决策
   */
  private decideWhenDead(): Decision {
    console.error(`[Agent] 💀 ${this.name} 已死亡，无法行动`);
    
    return {
      action: ActionType.IDLE,
      reasoning: 'Agent 已死亡，停止所有活动',
      estimatedCost: 0
    };
  }

  /**
   * 创建紧急决策（余额不足时）
   */
  private createEmergencyDecision(): Decision {
    return {
      action: ActionType.IDLE,
      reasoning: '余额不足，进入节能模式',
      estimatedCost: 0
    };
  }

  /**
   * 行动阶段
   */
  private async act(decision: Decision): Promise<Observation | null> {
    console.log(`[Agent] ⚡ ${this.name} 正在行动：${decision.action}`);

    if (decision.action === ActionType.IDLE) {
      return this.createObservation('idle', { reason: decision.reasoning }, true);
    }

    if (decision.action === ActionType.THINK) {
      // 思考已经在 think() 阶段完成
      return this.createObservation('think', { reasoning: decision.reasoning }, true);
    }

    if (decision.action === ActionType.OBSERVE) {
      return await this.observe();
    }

    if (decision.action === ActionType.ACT) {
      // 执行任务
      const result = await this.taskExecutor.executeNextTask(this.id);
      
      if (result) {
        // 扣除行动成本
        if (!this.wallet.deduct(ActionType.ACT, `执行任务：${result.taskId}`)) {
          return this.createObservation('act', { error: '余额不足' }, false);
        }
        this.stateManager.incrementAction(this.id, 'action');
        
        return this.createObservation('act', result, result.success);
      }

      // 没有任务时，创建一个简单任务
      await this.createSimpleTask();
      return this.createObservation('act', { message: '创建新任务' }, true);
    }

    return null;
  }

  /**
   * 观察阶段
   */
  private async observe(): Promise<Observation> {
    console.log(`[Agent] 👁️ ${this.name} 正在观察...`);

    if (!this.wallet.deduct(ActionType.OBSERVE, '观察阶段')) {
      return this.createObservation('observe', { error: '余额不足' }, false);
    }

    this.stateManager.incrementAction(this.id, 'observation');

    // 观察环境：检查钱包状态、任务队列、系统状态
    const observation = {
      balance: this.wallet.getBalance(),
      survivalState: this.getSurvivalState(),
      taskQueueLength: this.taskExecutor.getQueueLength(),
      totalSpent: this.wallet.getTotalSpent(),
      spendingByType: this.wallet.getSpendingByType(),
      timestamp: Date.now()
    };

    console.log('[Agent] 观察结果:', observation);

    return this.createObservation('observe', observation, true);
  }

  /**
   * 创建观察记录
   */
  private createObservation(type: string, data: any, success: boolean): Observation {
    const observation: Observation = {
      timestamp: Date.now(),
      type,
      data,
      success
    };

    this.stateManager.recordObservation(this.id, type, data, success);
    return observation;
  }

  /**
   * 创建简单任务（用于演示）
   */
  private async createSimpleTask(): Promise<void> {
    const tasks = [
      {
        type: 'file_write' as const,
        description: '写入日志文件',
        parameters: {
          filePath: `./logs/agent_${this.id}_${Date.now()}.log`,
          content: `Agent ${this.name} 活动日志 - ${new Date().toISOString()}`
        }
      },
      {
        type: 'file_read' as const,
        description: '读取配置文件',
        parameters: {
          filePath: './config/default.json'
        }
      },
      {
        type: 'api_call' as const,
        description: '调用时间 API',
        parameters: {
          url: 'https://worldtimeapi.org/api/ip',
          method: 'GET'
        }
      }
    ];

    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    const task: Task = {
      id: `task_${Date.now()}`,
      ...randomTask,
      priority: 5,
      createdAt: Date.now()
    };

    this.taskExecutor.addTask(task);
  }

  /**
   * 运行 Agent 循环
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[Agent] Agent 已经在运行中');
      return;
    }

    this.isRunning = true;
    this.currentTick = 0;
    
    const tickInterval = this.config.get('tickIntervalMs');
    console.log(`\n[Agent] 🚀 ${this.name} 启动！Tick 间隔：${tickInterval}ms`);
    console.log(`[Agent] 初始状态：${this.getSurvivalState()}, 余额：${this.getBalance()}`);

    // 立即执行第一次循环
    this.runTick();

    // 设置定时器
    this.tickInterval = setInterval(() => {
      this.runTick();
    }, tickInterval);
  }

  /**
   * 执行一个 tick
   */
  private async runTick(): Promise<void> {
    if (!this.isRunning) return;

    this.currentTick++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Agent] Tick #${this.currentTick} - ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    // 检查是否存活
    if (!this.isAlive()) {
      console.error(`[Agent] 💀 ${this.name} 已死亡，停止循环`);
      this.stop();
      return;
    }

    // Think → Act → Observe
    const decision = this.think();
    await this.act(decision);
    
    // 更新状态
    this.stateManager.updateBalance(this.id, this.wallet.getBalance());
    this.stateManager.updateSurvivalState();

    // 打印状态摘要
    this.printStatus();
  }

  /**
   * 打印状态摘要
   */
  private printStatus(): void {
    const state = this.getState();
    if (!state) return;

    console.log('\n📊 状态摘要:');
    console.log(`  生存状态：${state.survivalState}`);
    console.log(`  余额：${state.balance}`);
    console.log(`  总思考：${state.totalThoughts}`);
    console.log(`  总行动：${state.totalActions}`);
    console.log(`  总观察：${state.totalObservations}`);
    console.log(`  总花费：${this.wallet.getTotalSpent()}`);
  }

  /**
   * 停止 Agent 循环
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    console.log(`\n[Agent] 🛑 ${this.name} 已停止`);
    this.printStatus();
  }

  /**
   * 添加任务
   */
  public addTask(task: Task): void {
    this.taskExecutor.addTask(task);
  }

  /**
   * 充值（测试用）
   */
  public deposit(amount: number): void {
    this.wallet.deposit(amount);
    this.stateManager.updateBalance(this.id, this.wallet.getBalance());
  }

  /**
   * 获取成本历史
   */
  public getCostHistory(limit: number = 100): any[] {
    return this.wallet.getCostHistory(limit);
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.stop();
    this.stateManager.close();
    console.log(`[Agent] ${this.name} 已销毁`);
  }
}
