# 代码审查指南 - 国际水准

> 创建时间：2026-03-09  
> 版本：v1.0  
> 目标：建立国际顶级代码质量标准（5/5）

---

## 📋 目录

1. [审查流程](#1-审查流程)
2. [代码质量标准](#2-代码质量标准)
3. [安全审查](#3-安全审查)
4. [性能审查](#4-性能审查)
5. [测试审查](#5-测试审查)
6. [文档审查](#6-文档审查)
7. [审查清单](#7-审查清单)

---

## 1. 审查流程

### 1.1 PR 提交流程

```markdown
## PR 模板

### 📝 变更描述
清晰描述本次 PR 的目的和变更内容。

### 🔗 关联 Issue
- Fixes #123
- Related to #456

### 🧪 测试覆盖
- [ ] 单元测试已添加/更新
- [ ] 集成测试已通过
- [ ] 手动测试场景已验证

### 📊 性能影响
- [ ] 无性能影响
- [ ] 性能优化（附基准测试）
- [ ] 性能下降（需说明原因）

### 🔒 安全考虑
- [ ] 无安全影响
- [ ] 已进行安全审查
- [ ] 需要额外安全审计

### 📸 截图/录屏
如适用，提供 UI 变更的视觉证明。
```

### 1.2 审查角色

| 角色 | 职责 | 要求 |
|------|------|------|
| Author | 提交 PR，回应评论 | PR 描述完整，测试通过 |
| Reviewer | 代码审查，提出建议 | 24 小时内响应，建设性反馈 |
| Approver | 最终批准，合并决策 | 资深开发者，了解全局 |
| Merge Bot | 自动合并（满足条件时） | CI 全绿，审查通过 |

### 1.3 审查时间 SLA

```
PR 大小          审查时限      批准人数
─────────────────────────────────────
小型 (< 100 行)    24 小时       1 人
中型 (100-500 行)  48 小时       2 人
大型 (> 500 行)    72 小时       2 人 + 架构师
紧急修复           4 小时        1 人 (事后审查)
```

### 1.4 审查反馈规范

```typescript
// ✅ 好的审查评论

// 具体且可操作
❌ "这段代码有问题"
✅ "这里可能为空指针，建议添加空值检查：if (user === null) return"

// 解释原因
❌ "用 map 替代 forEach"
✅ "建议使用 map()，因为我们正在转换数组且需要返回值，这样代码更清晰"

// 提供代码示例
❌ "性能不好"
✅ "这里可以添加缓存避免重复计算：
    const cached = cache.get(key)
    if (cached) return cached
    const result = expensiveComputation()
    cache.set(key, result)
    return result"

// 区分必须和建议
❌ "改一下这个"
✅ "[必须] 修复 SQL 注入风险"
✅ "[建议] 提取为独立函数提高可读性"
```

---

## 2. 代码质量标准

### 2.1 可读性

```typescript
// ✅ 命名规范

// 变量名
❌ const d = new Date()
✅ const currentDate = new Date()

// 函数名
❌ function proc(data) { ... }
✅ function processUserOrder(order: Order) { ... }

// 布尔值
❌ const write = true
✅ const isWritable = true

// 常量
❌ const max = 100
✅ const MAX_RETRY_COUNT = 100

// ✅ 函数设计

// 单一职责
❌ function handleUser() {
  // 验证
  // 保存
  // 发送邮件
  // 记录日志
}

✅ function validateUser(user: User): ValidationResult { ... }
✅ function saveUser(user: User): Promise<User> { ... }
✅ function sendWelcomeEmail(user: User): Promise<void> { ... }

// 参数数量
❌ function createUser(name, email, age, address, phone, role, department, manager)
✅ function createUser(userData: CreateUserDTO)

// 函数长度
❌ function process() {  // 200 行
  // ...
}

✅ function process() {
  const step1 = doStep1()
  const step2 = doStep2(step1)
  const step3 = doStep3(step2)
  return finalize(step3)
}

// ✅ 注释规范

// 解释为什么，而不是是什么
❌ i++  // i 加 1
✅ i++  // 跳过 header 行

// 说明复杂逻辑
/**
 * 使用指数退避算法计算重试延迟
 * 公式：delay = baseDelay * 2 ^ (attempt - 1)
 * 最大延迟不超过 maxDelay
 */
function calculateRetryDelay(attempt: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
}

// TODO/FIXME 标记
// TODO: 迁移到新 API 后移除此兼容层
// FIXME: 存在竞态条件，需要使用互斥锁
// HACK: 临时解决方案，等待上游修复后移除
// XXX: 性能瓶颈，需要优化
```

### 2.2 可维护性

```typescript
// ✅ DRY 原则

// 提取重复逻辑
❌ 
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId])
const product = await db.query('SELECT * FROM products WHERE id = $1', [productId])

✅
async function findById<T>(table: string, id: string): Promise<T | null> {
  const result = await db.query(
    `SELECT * FROM ${table} WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

// ✅ 配置外部化

❌
const API_URL = 'https://api.example.com'
const TIMEOUT = 5000
const RETRY_COUNT = 3

✅
const config = {
  apiUrl: process.env.API_URL,
  timeout: parseInt(process.env.API_TIMEOUT || '5000'),
  retryCount: parseInt(process.env.API_RETRY_COUNT || '3')
}

// ✅ 依赖注入

❌
class UserService {
  private db = new Database()
  private cache = new Redis()
  private logger = new Logger()
}

✅
class UserService {
  constructor(
    private db: Database,
    private cache: Cache,
    private logger: Logger
  ) {}
}

// ✅ 错误处理

❌
try {
  await doSomething()
} catch (e) {
  console.log('Error')
}

✅
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public isOperational = true
  ) {
    super(message)
  }
}

try {
  await doSomething()
} catch (error) {
  if (error instanceof AppError) {
    logger.warn({ code: error.code }, error.message)
    throw error
  }
  logger.error({ error }, 'Unexpected error')
  throw new AppError('Internal server error', 'INTERNAL_ERROR', 500)
}
```

### 2.3 TypeScript 规范

```typescript
// ✅ 类型定义

// 避免 any
❌ function process(data: any): any { ... }
✅ function process(data: ProcessInput): ProcessOutput { ... }

// 使用接口定义对象形状
❌ 
type User = {
  id: string
  name: string
  email: string
}

✅
interface User {
  id: string
  name: string
  email: string
}

// 联合类型替代枚举
❌
enum Status {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

✅
type Status = 'pending' | 'approved' | 'rejected'

// 工具类型
type CreateUserInput = Omit<User, 'id' | 'createdAt'>
type UserUpdateInput = Partial<CreateUserInput>
type UserPublic = Pick<User, 'id' | 'name'>

// ✅ 泛型使用

// 泛型约束
interface Identifiable {
  id: string
}

function findById<T extends Identifiable>(items: T[], id: string): T | null {
  return items.find(item => item.id === id) || null
}

// 泛型工具
type AsyncHandler<T> = (req: Request, res: Response) => Promise<T>

function asyncHandler<T>(handler: AsyncHandler<T>): AsyncHandler<T> {
  return async (req, res) => {
    try {
      const result = await handler(req, res)
      return res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

// ✅ 类型守卫

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj
  )
}

// 使用
if (isUser(data)) {
  // data 被推断为 User 类型
  console.log(data.name)
}
```

---

## 3. 安全审查

### 3.1 输入验证

```typescript
// ✅ 使用验证库

import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(1).max(50),
  age: z.number().int().min(0).max(150).optional()
})

// 使用
function createUser(input: unknown) {
  const validated = CreateUserSchema.parse(input)
  // validated 类型为 CreateUserInput
}

// ✅ SQL 注入防护

❌
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
)

✅
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
)

// ✅ XSS 防护

❌
<div dangerouslySetInnerHTML={{ __html: userContent }} />

✅
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userContent)
<div dangerouslySetInnerHTML={{ __html: clean }} />

// ✅ 路径遍历防护

❌
const filePath = path.join(baseDir, userInput)
const content = fs.readFileSync(filePath)

✅
const filePath = path.join(baseDir, userInput)
const resolvedPath = path.resolve(filePath)
if (!resolvedPath.startsWith(baseDir)) {
  throw new Error('Invalid path')
}
const content = fs.readFileSync(resolvedPath)
```

### 3.2 认证授权

```typescript
// ✅ JWT 安全

❌
const token = jwt.sign({ userId }, 'secret')

✅
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET!,
  {
    expiresIn: '7d',
    issuer: 'my-app',
    audience: 'my-app-users'
  }
)

// 验证
const payload = jwt.verify(token, process.env.JWT_SECRET!, {
  issuer: 'my-app',
  audience: 'my-app-users'
})

// ✅ 密码处理

❌
const hash = crypto.createHash('md5').update(password).digest('hex')

✅
import bcrypt from 'bcrypt'
const saltRounds = 12
const hash = await bcrypt.hash(password, saltRounds)
const isValid = await bcrypt.compare(password, hash)

// ✅ 权限检查

❌
async function deleteUser(userId: string) {
  await db.users.delete({ id: userId })
}

✅
async function deleteUser(requester: User, targetUserId: string) {
  if (requester.role !== 'admin' && requester.id !== targetUserId) {
    throw new ForbiddenError('Cannot delete other users')
  }
  await db.users.delete({ id: targetUserId })
}
```

### 3.3 敏感数据

```typescript
// ✅ 日志脱敏

import pino from 'pino'

const logger = pino({
  redact: {
    paths: ['password', 'token', 'secret', '*.creditCard'],
    censor: '[REDACTED]'
  }
})

// ✅ 环境变量

❌
const apiKey = 'sk-1234567890'

✅
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error('API_KEY environment variable is required')
}

