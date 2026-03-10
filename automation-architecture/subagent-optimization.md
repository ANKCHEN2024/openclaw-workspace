# Subagent 调度优化方案

## 现状分析

### 当前架构
```
Main Agent → spawn Subagent → poll for result → aggregate
```

### 核心问题
1. **轮询开销**: 需要主动查询 subagent 状态
2. **资源占用**: 完成的 subagent 未立即释放
3. **缺乏优先级**: 任务按顺序处理，无优先级区分
4. **无背压控制**: 大量任务同时提交可能导致系统过载

---

## 优化方案

### 方案 1: 推送式结果通知 (Push-based Results)

#### 设计
```typescript
// 优化前：轮询
async function waitForSubagent(sessionId: string): Promise<any> {
  while (true) {
    const result = await process.poll(sessionId);
    if (result) return result;
    await sleep(1000); // 浪费资源和时间
  }
}

// 优化后：推送
class SubagentResultManager {
  private result_promises: Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = new Map();
  
  async spawn(task: Task): Promise<string> {
    const session_id = await this.createSubagentSession(task);
    
    // 创建 Promise 等待结果
    const result_promise = new Promise((resolve, reject) => {
      this.result_promises.set(session_id, { resolve, reject });
    });
    
    // 后台监听
    this.listenForResult(session_id);
    
    return session_id;
  }
  
  private async listenForResult(session_id: string): Promise<void> {
    // 使用长轮询或 WebSocket 监听
    const result = await this.waitForCompletion(session_id);
    
    const resolver = this.result_promises.get(session_id);
    if (resolver) {
      resolver.resolve(result);
      this.result_promises.delete(session_id);
    }
  }
  
  async getResult(session_id: string): Promise<any> {
    const promise_data = this.result_promises.get(session_id);
    if (!promise_data) {
      throw new Error(`No result promise found for session ${session_id}`);
    }
    return promise_data;
  }
}
```

#### 优势
- ✅ 消除轮询开销
- ✅ 立即释放资源
- ✅ 支持并发等待多个结果

---

### 方案 2: 优先级队列调度

#### 设计
```typescript
enum TaskPriority {
  CRITICAL = 0,    // 立即执行
  HIGH = 1,        // 高优先级
  NORMAL = 2,      // 默认优先级
  LOW = 3          // 后台任务
}

interface PrioritizedTask {
  task: Task;
  priority: TaskPriority;
  timestamp: number;
  score: number; // 综合得分
}

class PriorityScheduler {
  private queues: Map<TaskPriority, Task[]> = new Map([
    [TaskPriority.CRITICAL, []],
    [TaskPriority.HIGH, []],
    [TaskPriority.NORMAL, []],
    [TaskPriority.LOW, []]
  ]);
  
  async submit(task: Task, priority: TaskPriority = TaskPriority.NORMAL): Promise<string> {
    const prioritized_task: PrioritizedTask = {
      task,
      priority,
      timestamp: Date.now(),
      score: this.calculateScore(task, priority)
    };
    
    this.queues.get(priority)!.push(prioritized_task);
    
    // 触发调度
    this.scheduleNext();
    
    return task.id;
  }
  
  private async scheduleNext(): Promise<void> {
    if (this.available_agents === 0) return;
    
    // 按优先级顺序查找任务
    for (const priority of [TaskPriority.CRITICAL, TaskPriority.HIGH, TaskPriority.NORMAL, TaskPriority.LOW]) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        const task = queue.shift()!;
        await this.executeTask(task);
        return;
      }
    }
  }
  
  private calculateScore(task: Task, priority: TaskPriority): number {
    // 综合得分 = 优先级权重 + 等待时间权重 + 业务价值权重
    const priority_weight = (4 - priority) * 100;
    const wait_time_weight = (Date.now() - task.timestamp) / 1000;
    const business_value_weight = task.business_value || 0;
    
    return priority_weight + wait_time_weight + business_value_weight;
  }
}
```

#### 使用示例
```typescript
// 紧急任务：立即执行
await scheduler.submit(urgent_task, TaskPriority.CRITICAL);

// 日常任务：正常排队
await scheduler.submit(normal_task, TaskPriority.NORMAL);

// 后台任务：空闲时执行
await scheduler.submit(background_task, TaskPriority.LOW);
```

---

### 方案 3: 动态资源池管理

