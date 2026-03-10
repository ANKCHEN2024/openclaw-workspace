# 全栈开发知识体系 - 国际水准 (5/5)

> 创建时间：2026-03-09  
> 版本：v1.0  
> 目标：4 小时内掌握国际顶级全栈开发能力

---

## 📚 目录

1. [前端大师级](#1-前端大师级)
2. [后端大师级](#2-后端大师级)
3. [数据库优化](#3-数据库优化)
4. [架构设计](#4-架构设计)
5. [性能优化](#5-性能优化)
6. [安全加固](#6-安全加固)

---

## 1. 前端大师级

### 1.1 Vue 3 高级技巧

#### 组合式 API 最佳实践

```typescript
// ✅ 推荐：逻辑复用与类型安全
import { ref, computed, watchEffect } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const double = computed(() => count.value * 2)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  
  return { count, double, increment, decrement }
}

// 使用
const { count, double, increment } = useCounter(10)
```

#### 响应式优化

```typescript
// ✅ shallowRef 用于大型对象（仅跟踪 .value 变化）
import { shallowRef, triggerRef } from 'vue'

const largeData = shallowRef(hugeObject)

// 手动触发更新
largeData.value = { ...largeData.value, updated: true }
triggerRef(largeData)

// ✅ markRaw 标记不需要响应式的对象
import { markRaw } from 'vue'
const chartInstance = markRaw(new Chart(ctx))
```

#### 高级组件模式

```vue
<!-- 渲染插槽 + 作用域插槽 -->
<template>
  <div class="data-list">
    <slot name="header" :count="items.length"></slot>
    
    <template v-for="item in items" :key="item.id">
      <slot name="item" :item="item" :index="item.id">
        <!-- 默认渲染 -->
        <div>{{ item.name }}</div>
      </slot>
    </template>
    
    <slot name="footer"></slot>
  </div>
</template>

<!-- 动态组件 + keep-alive -->
<template>
  <keep-alive :include="cachedComponents" :max="10">
    <component :is="currentComponent" :key="componentKey" />
  </keep-alive>
</template>
```

### 1.2 React 高级技巧

#### Hooks 高级模式

```typescript
// ✅ 自定义 Hook - 数据获取 + 缓存
function useCachedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const cached = queryCache.get(queryKey)
    if (cached && Date.now() - cached.timestamp < (options?.staleTime || 5000)) {
      setData(cached.data)
      setIsLoading(false)
      return
    }
    
    queryFn().then(result => {
      queryCache.set(queryKey, { data: result, timestamp: Date.now() })
      setData(result)
      setIsLoading(false)
    })
  }, [queryKey])
  
  return { data, isLoading }
}

// ✅ useReducer 替代复杂 useState
const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true }
    case 'FETCH_SUCCESS': return { ...state, loading: false, data: action.payload }
    case 'FETCH_ERROR': return { ...state, loading: false, error: action.error }
    default: return state
  }
}
```

#### 性能优化模式

```typescript
// ✅ React.memo + useMemo + useCallback 组合
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => heavyComputation(item))
  }, [data])
  
  const handleClick = useCallback(() => {
    onUpdate(processedData[0])
  }, [processedData, onUpdate])
  
  return <div onClick={handleClick}>{processedData.length}</div>
})

// ✅ 代码分割 + 懒加载
const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  )
}
```

### 1.3 性能优化

#### 懒加载策略

```typescript
// ✅ 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue'),
    // 预加载
    meta: { prefetch: true }
  }
]

// ✅ 组件懒加载
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 3000
})

// ✅ 图片懒加载
<img 
  v-lazy="imageUrl"
  loading="lazy"
  decoding="async"
/>
```

#### 虚拟列表

```typescript
// ✅ 虚拟滚动 - 大数据列表
import { computed } from 'vue'

function useVirtualList<T>(
  items: Ref<T[]>,
  options: { itemHeight: number; containerHeight: number }
) {
  const scrollTop = ref(0)
  
  const visibleItems = computed(() => {
    const startIndex = Math.floor(scrollTop.value / options.itemHeight)
    const visibleCount = Math.ceil(options.containerHeight / options.itemHeight)
    return items.value.slice(startIndex, startIndex + visibleCount + 5)
  })
  
  const totalHeight = items.value.length * options.itemHeight
  
  return { visibleItems, scrollTop, totalHeight }
}
```

#### 缓存策略

```typescript
// ✅ SWR 模式缓存
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private staleTime = 5 * 60 * 1000 // 5 分钟
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this.staleTime) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

// ✅ Vue 组件缓存
<keep-alive :include="['Dashboard', 'Settings']" :max="10">
  <router-view />
</keep-alive>
```

### 1.4 状态管理

#### Pinia 最佳实践

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null as number | null,
    name: null as string | null,
    token: null as string | null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    displayName: (state) => state.name || 'Guest'
  },
  
  actions: {
    async login(credentials: LoginCredentials) {
      const response = await api.login(credentials)
      this.token = response.token
      this.id = response.user.id
      this.name = response.user.name
    },
    
    logout() {
      this.$reset()
    }
  },
  
  persist: true // 持久化
})

// 使用
const userStore = useUserStore()
userStore.login({ email, password })
```

#### Zustand (React)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  count: number
  todos: Todo[]
  increment: () => void
  addTodo: (todo: Todo) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      count: 0,
      todos: [],
      increment: () => set({ count: get().count + 1 }),
      addTodo: (todo) => set({ todos: [...get().todos, todo] })
    }),
    { name: 'app-storage' }
  )
)
```

### 1.5 构建工具

#### Vite 高级配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    compression({ algorithm: 'brotliCompress' })
  ],
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          utils: ['lodash-es', 'dayjs']
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios']
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### 1.6 TypeScript 高级类型

#### 工具类型

```typescript
// ✅ 条件类型
type IsString<T> = T extends string ? true : false

// ✅ 映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

// ✅ 模板字面量类型
type EventName = `on${Capitalize<string>}`

// ✅ 高级工具类型组合
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ✅ 推断类型
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never

// ✅ 类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// ✅ 实用工具类型
type Nullable<T> = T | null
type Optional<T> = T | undefined
type Async<T> = Promise<T>
type ArrayType<T> = T extends (infer U)[] ? U : never
```

#### 泛型高级用法

```typescript
// ✅ 泛型约束
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): number {
  return arg.length
}

// ✅ 多泛型参数
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }
}

// ✅ 泛型默认值
interface Response<T = any> {
  data: T
  status: number
}

// ✅ 泛型工具
type ExtractKeys<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]
```

---

## 2. 后端大师级

### 2.1 Node.js 高级

#### 集群模式

```typescript
// ✅ cluster 主进程
import cluster from 'cluster'
import { availableParallelism } from 'os'

const numCPUs = availableParallelism()

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} started`)
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`)
    cluster.fork()
  })
} else {
  // 工作进程
  import('./server')
}
```

#### 流处理

```typescript
// ✅ 可读流 + 可写流管道
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'

const streamPipeline = promisify(pipeline)

async function processFile(input: string, output: string) {
  await streamPipeline(
    createReadStream(input),
    new TransformStream({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase())
      }
    }),
    createWriteStream(output)
  )
}

// ✅ 背压处理
import { Readable } from 'stream'

async function * dataGenerator() {
  for (let i = 0; i < 1000000; i++) {
    yield { id: i, data: `item-${i}` }
  }
}

const stream = Readable.from(dataGenerator(), { objectMode: true })
```

#### Buffer 优化

```typescript
// ✅ Buffer 池化
import { Buffer } from 'buffer'

const poolSize = 8 * 1024
const bufferPool: Buffer[] = []

function getBuffer(size: number): Buffer {
  if (bufferPool.length > 0) {
    return bufferPool.pop()!
  }
  return Buffer.alloc(size)
}

function releaseBuffer(buffer: Buffer) {
  buffer.fill(0)
  bufferPool.push(buffer)
}

// ✅ 零拷贝
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

const data = await readFile('./large-file.bin', { encoding: 'buffer' })
// 直接传递 Buffer，避免字符串转换
```

### 2.2 Python 高级

#### 异步编程

```python
# ✅ asyncio 高级模式
import asyncio
import aiohttp

async def fetch_all(urls: list[str]) -> list:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=True)

async def fetch(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as response:
        return await response.json()

# ✅ 信号量控制并发
semaphore = asyncio.Semaphore(10)

async def limited_fetch(url: str):
    async with semaphore:
        return await fetch_url(url)

# ✅ 超时控制
async def with_timeout(coro, timeout: float):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        return None
```

#### 元编程

```python
# ✅ 装饰器工厂
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(delay * (attempt + 1))
        return wrapper
    return decorator

# ✅ 描述符
class ValidatedAttribute:
    def __init__(self, validator):
        self.validator = validator
        self.data = {}
    
    def __get__(self, obj, objtype=None):
        return self.data.get(id(obj))
    
    def __set__(self, obj, value):
        if not self.validator(value):
            raise ValueError(f"Invalid value: {value}")
        self.data[id(obj)] = value

# ✅ 元类
class SingletonMeta(type):
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
```

#### 性能优化

```python
# ✅ 使用 __slots__
class Point:
    __slots__ = ['x', 'y']
    
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

# ✅ 生成器表达式
total = sum(x * x for x in range(1000000))

# ✅ 局部变量优化
def process(items: list) -> list:
    append = items.append  # 局部引用
    result = []
    for item in items:
        if item > 0:
            append(item)
    return result

# ✅ 使用 numpy 替代循环
import numpy as np

arr = np.array(range(1000000))
result = arr * 2 + 1  # 向量化操作
```

### 2.3 数据库优化

#### 索引策略

```sql
-- ✅ 复合索引（最左前缀原则）
CREATE INDEX idx_user_status_created ON orders(user_id, status, created_at);

-- ✅ 覆盖索引
CREATE INDEX idx_email_id ON users(email, id);
-- SELECT id FROM users WHERE email = 'x' -- 无需回表

-- ✅ 部分索引（PostgreSQL）
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- ✅ 表达式索引
CREATE INDEX idx_lower_email ON users(LOWER(email));

-- ✅ 分析索引使用
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';
```

#### 查询优化

```sql
-- ✅ 避免 SELECT *
SELECT id, name, email FROM users WHERE id = 1;

-- ✅ 使用 EXISTS 替代 IN
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- ✅ 批量操作
INSERT INTO users (name, email) VALUES
  ('a', 'a@test.com'),
  ('b', 'b@test.com'),
  ('c', 'c@test.com');

-- ✅ 使用 CTE
WITH active_users AS (
  SELECT id FROM users WHERE is_active = true
)
SELECT * FROM orders WHERE user_id IN (SELECT id FROM active_users);

-- ✅ 分页优化（大数据量）
SELECT * FROM orders 
WHERE id > 10000 
ORDER BY id 
LIMIT 20;
```

#### 分库分表

```python
# ✅ 水平分表策略
class ShardedTable:
    def __init__(self, base_name: str, shard_count: int):
        self.base_name = base_name
        self.shard_count = shard_count
    
    def get_shard(self, key: int) -> str:
        shard_id = key % self.shard_count
        return f"{self.base_name}_{shard_id:02d}"
    
    def insert(self, key: int, data: dict):
        shard = self.get_shard(key)
        # INSERT INTO {shard} ...

# ✅ 读写分离
class DatabaseRouter:
    def __init__(self, masters: list, slaves: list):
        self.masters = masters
        self.slaves = slaves
    
    def get_connection(self, read_only: bool = False):
        if read_only:
            return random.choice(self.slaves)
        return self.masters[0]
```

### 2.4 API 设计

#### REST 最佳实践

```typescript
// ✅ 资源命名
GET    /api/v1/users          // 获取用户列表
GET    /api/v1/users/:id      // 获取单个用户
POST   /api/v1/users          // 创建用户
PATCH  /api/v1/users/:id      // 部分更新
DELETE /api/v1/users/:id      // 删除用户

// ✅ 查询参数
GET /api/v1/users?page=1&limit=20&sort=-created_at&fields=id,name,email

// ✅ 状态码
200 OK          // 成功
201 Created     // 创建成功
204 No Content  // 删除成功
400 Bad Request // 参数错误
401 Unauthorized // 未认证
403 Forbidden   // 无权限
404 Not Found   // 资源不存在
409 Conflict    // 资源冲突
422 Unprocessable Entity // 验证失败
429 Too Many Requests // 限流
500 Internal Server Error // 服务器错误

// ✅ 响应格式
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2"
  }
}
```

#### GraphQL

```typescript
// ✅ Schema 设计
type Query {
  user(id: ID!): User
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts(limit: Int = 10): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
}

// ✅ DataLoader 解决 N+1
import { DataLoader } from 'dataloader'

const userLoader = new DataLoader(async (userIds: string[]) => {
  const users = await db.users.find({ id: { $in: userIds } })
  return userIds.map(id => users.find(u => u.id === id))
})

// 在 resolver 中
const user = await userLoader.load(post.userId)
```

#### gRPC

```protobuf
// ✅ proto 定义
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  repeated string roles = 4;
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page = 1;
  int32 limit = 2;
}
```

### 2.5 微服务架构

#### 服务发现

```typescript
// ✅ Consul 集成
import Consul from 'consul'

const consul = new Consul()

async function registerService(name: string, port: number) {
  await consul.agent.service.register({
    name,
    port,
    check: {
      http: `http://localhost:${port}/health`,
      interval: '10s'
    }
  })
}

