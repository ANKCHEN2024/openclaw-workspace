/**
 * Agent 核心类型定义
 */

// Agent 生存状态
export enum SurvivalState {
  NORMAL = 'normal',           // 正常状态
  LOW_COMPUTE = 'low_compute', // 低算力警告
  CRITICAL = 'critical',       // 临界状态
  DEAD = 'dead'                // 死亡
}

// Agent 行为类型
export enum ActionType {
  THINK = 'think',
  ACT = 'act',
  OBSERVE = 'observe',
  IDLE = 'idle'
}

// Agent 决策结果
export interface Decision {
  action: ActionType;
  reasoning: string;
  target?: string;
  parameters?: Record<string, any>;
  estimatedCost: number;
}

// Agent 观察结果
export interface Observation {
  timestamp: number;
  type: string;
  data: any;
  success: boolean;
  error?: string;
}

// Agent 状态快照
export interface AgentState {
  id: string;
  name: string;
  balance: number;
  survivalState: SurvivalState;
  totalActions: number;
  totalThoughts: number;
  totalObservations: number;
  createdAt: number;
  lastActiveAt: number;
  isAlive: boolean;
}

// 成本追踪记录
export interface CostRecord {
  timestamp: number;
  actionType: ActionType;
  cost: number;
  description: string;
  balanceAfter: number;
}
