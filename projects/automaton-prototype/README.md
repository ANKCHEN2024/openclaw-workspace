# Automaton Prototype - AI Agent 生存机制原型

> Phase 1: 基础生存机制

一个简化版 AI Agent，具备基础生存循环和成本追踪能力。

## 🎯 核心功能

1. **Agent 核心循环** - Think → Act → Observe → Repeat
2. **虚拟钱包系统** - 模拟余额管理，无需真实区块链
3. **生存状态监控** - normal / low_compute / critical / dead
4. **任务执行能力** - API 调用、文件操作
5. **成本追踪** - 详细的花费记录和"死亡"判定

## 🏗️ 技术栈

- **运行时**: Node.js (v18+)
- **语言**: TypeScript
- **数据库**: SQLite (better-sqlite3)
- **配置**: JSON + 环境变量

## 📦 项目结构

```
automaton-prototype/
├── src/
│   ├── index.ts              # 主入口
│   ├── core/
│   │   ├── Agent.ts          # Agent 核心类
│   │   └── types.ts          # 类型定义
│   ├── wallet/
│   │   └── VirtualWallet.ts  # 虚拟钱包系统
│   ├── state/
│   │   └── StateManager.ts   # 状态持久化管理
│   ├── tasks/
│   │   └── TaskExecutor.ts   # 任务执行器
│   └── config/
│       └── Config.ts         # 配置管理
├── tests/
│   └── basic.test.ts         # 基础测试
├── config/
│   └── default.json          # 默认配置
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd projects/automaton-prototype
npm install
```

### 2. 配置环境

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，根据需要调整配置：

```env
AGENT_NAME=MyAutomaton
INITIAL_BALANCE=1000
TICK_INTERVAL_MS=5000

# 生存阈值
LOW_COMPUTE_THRESHOLD=500
CRITICAL_THRESHOLD=100
DEAD_THRESHOLD=0

# 成本配置
THOUGHT_COST=1
ACTION_COST=5
OBSERVATION_COST=2
API_CALL_COST=10
FILE_OPERATION_COST=3
```

### 3. 运行

**开发模式**（TypeScript 直接运行）：
```bash
npm run dev
```

**生产模式**（先编译后运行）：
```bash
npm run build
npm start
```

### 4. 运行测试

```bash
npm test
```

## 📊 生存状态说明

| 状态 | 余额范围 | 行为策略 |
|------|---------|---------|
| `normal` | > 500 | 正常执行任务，主动观察 |
| `low_compute` | 100-500 | 警告状态，优先完成已有任务 |
| `critical` | 1-100 | 临界状态，仅观察，保存资源 |
| `dead` | ≤ 0 | 死亡，停止所有活动 |

## 💰 成本系统

| 行动类型 | 默认成本 | 说明 |
|---------|---------|------|
| Think | 1 | 思考决策 |
| Act | 5 | 执行任务 |
| Observe | 2 | 观察环境 |
| API Call | 10 | 外部 API 调用 |
| File Operation | 3 | 文件读写 |

## 🔧 配置选项

### config/default.json

```json
{
  "agentName": "MyAutomaton",        // Agent 名称
  "initialBalance": 1000,            // 初始余额
  "tickIntervalMs": 5000,            // 循环间隔（毫秒）
  
  "lowComputeThreshold": 500,        // 低算力阈值
  "criticalThreshold": 100,          // 临界阈值
  "deadThreshold": 0,                // 死亡阈值
  
  "thoughtCost": 1,                  // 思考成本
  "actionCost": 5,                   // 行动成本
  "observationCost": 2,              // 观察成本
  "apiCallCost": 10,                 // API 调用成本
  "fileOperationCost": 3,            // 文件操作成本
  
  "dbPath": "./data/agent_state.db", // 数据库路径
  "logLevel": "info"                 // 日志级别
}
```

## 📝 API 使用示例

### 创建 Agent

```typescript
import { Agent } from './src/core/Agent';

const agent = new Agent('agent_001', 'MyBot', 1000);
```

### 添加任务

```typescript
// 文件写入任务
agent.addTask({
  id: 'task_001',
  type: 'file_write',
  description: '写入日志',
  parameters: {
    filePath: './logs/test.log',
    content: 'Hello World'
  },
  priority: 10,
  createdAt: Date.now()
});

// API 调用任务
agent.addTask({
  id: 'task_002',
  type: 'api_call',
  description: '获取时间',
  parameters: {
    url: 'https://worldtimeapi.org/api/ip',
    method: 'GET'
  },
  priority: 5,
  createdAt: Date.now()
});
```

### 启动/停止

```typescript
// 启动 Agent 循环
agent.start();

// 停止 Agent
agent.stop();

// 销毁 Agent（关闭数据库连接等）
agent.destroy();
```

### 查询状态

```typescript
// 获取当前状态
const state = agent.getState();
console.log(state);

// 获取余额
const balance = agent.getBalance();

// 获取生存状态
const survivalState = agent.getSurvivalState();

// 是否存活
const isAlive = agent.isAlive();

// 获取成本历史
const costHistory = agent.getCostHistory(100);
```

### 充值（测试用）

```typescript
agent.deposit(500);
```

## 🧪 测试

运行完整测试套件：

```bash
npm test
```

测试内容：
- ✅ 配置加载
- ✅ 虚拟钱包系统
- ✅ 状态持久化
- ✅ Agent 创建
- ✅ 生存状态转换
- ✅ 任务执行
- ✅ Agent 循环

## 📈 输出示例

```
╔═══════════════════════════════════════════════════════════╗
║     Automaton Prototype - AI Agent 生存机制原型           ║
║     Phase 1: 基础生存机制                                  ║
╚═══════════════════════════════════════════════════════════╝

📋 配置信息:
  Agent 名称：MyAutomaton
  初始余额：1000
  Tick 间隔：5000ms
  低算力阈值：500
  临界阈值：100
  死亡阈值：0

🚀 启动 Agent 核心循环...

============================================================
[Agent] Tick #1 - 2026-03-08 17:00:00
============================================================

[Agent] 🧠 MyAutomaton 正在思考...
[Wallet] 扣除 1 (类型：think), 剩余余额：999
[Agent] 决策：act - 有待处理任务，执行任务

[Agent] ⚡ MyAutomaton 正在行动：act
[TaskExecutor] 执行任务：写入日志文件
[Wallet] 扣除 5 (类型：act), 剩余余额：994

📊 状态摘要:
  生存状态：normal
  余额：994
  总思考：1
  总行动：1
  总观察：0
  总花费：6
```

## 🔮 后续扩展方向

### Phase 2: 增强能力
- [ ] 更多任务类型（数据库操作、网络请求等）
- [ ] 任务优先级动态调整
- [ ] 学习机制（根据历史优化决策）

### Phase 3: 多 Agent 协作
- [ ] Agent 间通信
- [ ] 任务分配和协作
- [ ] 资源共享机制

### Phase 4: 真实集成
- [ ] 真实区块链钱包集成
- [ ] 外部 API 市场接入
- [ ] 实际业务场景对接

## ⚠️ 注意事项

1. **演示模式**: 默认运行 30 秒后自动停止，修改 `src/index.ts` 中的 `setTimeout` 可调整
2. **数据库**: SQLite 数据库文件保存在 `./data/` 目录
3. **日志**: 活动日志保存在 `./logs/` 目录
4. **优雅退出**: 支持 SIGINT 和 SIGTERM 信号，自动清理资源

## 📄 许可证

MIT

## 👤 作者

MOSS - AI 合伙人 / Subagent 指挥官

---

**让每一个 AI Agent 都懂得生存的意义** 🚀