async function discoverService(name: string) {
  const services = await consul.health.service({ service: name })
  return services.map(s => ({
    address: s.Service.Address,
    port: s.Service.Port
  }))
}
```

#### 消息队列

```typescript
// ✅ RabbitMQ 模式
import amqp from 'amqplib'

class MessageQueue {
  private connection: amqp.Connection
  private channel: amqp.Channel
  
  async publish(queue: string, message: any) {
    await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    })
  }
  
  async consume(queue: string, handler: (msg: any) => Promise<void>) {
    await this.channel.consume(queue, async (msg) => {
      try {
        await handler(JSON.parse(msg.content.toString()))
        this.channel.ack(msg)
      } catch (e) {
        this.channel.nack(msg, false, true) // 重新入队
      }
    })
  }
}

// ✅ Kafka 流处理
import { Kafka } from 'kafkajs'

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const consumer = kafka.consumer({ groupId: 'order-processor' })

await consumer.subscribe({ topic: 'orders' })
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value.toString())
    await processOrder(order)
  }
})
```

---

## 3. 数据库优化

### 3.1 PostgreSQL 高级

```sql
-- ✅ 物化视图
CREATE MATERIALIZED VIEW user_stats AS
SELECT user_id, COUNT(*) as order_count, SUM(amount) as total_amount
FROM orders
GROUP BY user_id;

