import * as path from 'path';
import * as fs from 'fs';
import { Config } from '../config/Config';
import { SurvivalState, AgentState } from '../core/types';

/**
 * 状态管理器
 * 使用 JSON 文件持久化 Agent 状态（无需 SQLite 编译）
 */
export class StateManager {
  private readonly config: Config;
  private currentState: AgentState | null = null;
  private readonly dbDir: string;
  private readonly stateFile: string;
  private readonly costFile: string;
  private readonly observationFile: string;

  constructor(dbPath?: string) {
    this.config = Config.getInstance();
    const dbPathToUse = dbPath || this.config.get('dbPath');
    
    // 确保数据库目录存在
    this.dbDir = path.dirname(dbPathToUse);
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    // JSON 文件路径
    this.stateFile = path.join(this.dbDir, 'agent_state.json');
    this.costFile = path.join(this.dbDir, 'cost_records.json');
    this.observationFile = path.join(this.dbDir, 'observations.json');

    this.initializeDatabase();
  }

  /**
   * 初始化数据库文件
   */
  private initializeDatabase(): void {
    // 创建空文件如果不存在
    if (!fs.existsSync(this.stateFile)) {
      fs.writeFileSync(this.stateFile, JSON.stringify({ agents: {} }, null, 2));
    }
    if (!fs.existsSync(this.costFile)) {
      fs.writeFileSync(this.costFile, JSON.stringify({ records: [] }, null, 2));
    }
    if (!fs.existsSync(this.observationFile)) {
      fs.writeFileSync(this.observationFile, JSON.stringify({ observations: [] }, null, 2));
    }

    console.log('[StateManager] 数据库初始化完成');
  }

  /**
   * 读取状态文件
   */
  private readStateFile(): any {
    try {
      const data = fs.readFileSync(this.stateFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { agents: {} };
    }
  }

  /**
   * 写入状态文件
   */
  private writeStateFile(data: any): void {
    fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
  }

  /**
   * 读取成本文件
   */
  private readCostFile(): any {
    try {
      const data = fs.readFileSync(this.costFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { records: [] };
    }
  }

  /**
   * 写入成本文件
   */
  private writeCostFile(data: any): void {
    fs.writeFileSync(this.costFile, JSON.stringify(data, null, 2));
  }

  /**
   * 读取观察文件
   */
  private readObservationFile(): any {
    try {
      const data = fs.readFileSync(this.observationFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { observations: [] };
    }
  }

  /**
   * 写入观察文件
   */
  private writeObservationFile(data: any): void {
    fs.writeFileSync(this.observationFile, JSON.stringify(data, null, 2));
  }

  /**
   * 创建或加载 Agent 状态
   */
  public createOrLoadAgent(id: string, name: string, initialBalance: number): AgentState {
    const existing = this.loadAgent(id);
    
    if (existing) {
      this.currentState = existing;
      console.log(`[StateManager] 加载已有 Agent: ${name} (余额：${existing.balance})`);
      return existing;
    }

    const newState: AgentState = {
      id,
      name,
      balance: initialBalance,
      survivalState: SurvivalState.NORMAL,
      totalActions: 0,
      totalThoughts: 0,
      totalObservations: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      isAlive: true
    };

    this.saveAgent(newState);
    this.currentState = newState;
    console.log(`[StateManager] 创建新 Agent: ${name} (初始余额：${initialBalance})`);
    return newState;
  }

  /**
   * 保存 Agent 状态
   */
  public saveAgent(state: AgentState): void {
    const data = this.readStateFile();
    data.agents[state.id] = state;
    this.writeStateFile(data);
  }

  /**
   * 加载 Agent 状态
   */
  public loadAgent(id: string): AgentState | null {
    const data = this.readStateFile();
    return data.agents[id] || null;
  }

  /**
   * 更新余额
   */
  public updateBalance(id: string, newBalance: number): void {
    const data = this.readStateFile();
    if (data.agents[id]) {
      data.agents[id].balance = newBalance;
      data.agents[id].lastActiveAt = Date.now();
      this.writeStateFile(data);
    }
    
    if (this.currentState && this.currentState.id === id) {
      this.currentState.balance = newBalance;
      this.currentState.lastActiveAt = Date.now();
      this.updateSurvivalState();
    }
  }

  /**
   * 记录行动计数
   */
  public incrementAction(id: string, actionType: 'thought' | 'action' | 'observation'): void {
    const data = this.readStateFile();
    if (data.agents[id]) {
      if (actionType === 'thought') data.agents[id].totalThoughts++;
      else if (actionType === 'action') data.agents[id].totalActions++;
      else if (actionType === 'observation') data.agents[id].totalObservations++;
      
      data.agents[id].lastActiveAt = Date.now();
      this.writeStateFile(data);
    }

    if (this.currentState && this.currentState.id === id) {
      this.currentState.lastActiveAt = Date.now();
      if (actionType === 'thought') this.currentState.totalThoughts++;
      else if (actionType === 'action') this.currentState.totalActions++;
      else if (actionType === 'observation') this.currentState.totalObservations++;
    }
  }

  /**
   * 记录成本
   */
  public recordCost(agentId: string, actionType: string, cost: number, description: string, balanceAfter: number): void {
    const data = this.readCostFile();
    data.records.push({
      id: data.records.length + 1,
      agentId,
      timestamp: Date.now(),
      actionType,
      cost,
      description,
      balanceAfter
    });
    this.writeCostFile(data);
  }

  /**
   * 记录观察
   */
  public recordObservation(agentId: string, type: string, data: any, success: boolean, error?: string): void {
    const obsData = this.readObservationFile();
    obsData.observations.push({
      id: obsData.observations.length + 1,
      agentId,
      timestamp: Date.now(),
      type,
      data: JSON.stringify(data),
      success,
      error: error || null
    });
    this.writeObservationFile(obsData);
  }

  /**
   * 更新生存状态
   */
  public updateSurvivalState(): void {
    if (!this.currentState) return;

    const config = this.config.getAll();
    let newState: SurvivalState = SurvivalState.NORMAL;

    if (this.currentState.balance <= config.deadThreshold) {
      newState = SurvivalState.DEAD;
    } else if (this.currentState.balance <= config.criticalThreshold) {
      newState = SurvivalState.CRITICAL;
    } else if (this.currentState.balance <= config.lowComputeThreshold) {
      newState = SurvivalState.LOW_COMPUTE;
    }

    if (newState !== this.currentState.survivalState) {
      console.log(`[StateManager] 生存状态变更：${this.currentState.survivalState} → ${newState}`);
      this.currentState.survivalState = newState;
      
      const isAlive = newState !== SurvivalState.DEAD;
      this.currentState.isAlive = isAlive;

      const data = this.readStateFile();
      if (data.agents[this.currentState.id]) {
        data.agents[this.currentState.id].survivalState = newState;
        data.agents[this.currentState.id].isAlive = isAlive;
        data.agents[this.currentState.id].lastActiveAt = Date.now();
        this.writeStateFile(data);
      }
    }
  }

  /**
   * 获取当前状态
   */
  public getCurrentState(): AgentState | null {
    return this.currentState;
  }

  /**
   * 获取成本历史
   */
  public getCostHistory(agentId: string, limit: number = 100): any[] {
    const data = this.readCostFile();
    return data.records
      .filter((r: any) => r.agentId === agentId)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    console.log('[StateManager] 数据库连接已关闭');
  }
}