// ✅ 加密存储

import crypto from 'crypto'

function encrypt(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

function decrypt(encrypted: string, key: Buffer): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

---

## 4. 性能审查

### 4.1 代码级性能

```typescript
// ✅ 时间复杂度检查

❌
function findDuplicates(arr1: number[], arr2: number[]) {
  const duplicates = []
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      if (item1 === item2) {
        duplicates.push(item1)
      }
    }
  }
  return duplicates  // O(n*m)
}

✅
function findDuplicates(arr1: number[], arr2: number[]) {
  const set2 = new Set(arr2)
  return arr1.filter(item => set2.has(item))  // O(n+m)
}

// ✅ 内存泄漏检查

❌
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map()
  
  on(event: string, listener: Function) {
    const listeners = this.listeners.get(event) || []
    listeners.push(listener)
    this.listeners.set(event, listeners)
    // 从未移除
  }
}

✅
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map()
  
  on(event: string, listener: Function) {
    const listeners = this.listeners.get(event) || []
    listeners.push(listener)
    this.listeners.set(event, listeners)
    
    return () => this.off(event, listener)
  }
  
  off(event: string, listener: Function) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) listeners.splice(index, 1)
    }
  }
}

// ✅ 数据库 N+1 查询

❌
const users = await db.users.findAll()
for (const user of users) {
  user.orders = await db.orders.findAll({ userId: user.id })
}

✅
const users = await db.users.findAll({
  include: [{ model: Order, as: 'orders' }]
})

// 或使用 DataLoader
const userLoader = new DataLoader(async (userIds) => {
  const orders = await db.orders.findAll({
    where: { userId: { [Op.in]: userIds } }
  })
  return userIds.map(id => orders.filter(o => o.userId === id))
})

const orders = await userLoader.loadMany(userIds)
```

### 4.2 资源使用

```typescript
// ✅ 连接管理

❌
async function query(sql: string) {
  const client = await pool.connect()
  return await client.query(sql)
  // 连接未释放
}

✅
async function query(sql: string) {
  const client = await pool.connect()
  try {
    return await client.query(sql)
  } finally {
    client.release()
  }
}

// ✅ 流处理

❌
const data = fs.readFileSync('large-file.json')
const parsed = JSON.parse(data)

✅
const stream = fs.createReadStream('large-file.json')
const parser = new JSONStream()
stream.pipe(parser)

// ✅ 批量操作

❌
for (const item of items) {
  await db.insert('table', item)
}

✅
await db.insertMany('table', items)
// 或分批
const chunks = chunk(items, 1000)
for (const chunk of chunks) {
  await db.insertMany('table', chunk)
}
```

---

## 5. 测试审查

### 5.1 测试覆盖

```typescript
// ✅ 单元测试

import { describe, it, expect, vi } from 'vitest'

describe('UserService', () => {
  let userService: UserService
  let mockDb: MockDatabase
  
  beforeEach(() => {
    mockDb = new MockDatabase()
    userService = new UserService(mockDb)
  })
  
  it('should create user with valid input', async () => {
    const input = { email: 'test@example.com', name: 'Test' }
    
    const user = await userService.create(input)
    
    expect(user.email).toBe(input.email)
    expect(user.name).toBe(input.name)
    expect(user.id).toBeDefined()
  })
  
  it('should throw error for duplicate email', async () => {
    await mockDb.users.create({ email: 'existing@example.com' })
    
    await expect(
      userService.create({ email: 'existing@example.com', name: 'Test' })
    ).rejects.toThrow('Email already exists')
  })
  
  it('should hash password before saving', async () => {
    const input = { email: 'test@example.com', password: 'plain' }
    
    const user = await userService.create(input)
    
    expect(user.password).not.toBe('plain')
    expect(await bcrypt.compare('plain', user.password)).toBe(true)
  })
})

// ✅ 集成测试

describe('User API', () => {
  let app: Express
  let server: Server
  
  beforeAll(() => {
    app = createApp()
    server = app.listen(3001)
  })
  
  afterAll(() => {
    server.close()
  })
  
  it('POST /api/users should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' })
    
    expect(response.status).toBe(201)
    expect(response.body.data.email).toBe('test@example.com')
  })
  
  it('GET /api/users/:id should return user', async () => {
    const user = await createUser()
    
    const response = await request(app)
      .get(`/api/users/${user.id}`)
    
    expect(response.status).toBe(200)
    expect(response.body.data.id).toBe(user.id)
  })
})

// ✅ E2E 测试

import { test, expect } from '@playwright/test'

test('user can complete registration flow', async ({ page }) => {
  await page.goto('/register')
  
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'Password123')
  await page.fill('[name=confirmPassword]', 'Password123')
  await page.click('button[type=submit]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('.welcome-message')).toBeVisible()
})
```

### 5.2 测试质量

```typescript
// ✅ 测试命名

❌
it('works', () => { ... })
it('test1', () => { ... })

✅
it('should create user with valid input', () => { ... })
it('should throw error when email is duplicate', () => { ... })
it('should hash password before saving', () => { ... })

// ✅ 测试隔离

❌
let user: User

beforeAll(async () => {
  user = await createUser()  // 共享状态
})

it('test1', () => {
  // 修改 user
})

it('test2', () => {
  // user 已被修改
})

✅
it('test1', async () => {
  const user = await createUser()
  // ...
})

it('test2', async () => {
  const user = await createUser()
  // ...
})

// ✅ 边界条件测试

describe('calculateDiscount', () => {
  it('should return 0 for negative amount', () => {
    expect(calculateDiscount(-100)).toBe(0)
  })
  
  it('should return 0 for zero amount', () => {
    expect(calculateDiscount(0)).toBe(0)
  })
  
  it('should apply discount for positive amount', () => {
    expect(calculateDiscount(100)).toBe(10)
  })
  
  it('should cap discount at maximum', () => {
    expect(calculateDiscount(1000000)).toBe(1000)  // max discount
  })
})
```

---

## 6. 文档审查

### 6.1 API 文档

```markdown
## API: User Management

### Create User

**POST** `/api/v1/users`

#### Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "user"
}
```

#### Response

**201 Created**
```json
{
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Errors

| Code | Message | Description |
|------|---------|-------------|
| 400 | INVALID_EMAIL | Email format is invalid |
| 400 | WEAK_PASSWORD | Password does not meet requirements |
| 409 | EMAIL_EXISTS | Email already registered |
| 429 | RATE_LIMITED | Too many registration attempts |

#### Rate Limits

- 10 requests per minute per IP
- 100 requests per hour per IP
```

### 6.2 代码文档

```typescript
/**
 * 创建新用户
 * 
 * @param input - 用户创建信息
 * @param input.email - 用户邮箱（必须唯一）
 * @param input.password - 用户密码（至少 8 位，包含大小写字母和数字）
 * @param input.name - 用户显示名称
 * @param input.role - 用户角色（默认：'user'）
 * 
 * @returns 创建的用户对象（不含密码）
 * 
 * @throws {ValidationError} 当输入验证失败时
 * @throws {DuplicateEmailError} 当邮箱已存在时
 * @throws {DatabaseError} 当数据库操作失败时
 * 
 * @example
 * ```typescript
 * const user = await userService.create({
 *   email: 'john@example.com',
 *   password: 'SecurePass123',
 *   name: 'John Doe'
 * })
 * ```
 * 
 * @see {@link UserService.update}
 * @see {@link UserService.delete}
 */
async create(input: CreateUserInput): Promise<User> {
  // ...
}
```

### 6.3 README 规范

```markdown
# Project Name

简短描述项目的目的和核心价值。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 配置环境
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 📦 功能特性

- ✅ 功能 1
- ✅ 功能 2
- ✅ 功能 3

## 🏗️ 架构

```
src/
├── controllers/    # HTTP 请求处理
├── services/       # 业务逻辑
├── repositories/   # 数据访问
├── models/         # 数据模型
└── utils/          # 工具函数
```

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖
npm run test:coverage

# E2E 测试
npm run test:e2e
```

## 📖 API 文档

详见 [API.md](./docs/API.md)

## 🤝 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

MIT License
```

---

## 7. 审查清单

### 7.1 通用检查清单

```markdown
## 代码审查清单

### 功能正确性
- [ ] 代码实现符合需求
- [ ] 边界条件已处理
- [ ] 错误处理完整
- [ ] 无逻辑错误

### 代码质量
- [ ] 命名清晰有意义
- [ ] 函数职责单一
- [ ] 无重复代码 (DRY)
- [ ] 代码简洁 (KISS)

### 安全性
- [ ] 输入已验证
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险
- [ ] 敏感数据已加密
- [ ] 权限检查完整

### 性能
- [ ] 无明显的性能问题
- [ ] 数据库查询已优化
- [ ] 无内存泄漏风险
- [ ] 缓存使用合理

### 测试
- [ ] 单元测试已添加
- [ ] 测试覆盖关键路径
- [ ] 测试通过
- [ ] 无 flaky 测试

### 文档
- [ ] 代码注释清晰
- [ ] API 文档已更新
- [ ] README 已更新（如需要）
- [ ] 变更日志已更新

### 可维护性
- [ ] 代码易于理解
- [ ] 配置外部化
- [ ] 日志记录完整
- [ ] 监控指标已添加
```

### 7.2 语言特定清单

#### TypeScript/JavaScript

```markdown
- [ ] 类型定义完整，避免 any
- [ ] 使用了适当的工具类型
- [ ] 异步错误已处理
- [ ] Promise 链或 async/await 一致
- [ ] 事件监听器已清理
```

#### Python

```markdown
- [ ] 遵循 PEP 8 规范
- [ ] 类型注解完整
- [ ] 异常处理适当
- [ ] 资源管理使用上下文管理器
- [ ] 无循环导入
```

#### SQL

```markdown
- [ ] 使用参数化查询
- [ ] 索引使用合理
- [ ] 避免 SELECT *
- [ ] 事务使用适当
- [ ] 查询已 EXPLAIN 分析
```

### 7.3 审查决策

```markdown
## 审查结果

### Approve (批准)
- 代码质量高
- 无重大问题
- 可直接合并

### Request Changes (要求修改)
- 存在必须修复的问题
- 需要重新审查

### Comment (评论)
- 有建议但非必须
- 作者可自行决定

### LGTM (Looks Good To Me)
- 代码看起来不错
- 无阻碍合并的问题
```

---

## 总结

### 审查原则

1. **建设性**：提供具体、可操作的反馈
2. **及时性**：24 小时内响应
3. **尊重**：对事不对人
4. **学习**：审查是互相学习的机会
5. **自动化**：让工具处理格式、lint 等机械检查

### 审查指标

| 指标 | 目标 | 测量 |
|------|------|------|
| 审查响应时间 | < 24h | 从 PR 创建到首次评论 |
| 审查周期 | < 72h | 从 PR 创建到合并 |
| 缺陷逃逸率 | < 1% | 生产环境 bug / 代码行数 |
| 审查覆盖率 | 100% | 有审查的 PR / 总 PR 数 |

**能力等级：5/5** 🎯