-- 刷新
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;

-- ✅ 分区表
CREATE TABLE orders (
  id BIGSERIAL,
  user_id BIGINT,
  created_at TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- ✅ JSONB 查询
SELECT * FROM products 
WHERE metadata @> '{"category": "electronics"}';

-- ✅ 全文搜索
CREATE INDEX idx_search ON documents USING GIN(to_tsvector('english', content));
SELECT * FROM documents 
WHERE to_tsvector('english', content) @@ to_tsquery('search & terms');
```

### 3.2 Redis 缓存策略

```typescript
// ✅ 缓存模式
class CacheManager {
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached)
    
    const data = await fetcher()
    await this.redis.setex(key, ttl, JSON.stringify(data))
    return data
  }
  
  // ✅ 缓存穿透防护
  async getWithLock(key: string) {
    const lock = await this.redis.set(`${key}:lock`, '1', 'EX', 10, 'NX')
    if (!lock) {
      // 等待其他请求完成
      await this.sleep(100)
      return this.getWithLock(key)
    }
    
    try {
      // 查询数据库
      return await this.fetchFromDB(key)
    } finally {
      await this.redis.del(`${key}:lock`)
    }
  }
  
  // ✅ 缓存雪崩防护（随机 TTL）
  async setWithJitter(key: string, value: any, baseTTL: number) {
    const jitter = Math.random() * 0.2 * baseTTL
    await this.redis.setex(key, baseTTL + jitter, JSON.stringify(value))
  }
}
```

### 3.3 MongoDB 优化

```typescript
// ✅ 聚合管道优化
const pipeline = [
  { $match: { status: 'active', created_at: { $gte: startDate } } },
  { $sort: { created_at: -1 } },
  { $limit: 100 },
  { $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user'
    }
  },
  { $unwind: '$user' },
  { $project: {
      _id: 1,
      amount: 1,
      'user.name': 1,
      'user.email': 1
    }
  }
]