#### 设计
```typescript
interface AgentPoolConfig {
  min_agents: number;
  max_agents: number;
  scale_up_threshold: number; // 队列深度触发扩容
  scale_down_threshold: number; // 队列深度触发缩容
  idle_timeout_ms: number; // 空闲超时释放
}

class DynamicAgentPool {
  private agents: Map<string, Agent> = new Map();
  private config: AgentPoolConfig;
  
  constructor(config: AgentPoolConfig) {
    this.config = config;
    this.initializeMinAgents();
  }
  
  private async initializeMinAgents(): Promise<void> {
    for (let i = 0; i < this.config.min_agents; i++) {
      await this.spawnAgent();
    }
  }
  
  async acquire(): Promise<Agent> {
    const available = this.getAvailableAgents();
    
    if (available.length === 0) {
      if (this.agents.size < this.config.max_agents) {
        // 扩容
        const new_agent = await this.spawnAgent();
        return new_agent;
      } else {
        // 等待
        return this.waitForAvailableAgent();
      }
    }
    
    return available[0];
  }
  
  async release(agent: Agent): Promise<void> {
    agent.reset();
    
    // 启动空闲计时器
    setTimeout(async () => {
      if (this.agents.size > this.config.min_agents && agent.isIdle()) {
        await this.terminateAgent(agent.id);
      }
    }, this.config.idle_timeout_ms);
  }
  
  private async spawnAgent(): Promise<Agent> {
    const agent = await createAgent();
    this.agents.set(agent.id, agent);
    console.log(`Agent spawned: ${agent.id}, total: ${this.agents.size}`);
    return agent;
  }
  
  private async terminateAgent(agent_id: string): Promise<void> {
    const agent = this.agents.get(agent_id);
    if (agent) {
      await agent.terminate();
      this.agents.delete(agent_id);
      console.log(`Agent terminated: ${agent_id}, total: ${this.agents.size}`);
    }
  }
  
  async autoScale(): Promise<void> {
    const queue_depth = await this.getQueueDepth();
    
    if (queue_depth > this.config.scale_up_threshold && this.agents.size < this.config.max_agents) {
      await this.spawnAgent();
    } else if (queue_depth < this.config.scale_down_threshold && this.agents.size > this.config.min_agents) {
      const idle_agents = this.getIdleAgents();
      if (idle_agents.length > 0) {
        await this.terminateAgent(idle_agents[0].id);
      }
    }
  }
}
```

---

### 方案 4: 背压控制 (Backpressure)

#### 设计
```typescript
class BackpressureController {
  private max_queue_size: number;
  private current_queue_size: number = 0;
  private rejection_rate: number = 0; // 动态拒绝率
  
  constructor(max_queue_size: number) {
    this.max_queue_size = max_queue_size;
  }
  
  async submit(task: Task): Promise<boolean> {
    this.current_queue_size++;
    
    // 计算当前负载率
    const load_factor = this.current_queue_size / this.max_queue_size;
    
    // 动态调整拒绝率 (负载越高，拒绝率越高)
    this.rejection_rate = Math.pow(load_factor, 3); // 立方增长
    
    if (load_factor >= 1.0) {
      // 队列已满， probabilistic 拒绝
      if (Math.random() < this.rejection_rate) {
        this.current_queue_size--;
        await this.notifyUpstreamToSlowDown();
        return false;
      }
    }
    
    return true;
  }
  
  async complete(): Promise<void> {
    this.current_queue_size = Math.max(0, this.current_queue_size - 1);
  }
  
  private async notifyUpstreamToSlowDown(): Promise<void> {
    // 通知上游降低提交速率
    eventBus.publish('BACKPRESSURE_SIGNAL', {
      current_queue_size: this.current_queue_size,
      rejection_rate: this.rejection_rate,
      suggested_rate_limit: this.calculateSuggestedRateLimit()
    });
  }
  
  private calculateSuggestedRateLimit(): number {
    // 基于当前负载计算建议的速率限制
    const load_factor = this.current_queue_size / this.max_queue_size;
    return Math.max(1, Math.floor(100 * (1 - load_factor)));
  }
}
```

#### 使用示例
```typescript
const backpressure = new BackpressureController(1000);

async function handleUserRequest(request: Request): Promise<Response> {
  const accepted = await backpressure.submit(request.task);
  
  if (!accepted) {
    // 返回降级响应
    return {
      status: 503,
      message: 'System overloaded, please retry later',
      retry_after: 5
    };
  }
  
  try {
    const result = await processTask(request.task);
    return { status: 200, result };
  } finally {
    await backpressure.complete();
  }
}
```

---

## 实施路线图

### Phase 1 (第 1 周): 推送式结果通知
- [ ] 实现 SubagentResultManager
- [ ] 集成到 Main Agent
- [ ] 测试验证

### Phase 2 (第 2 周): 优先级队列
- [ ] 实现 PriorityScheduler
- [ ] 定义任务优先级标准
- [ ] 性能测试

### Phase 3 (第 3 周): 动态资源池
- [ ] 实现 DynamicAgentPool
- [ ] 配置自动扩缩容策略
- [ ] 压力测试

### Phase 4 (第 4 周): 背压控制
- [ ] 实现 BackpressureController
- [ ] 集成到任务提交流程
- [ ] 全链路测试

---

## 预期收益

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 任务响应延迟 | 1-5s | <500ms | 90%↓ |
| 资源利用率 | 40-60% | 70-85% | 40%↑ |
| 系统吞吐量 | 100 任务/分钟 | 500 任务/分钟 | 5x↑ |
| 任务失败率 | 5% | <1% | 80%↓ |

---

_版本：v1.0_
_创建时间：2026-03-09_
_作者：MOSS_
