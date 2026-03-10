import { Config } from '../config/Config';
import { ActionType, CostRecord } from '../core/types';

/**
 * 虚拟钱包系统
 * 模拟 Agent 的余额管理，无需真实区块链
 */
export class VirtualWallet {
  private balance: number;
  private readonly config: Config;
  private costHistory: CostRecord[] = [];

  constructor(initialBalance?: number) {
    this.config = Config.getInstance();
    this.balance = initialBalance ?? this.config.get('initialBalance');
  }

  /**
   * 获取当前余额
   */
  public getBalance(): number {
    return this.balance;
  }

  /**
   * 扣除成本
   */
  public deduct(actionType: ActionType, description: string): boolean {
    const cost = this.getCostForAction(actionType);
    
    if (this.balance < cost) {
      console.warn(`[Wallet] 余额不足！需要 ${cost}, 当前余额 ${this.balance}`);
      return false;
    }

    this.balance -= cost;
    this.recordCost(actionType, cost, description);
    
    console.log(`[Wallet] 扣除 ${cost} (类型：${actionType}), 剩余余额：${this.balance}`);
    return true;
  }

  /**
   * 获取行动成本
   */
  private getCostForAction(actionType: ActionType): number {
    switch (actionType) {
      case ActionType.THINK:
        return this.config.get('thoughtCost');
      case ActionType.ACT:
        return this.config.get('actionCost');
      case ActionType.OBSERVE:
        return this.config.get('observationCost');
      case ActionType.IDLE:
        return 0;
      default:
        return this.config.get('actionCost');
    }
  }

  /**
   * 记录成本
   */
  private recordCost(actionType: ActionType, cost: number, description: string): void {
    const record: CostRecord = {
      timestamp: Date.now(),
      actionType,
      cost,
      description,
      balanceAfter: this.balance
    };
    
    this.costHistory.push(record);
    
    // 只保留最近 1000 条记录
    if (this.costHistory.length > 1000) {
      this.costHistory = this.costHistory.slice(-1000);
    }
  }

  /**
   * 获取成本历史
   */
  public getCostHistory(limit: number = 100): CostRecord[] {
    return this.costHistory.slice(-limit);
  }

  /**
   * 获取总花费
   */
  public getTotalSpent(): number {
    return this.costHistory.reduce((total, record) => total + record.cost, 0);
  }

  /**
   * 获取按类型的花费统计
   */
  public getSpendingByType(): Record<ActionType, number> {
    const stats: Record<ActionType, number> = {
      [ActionType.THINK]: 0,
      [ActionType.ACT]: 0,
      [ActionType.OBSERVE]: 0,
      [ActionType.IDLE]: 0
    };

    this.costHistory.forEach(record => {
      stats[record.actionType] += record.cost;
    });

    return stats;
  }

  /**
   * 充值（用于测试）
   */
  public deposit(amount: number): void {
    this.balance += amount;
    console.log(`[Wallet] 充值 ${amount}, 新余额：${this.balance}`);
  }

  /**
   * 检查是否破产
   */
  public isBankrupt(): boolean {
    return this.balance <= this.config.get('deadThreshold');
  }

  /**
   * 检查是否低余额警告
   */
  public isLowBalance(): boolean {
    return this.balance <= this.config.get('lowComputeThreshold');
  }

  /**
   * 检查是否临界状态
   */
  public isCritical(): boolean {
    return this.balance <= this.config.get('criticalThreshold');
  }
}
