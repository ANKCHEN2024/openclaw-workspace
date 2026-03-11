# 数字孪生 MVP 技术架构

**版本：** 1.0  
**日期：** 2026-03-11  
**作者：** MOSS（AI 合伙人）  
**阶段：** Phase 2 技术预研

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户层 (User Layer)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Web 端     │  │   移动端    │  │   大屏端    │  │   API 调用    │    │
│  │  (React)    │  │  (H5)       │  │  (Web)      │  │  (REST)     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         接入层 (Gateway Layer)                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Nginx + SSL Termination                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   REST API  │  │  WebSocket  │  │   静态资源   │  │   限流熔断   │   │
│  │   /api/*    │  │   /ws/*     │  │   /static/* │  │   (Rate)    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        应用层 (Application Layer)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   3D 渲染服务    │  │   实时数据服务   │  │   AI 交互服务    │         │
│  │   (Three.js)   │  │   (WebSocket)   │  │   (Qwen API)   │         │
│  │                 │  │                 │  │                 │         │
│  │ - 场景加载      │  │ - 设备状态推送   │  │ - 意图识别      │         │
│  │ - 设备渲染      │  │ - 告警推送      │  │ - RAG 检索       │         │
│  │ - 交互处理      │  │ - 数据订阅      │  │ - 命令执行      │         │
│  │ - 相机控制      │  │ - 心跳检测      │  │ - 对话管理      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   业务逻辑服务   │  │   数据接入服务   │  │   用户管理服务   │         │
│  │   (Business)   │  │   (Data Ingest) │  │   (Auth)       │         │
│  │                 │  │                 │  │                 │         │
│  │ - 设备管理      │  │ - 协议适配      │  │ - 登录认证      │         │
│  │ - 场景管理      │  │ - 数据解析      │  │ - 权限控制      │         │
│  │ - 告警规则      │  │ - 数据清洗      │  │ - 会话管理      │         │
│  │ - 报表统计      │  │ - 数据存储      │  │ - 操作日志      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          数据层 (Data Layer)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PostgreSQL  │  │    Redis    │  │  InfluxDB   │  │   Milvus    │    │
│  │ (业务数据)   │  │  (缓存/会话) │  │  (时序数据)  │  │  (向量库)   │    │
│  │             │  │             │  │             │  │             │    │
│  │ - 用户      │  │ - Session   │  │ - 设备指标   │  │ - 设备知识   │    │
│  │ - 设备      │  │ - Cache     │  │ - 历史数据   │  │ - 操作手册   │    │
│  │ - 场景      │  │ - Pub/Sub   │  │ - 告警记录   │  │ - FAQ       │    │
│  │ - 告警规则   │  │ - 限流      │  │ - 性能数据   │  │ -  embeddings│    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        外部服务 (External Services)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Qwen API   │  │  IoT 平台    │  │  对象存储    │  │  消息推送    │    │
│  │  (阿里云)   │  │  (第三方)   │  │  (OSS/S3)   │  │  (短信/邮件) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块设计

### 2.1 3D 渲染模块

#### 模块职责
- 加载和管理 3D 场景（园区/工厂/楼宇）
- 渲染设备模型并实时更新状态
- 处理用户交互（点击、拖拽、缩放）
- 相机控制和场景导航

#### 技术选型
```
Three.js r160+
├── React Three Fiber (React 集成)
├── @react-three/drei (辅助组件)
│   ├── OrbitControls (相机控制)
│   ├── Stats (性能监控)
│   ├── Html (HTML 叠加层)
│   └── Text (3D 文字)
├── @react-three/postprocessing (后处理)
│   ├── Bloom (辉光)
│   ├── SSAO (环境光遮蔽)
│   └── DepthOfField (景深)
└── glTF-Transform (模型优化)
    ├── Draco (几何压缩)
    └── KTX2 (纹理压缩)
```

#### 核心组件

```typescript
// 场景管理器
interface SceneManager {
  loadScene(sceneId: string): Promise<void>;
  unloadScene(): void;
  addDevice(device: DeviceModel): void;
  removeDevice(deviceId: string): void;
  updateDevice(deviceId: string, data: DeviceData): void;
  highlightDevice(deviceId: string): void;
  focusDevice(deviceId: string): void;
}

// 设备模型
interface DeviceModel {
  id: string;
  name: string;
  type: DeviceType;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  modelUrl: string;
  status: DeviceStatus;
  metrics: Record<string, number>;
}

// 渲染配置
interface RenderConfig {
  antialias: boolean;
  shadows: boolean;
  pixelRatio: number;
  fps: number;
  lodDistance: number[];
}
```

#### 性能优化策略

| 优化项 | 技术方案 | 目标 |
|-------|---------|------|
| 模型压缩 | Draco + KTX2 | 加载时间 <3s |
| 实例化渲染 | InstancedMesh | 同类型设备 1000+ |
| LOD 系统 | 3 级 LOD | 远距离自动降级 |
| 视锥体裁剪 | 内置 | 自动剔除 |
| 纹理图集 | Texture Atlas | 减少绘制调用 |
| 延迟渲染 | 按需加载 | 首屏 <2s |

---

### 2.2 实时数据模块

#### 模块职责
- 建立和维护 WebSocket 连接
- 订阅设备数据更新
- 推送告警和事件
- 心跳检测和断线重连

#### 架构设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   客户端     │────▶│  WebSocket  │────▶│  消息路由    │
│  (浏览器)   │◀────│   Server    │◀────│  (Router)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   ▼
                           │          ┌─────────────┐
                           │          │  设备订阅    │
                           │          │  管理器      │
                           │          └─────────────┘
                           │                   │
                           ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐
                  │   心跳检测   │     │  数据推送    │
                  │  (Ping/Pong)│     │  (Publish)  │
                  └─────────────┘     └─────────────┘
```

#### 消息协议

```typescript
// 客户端 → 服务端
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'command';
  payload: {
    deviceIds?: string[];
    command?: string;
    params?: Record<string, any>;
  };
}

// 服务端 → 客户端
interface ServerMessage {
  type: 'device_update' | 'alarm' | 'error' | 'pong';
  timestamp: number;
  payload: {
    deviceId?: string;
    metrics?: Record<string, number>;
    status?: DeviceStatus;
    alarm?: AlarmData;
    error?: string;
  };
}
```

#### 连接管理

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectCount = 0;
  private maxReconnect = 5;
  private heartbeatInterval: number | null = null;

  connect(url: string): Promise<void> {
    // 建立连接
    // 启动心跳
    // 订阅默认设备
  }

  disconnect(): void {
    // 停止心跳
    // 关闭连接
  }

  subscribe(deviceIds: string[]): void {
    // 订阅设备
  }

  unsubscribe(deviceIds: string[]): void {
    // 取消订阅
  }

  private startHeartbeat(): void {
    // 每 30 秒发送 ping
    // 超时未响应则重连
  }

  private reconnect(): void {
    // 指数退避重连
    // 1s, 2s, 4s, 8s, 16s
  }
}
```

---

### 2.3 AI 交互模块

#### 模块职责
- 接收用户自然语言输入
- 调用 Qwen API 进行意图识别
- RAG 检索增强回答
- 执行设备控制命令

#### 架构设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户输入   │────▶│  Qwen API   │────▶│  意图解析    │
│  (自然语言) │     │  (意图识别) │     │  (Slot)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   ▼
                           │          ┌─────────────┐
                           │          │  RAG 检索    │
                           │          │  (向量库)   │
                           │          └─────────────┘
                           │                   │
                           ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐
                  │  回答生成    │     │  命令执行    │
                  │  (Qwen)     │     │  (设备 API)  │
                  └─────────────┘     └─────────────┘
```

#### Prompt 模板

```python
SYSTEM_PROMPT = """
你是一个数字孪生系统的 AI 助手。

可用设备类型：泵、阀门、传感器、电机、储罐、风机、传送带
可用指标：温度、压力、流量、转速、能耗、振动、液位
可用操作：查看、控制、预测、告警、历史、对比

请理解用户意图并返回 JSON：
{
  "intent": "query_device_metric | control_device | query_alarm | predict_trend",
  "slots": {
    "device_id": "device-003",
    "device_type": "pump",
    "metric": "temperature",
    "action": "open | close | set_value",
    "value": 50,
    "time_range": "current | last_hour | last_day | last_week"
  },
  "needs_rag": true | false,
  "rag_query": "相关检索词"
}
"""
```

#### RAG 流程

```python
def rag_query(user_query: str) -> str:
    # 1. 提取关键词
    keywords = extract_keywords(user_query)
    
    # 2. 向量检索
    similar_docs = vector_search(keywords, top_k=3)
    
    # 3. 构建上下文
    context = build_context(similar_docs)
    
    # 4. 调用 Qwen
    response = qwen_generate(
        prompt=user_query,
        context=context,
        system=SYSTEM_PROMPT
    )
    
    return response
```

#### 向量数据库设计

```typescript
// Milvus 集合定义
interface DeviceKnowledge {
  id: string;           // 主键
  device_id: string;    // 设备 ID
  device_name: string;  // 设备名称
  device_type: string;  // 设备类型
  content: string;      // 知识内容
  embedding: number[];  // 768 维向量
  created_at: number;   // 创建时间
}

// 索引配置
{
  index_type: 'HNSW',
  metric_type: 'L2',
  params: {
    M: 16,
    efConstruction: 200
  }
}
```

---

### 2.4 数据接入模块

#### 模块职责
- 适配多种 IoT 协议（MQTT、HTTP、Modbus）
- 解析设备数据
- 数据清洗和标准化
- 存储到时序数据库

#### 协议适配器

```typescript
interface ProtocolAdapter {
  connect(config: ConnectionConfig): Promise<void>;
  subscribe(topic: string): Promise<void>;
  parse(data: Buffer): DeviceData;
  disconnect(): void;
}

// MQTT 适配器
class MqttAdapter implements ProtocolAdapter {
  private client: MqttClient;
  
  async connect(config: MqttConfig): Promise<void> {
    this.client = mqtt.connect(config.url, {
      clientId: config.clientId,
      username: config.username,
      password: config.password
    });
  }
  
  async subscribe(topic: string): Promise<void> {
    this.client.subscribe(topic);
    this.client.on('message', (t, msg) => {
      const data = this.parse(msg);
      this.emit('data', data);
    });
  }
  
  parse(data: Buffer): DeviceData {
    const json = JSON.parse(data.toString());
    return {
      deviceId: json.device_id,
      timestamp: json.timestamp,
      metrics: json.metrics
    };
  }
}

// HTTP 适配器
class HttpAdapter implements ProtocolAdapter {
  // 轮询或 Webhook
}

// Modbus 适配器
class ModbusAdapter implements ProtocolAdapter {
  // 工业协议
}
```

#### 数据管道

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  协议适配器  │────▶│  数据清洗    │────▶│  标准化     │
│  (Adapter)  │     │  (Clean)    │     │  (Normalize)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐
                  │  规则引擎    │────▶│  告警检测    │
                  │  (Rules)    │     │  (Alarm)    │
                  └─────────────┘     └─────────────┘
                           │
                           ▼
                  ┌─────────────┐     ┌─────────────┐
                  │  InfluxDB   │     │  WebSocket  │
                  │  (存储)     │     │  (推送)     │
                  └─────────────┘     └─────────────┘
```

---

## 三、数据库设计

### 3.1 PostgreSQL Schema

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 设备表
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  location VARCHAR(200),
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  rotation_x FLOAT DEFAULT 0,
  rotation_y FLOAT DEFAULT 0,
  rotation_z FLOAT DEFAULT 0,
  model_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'offline',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 场景表
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  model_url VARCHAR(500),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 场景 - 设备关联表
CREATE TABLE scene_devices (
  scene_id UUID REFERENCES scenes(id),
  device_id UUID REFERENCES devices(id),
  PRIMARY KEY (scene_id, device_id)
);

-- 告警规则表
CREATE TABLE alarm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  device_id UUID REFERENCES devices(id),
  metric VARCHAR(50) NOT NULL,
  operator VARCHAR(10) NOT NULL,  -- >, <, >=, <=, ==
  threshold FLOAT NOT NULL,
  duration INT DEFAULT 0,  -- 持续时间（秒）
  level VARCHAR(20) DEFAULT 'warning',  -- info, warning, error, critical
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 告警记录表
CREATE TABLE alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alarm_rules(id),
  device_id UUID REFERENCES devices(id),
  metric VARCHAR(50),
  value FLOAT,
  level VARCHAR(20),
  message TEXT,
  status VARCHAR(20) DEFAULT 'active',  -- active, acknowledged, resolved
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_created_at ON alarms(created_at);
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
```

### 3.2 InfluxDB Schema

```
-- 测量：device_metrics
-- 标签：device_id, device_type, metric_name
-- 字段：value
-- 时间：timestamp

-- 写入示例
device_metrics,device_id=device-003,device_type=pump,metric_name=temperature value=65.5 1709999999000000000
device_metrics,device_id=device-003,device_type=pump,metric_name=pressure value=2.3 1709999999000000000

-- 查询示例（最近 1 小时）
SELECT mean("value") FROM "device_metrics" 
WHERE "device_id"='device-003' AND "metric_name"='temperature' 
AND time > now() - 1h GROUP BY time(1m)
```

### 3.3 Redis Key 设计

```
# Session
session:{session_id} → {user_id, expires_at}

# 设备缓存
device:{device_id} → {status, metrics, updated_at}  (TTL: 60s)

# 设备订阅
device:subscribers:{device_id} → [session_id1, session_id2, ...]

# 告警计数
alarm:count:{device_id}:{hour} → count

# 限流
ratelimit:{user_id}:{api} → count (TTL: 60s)

# WebSocket 连接
ws:connection:{session_id} → {server_id, connected_at}
```

---

## 四、API 设计

### 4.1 REST API

```yaml
# 设备管理
GET    /api/v1/devices              # 设备列表
POST   /api/v1/devices              # 创建设备
GET    /api/v1/devices/:id          # 设备详情
PUT    /api/v1/devices/:id          # 更新设备
DELETE /api/v1/devices/:id          # 删除设备
GET    /api/v1/devices/:id/metrics  # 设备指标（历史）

# 场景管理
GET    /api/v1/scenes               # 场景列表
POST   /api/v1/scenes               # 创建场景
GET    /api/v1/scenes/:id           # 场景详情
PUT    /api/v1/scenes/:id           # 更新场景
DELETE /api/v1/scenes/:id           # 删除场景

# 告警管理
GET    /api/v1/alarms               # 告警列表
PUT    /api/v1/alarms/:id/ack       # 确认告警
PUT    /api/v1/alarms/:id/resolve   # 解决告警
GET    /api/v1/alarm-rules          # 告警规则列表
POST   /api/v1/alarm-rules          # 创建告警规则

# AI 交互
POST   /api/v1/ai/chat              # AI 对话
POST   /api/v1/ai/command           # AI 命令执行

# 用户管理
POST   /api/v1/auth/login           # 登录
POST   /api/v1/auth/logout          # 登出
GET    /api/v1/users/me             # 当前用户
PUT    /api/v1/users/me             # 更新用户
```

### 4.2 WebSocket API

```typescript
// 连接
ws://api.example.com/ws?token={jwt_token}

// 客户端消息
{
  "type": "subscribe",
  "payload": {
    "deviceIds": ["device-001", "device-002"]
  }
}

{
  "type": "command",
  "payload": {
    "command": "set_device_value",
    "params": {
      "deviceId": "device-003",
      "metric": "target_speed",
      "value": 1500
    }
  }
}

// 服务端消息
{
  "type": "device_update",
  "timestamp": 1709999999000,
  "payload": {
    "deviceId": "device-003",
    "metrics": {
      "temperature": 65.5,
      "pressure": 2.3
    },
    "status": "running"
  }
}

{
  "type": "alarm",
  "timestamp": 1709999999000,
  "payload": {
    "alarmId": "alarm-001",
    "deviceId": "device-003",
    "metric": "temperature",
    "value": 85.0,
    "level": "critical",
    "message": "温度过高"
  }
}
```

---

## 五、部署架构

### 5.1 开发环境

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://localhost:8080
  
  api:
    build: ./api
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/twin
      - REDIS_URL=redis://redis:6379
      - INFLUXDB_URL=http://influxdb:8086
      - MILVUS_URL=milvus:19530
      - QWEN_API_KEY=${QWEN_API_KEY}
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
  
  influxdb:
    image: influxdb:2.7
    volumes:
      - influxdb_data:/var/lib/influxdb2
  
  milvus:
    image: milvusdb/milvus:latest
    volumes:
      - milvus_data:/var/lib/milvus
  
volumes:
  postgres_data:
  influxdb_data:
  milvus_data:
```

### 5.2 生产环境（阿里云）

```
┌─────────────────────────────────────────────────────────┐
│                     阿里云 VPC                           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              负载均衡 SLB                         │   │
│  │              (HTTPS 终止)                         │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│         ┌────────────────┼────────────────┐            │
│         ▼                ▼                ▼            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   ECS       │  │   ECS       │  │   ECS       │    │
│  │   Web 服务   │  │   API 服务   │  │  WebSocket  │    │
│  │   (Nginx)   │  │   (Node.js) │  │   Server    │    │
│  │   x2        │  │   x2        │  │   x2        │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   RDS       │  │ ElastiCache │  │   TSDB      │    │
│  │ PostgreSQL  │  │   Redis     │  │ InfluxDB    │    │
│  │   高可用     │  │   集群       │  │   自建       │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐                       │
│  │  向量检索    │  │   对象存储   │                       │
│  │  Milvus    │  │    OSS      │                       │
│  │   自建       │  │  (模型/文件) │                       │
│  └─────────────┘  └─────────────┘                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.3 成本估算（月）

| 资源 | 规格 | 数量 | 单价 | 小计 |
|-----|------|------|------|------|
| ECS（Web） | 2C4G | 2 | 200 元 | 400 元 |
| ECS（API） | 4C8G | 2 | 400 元 | 800 元 |
| RDS PostgreSQL | 2C4G 高可用 | 1 | 600 元 | 600 元 |
| ElastiCache Redis | 2G 集群 | 1 | 300 元 | 300 元 |
| InfluxDB | 自建 4C8G | 1 | 400 元 | 400 元 |
| Milvus | 自建 4C8G | 1 | 400 元 | 400 元 |
| OSS | 100GB | 1 | 50 元 | 50 元 |
| SLB | 性能保障 | 1 | 100 元 | 100 元 |
| **合计** | | | | **3050 元/月** |

---

## 六、安全设计

### 6.1 认证授权

```
JWT Token 流程：
1. 用户登录 → 验证密码 → 生成 JWT
2. JWT 包含：user_id, role, exp
3. 客户端存储 JWT（localStorage）
4. 每次请求携带：Authorization: Bearer {jwt}
5. 服务端验证 JWT → 提取用户信息 → 权限检查
```

### 6.2 权限模型

```yaml
角色:
  admin:
    - 所有权限
  operator:
    - 查看设备
    - 控制设备
    - 确认告警
  viewer:
    - 查看设备
    - 查看告警
```

### 6.3 安全措施

| 措施 | 说明 |
|-----|------|
| HTTPS | 全站 HTTPS，TLS 1.3 |
| JWT | 短效 Token（2 小时）+ Refresh Token |
| 限流 | API 限流（100 次/分钟） |
| CORS | 白名单域名 |
| SQL 注入 | 参数化查询 |
| XSS | 输入过滤 + CSP |
| 审计日志 | 所有操作记录 |

---

## 七、监控告警

### 7.1 监控指标

| 指标 | 阈值 | 告警级别 |
|-----|------|---------|
| API 响应时间 | P95 > 500ms | Warning |
| API 错误率 | > 1% | Critical |
| WebSocket 连接数 | > 1000 | Warning |
| 数据库连接数 | > 80% | Warning |
| 内存使用率 | > 80% | Warning |
| CPU 使用率 | > 80% | Warning |
| 磁盘使用率 | > 80% | Warning |

### 7.2 监控栈

```
Prometheus (指标采集)
    │
    ▼
Grafana (可视化)
    │
    ▼
AlertManager (告警)
    │
    ▼
钉钉/短信/邮件 (通知)
```

---

## 八、MVP 范围

### 8.1 必须功能（P0）

| 模块 | 功能 | 优先级 |
|-----|------|-------|
| 3D 渲染 | 场景加载、设备渲染、相机控制 | P0 |
| 实时数据 | WebSocket 连接、设备状态更新 | P0 |
| AI 交互 | 自然语言查询设备信息 | P0 |
| 设备管理 | 设备 CRUD、状态查看 | P0 |
| 告警管理 | 告警规则、告警列表、确认/解决 | P0 |
| 用户管理 | 登录、权限控制 | P0 |

### 8.2 可选功能（P1）

| 模块 | 功能 | 优先级 |
|-----|------|-------|
| 3D 渲染 | 设备点击交互、高亮、详情面板 | P1 |
| 实时数据 | 历史数据回放 | P1 |
| AI 交互 | RAG 知识库、设备控制命令 | P1 |
| 数据接入 | MQTT 协议适配 | P1 |
| 报表统计 | 基础统计图表 | P1 |

### 8.3 后续功能（P2）

| 模块 | 功能 | 优先级 |
|-----|------|-------|
| 3D 渲染 | 后处理特效、VR 支持 | P2 |
| AI 交互 | 预测性维护、智能分析 | P2 |
| 低代码 | 可视化场景编辑 | P2 |
| 移动端 | H5 适配 | P2 |

---

**下一步：** 查看 `development-timeline.md` 获取详细开发计划。