// ✅ 索引提示
db.orders.find({ user_id: 123 })
  .hint({ user_id: 1, created_at: -1 })

// ✅ 分片集群
sh.shardCollection('ecommerce.orders', { user_id: 'hashed' })
```

---

## 4. 架构设计

### 4.1 设计模式

```typescript
// ✅ 仓库模式
interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(filter: Filter<T>): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: string): Promise<void>
}

class UserRepository implements Repository<User> {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    return this.db.users.findOne({ id })
  }
}

// ✅ CQRS 模式
class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}

class CreateUserHandler {
  constructor(
    private userRepo: UserRepository,
    private eventBus: EventBus
  ) {}
  
  async execute(command: CreateUserCommand) {
    const user = User.create(command.email, command.password)
    await this.userRepo.save(user)
    await this.eventBus.publish(new UserCreatedEvent(user))
    return user
  }
}

// ✅ 策略模式
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>
}

class StripePayment implements PaymentStrategy {
  async pay(amount: number) { /* ... */ }
}

class PayPalPayment implements PaymentStrategy {
  async pay(amount: number) { /* ... */ }
}

class PaymentContext {
  constructor(private strategy: PaymentStrategy) {}
  
  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy
  }
  
  async process(amount: number) {
    return this.strategy.pay(amount)
  }
}
```

### 4.2 事件驱动架构

```typescript
// ✅ 事件总线
type EventHandler<T> = (event: T) => Promise<void>

class EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map()
  
  subscribe<T>(event: string, handler: EventHandler<T>) {
    const handlers = this.handlers.get(event) || []
    handlers.push(handler)
    this.handlers.set(event, handlers)
  }
  
  async publish<T>(event: string, data: T) {
    const handlers = this.handlers.get(event) || []
    await Promise.all(handlers.map(h => h(data)))
  }
}

// ✅ 事件溯源
class EventStore {
  async append(streamId: string, events: Event[]) {
    await this.db.events.insertMany(
      events.map(e => ({ streamId, ...e }))
    )
  }
  
  async getStream(streamId: string): Promise<Event[]> {
    return this.db.events.find({ streamId }).sort({ version: 1 })
  }
  
  async rebuildAggregate(streamId: string): Promise<Aggregate> {
    const events = await this.getStream(streamId)
    const aggregate = new Aggregate()
    for (const event of events) {
      aggregate.apply(event)
    }
    return aggregate
  }
}
```

### 4.3 分布式事务

```typescript
// ✅ Saga 模式
class OrderSaga {
  async createOrder(orderData: OrderData) {
    try {
      // 1. 创建订单
      const order = await this.orderService.create(orderData)
      
      // 2. 扣减库存
      await this.inventoryService.reserve(order.items)
      
      // 3. 创建支付
      const payment = await this.paymentService.create(order.total)
      
      // 4. 确认支付
      await this.paymentService.confirm(payment.id)
      
      return order
    } catch (error) {
      // 补偿事务
      await this.compensate(orderData)
      throw error
    }
  }
  
  private async compensate(orderData: OrderData) {
    await this.inventoryService.release(orderData.items)
    // ... 其他补偿
  }
}

// ✅ 两阶段提交
class TwoPhaseCommit {
  async commit(participants: Participant[]) {
    // Phase 1: Prepare
    const prepares = await Promise.all(
      participants.map(p => p.prepare())
    )
    
    if (prepares.every(p => p.ready)) {
      // Phase 2: Commit
      await Promise.all(participants.map(p => p.commit()))
    } else {
      // Rollback
      await Promise.all(participants.map(p => p.rollback()))
    }
  }
}
```

---

## 5. 性能优化

### 5.1 前端性能

```typescript
// ✅ Web Vitals 优化
// LCP (Largest Contentful Paint)
// - 预加载关键资源
<link rel="preload" href="/hero-image.jpg" as="image" />
// - 使用适当的图片格式
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="" />
</picture>

// FID (First Input Delay) / INP (Interaction to Next Paint)
// - 代码分割
// - Web Workers 处理重任务
const worker = new Worker('./heavy-task.js')

// CLS (Cumulative Layout Shift)
// - 预留空间
<div style="aspect-ratio: 16/9">
  <img src="..." />
</div>

// ✅ Service Worker 缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        const clone = response.clone()
        caches.open('v1').then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      return cached || fetched
    })
  )
})
```

### 5.2 后端性能

```typescript
// ✅ 连接池
import { Pool } from 'pg'

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// ✅ 批量操作
async function batchInsert(items: any[]) {
  const chunks = chunk(items, 1000)
  for (const chunk of chunks) {
    await db.query(
      'INSERT INTO table (col1, col2) VALUES ' + 
      chunk.map(() => '($1, $2)').join(', '),
      chunk.flatMap(i => [i.col1, i.col2])
    )
  }
}

// ✅ 并行处理
const results = await Promise.all(
  urls.map(url => fetch(url))
)

// ✅ 结果缓存
import NodeCache from 'node-cache'
const cache = new NodeCache({ stdTTL: 300 })

async function getCached(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key)
  if (cached) return cached
  
  const result = await fetcher()
  cache.set(key, result)
  return result
}
```

### 5.3 监控与调优

```typescript
// ✅ APM 集成
import { tracer } from 'dd-trace'

tracer.init({
  service: 'my-app',
  env: 'production'
})

// ✅ 自定义指标
import { Counter, Histogram } from 'prom-client'

const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests'
})

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  buckets: [0.1, 0.5, 1, 2, 5]
})

// ✅ 健康检查
app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs()
  ])
  
  const healthy = checks.every(c => c.ok)
  res.status(healthy ? 200 : 503).json({ checks })
})
```

---

## 6. 安全加固

### 6.1 认证授权

```typescript
// ✅ JWT 认证
import jwt from 'jsonwebtoken'

function generateToken(user: User): string {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d', issuer: 'my-app' }
  )
}

function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'my-app'
  })
}

// ✅ RBAC 权限控制
class PermissionGuard {
  private permissions: Map<string, string[]> = new Map([
    ['admin', ['read', 'write', 'delete']],
    ['editor', ['read', 'write']],
    ['viewer', ['read']]
  ])
  
  async can(user: User, action: string, resource: string): Promise<boolean> {
    const userPermissions = this.permissions.get(user.role) || []
    return userPermissions.includes(action)
  }
}

// 装饰器实现
function RequirePermission(action: string, resource: string) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const user = this.request.user
      const guard = new PermissionGuard()
      
      if (!await guard.can(user, action, resource)) {
        throw new ForbiddenError()
      }
      
      return original.apply(this, args)
    }
  }
}
```

### 6.2 安全防护

```typescript
// ✅ XSS 防护
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(userInput)

// ✅ CSRF 防护
import csurf from 'csurf'
app.use(csurf({ cookie: true }))

// ✅ 速率限制
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
})
app.use('/api/', limiter)

// ✅ SQL 注入防护
// ✅ 使用参数化查询
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
)

// ✅ 输入验证
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/),
  name: z.string().min(1).max(50)
})

function validateInput(data: any) {
  return CreateUserSchema.parse(data)
}
```

### 6.3 安全最佳实践

```typescript
// ✅ 密码哈希
import bcrypt from 'bcrypt'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ✅ 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  next()
})

// ✅ 敏感数据加密
import crypto from 'crypto'

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}
```

---

## 总结

本知识体系覆盖：
- ✅ 前端：Vue 3/React 高级模式、性能优化、状态管理、TypeScript 高级类型
- ✅ 后端：Node.js/Python 高级特性、流处理、异步编程
- ✅ 数据库：索引优化、查询优化、分库分表、缓存策略
- ✅ API：REST/GraphQL/gRPC 设计
- ✅ 架构：微服务、事件驱动、分布式事务
- ✅ 安全：认证授权、XSS/CSRF/SQL 注入防护

**能力等级：5/5** 🎯
