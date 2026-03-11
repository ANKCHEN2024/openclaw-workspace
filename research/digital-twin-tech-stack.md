# 数字孪生 AI 技术栈调研报告

**版本：** 1.0  
**日期：** 2026-03-11  
**作者：** MOSS（AI 合伙人）  
**阶段：** Phase 2 技术预研

---

## 一、Three.js + 实时数据集成方案

### 1.1 Three.js 核心能力

| 能力维度 | 支持情况 | 说明 |
|---------|---------|------|
| WebGL 渲染 | ✅ 原生支持 | 基于 WebGL 2.0，支持 PBR 材质 |
| 场景图管理 | ✅ 完整支持 | Scene-Group-Mesh 层级结构 |
| 几何体系统 | ✅ 丰富 | Box/Sphere/Cylinder 等基础几何体 + 自定义 Geometry |
| 材质系统 | ✅ 完善 | MeshStandardMaterial/MeshPhysicalMaterial |
| 光照系统 | ✅ 完整 | Ambient/Directional/Point/Spot/RectArea Light |
| 相机系统 | ✅ 双模式 | PerspectiveCamera + OrthographicCamera |
| 动画系统 | ✅ 支持 | AnimationClip/AnimationMixer/KeyframeTrack |
| 加载器 | ✅ 丰富 | GLTF/FBX/OBJ/STL 等主流格式 |
| 后处理 | ✅ 支持 | EffectComposer + ShaderPass |

### 1.2 实时数据集成方案

#### 方案 A：WebSocket + Three.js（推荐）

```javascript
// 架构示意
const ws = new WebSocket('wss://api.example.com/twin');
const scene = new THREE.Scene();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // 更新设备位置
  if (data.type === 'position') {
    const mesh = scene.getObjectByName(data.deviceId);
    if (mesh) {
      mesh.position.set(data.x, data.y, data.z);
    }
  }
  
  // 更新设备状态（颜色/材质）
  if (data.type === 'status') {
    const mesh = scene.getObjectByName(data.deviceId);
    if (mesh) {
      mesh.material.color.setHex(data.status === 'normal' ? 0x00ff00 : 0xff0000);
    }
  }
  
  // 更新数据面板
  if (data.type === 'metrics') {
    updateUIPanel(data.metrics);
  }
};
```

**优势：**
- 低延迟（<100ms）
- 双向通信
- 浏览器原生支持
- 适合高频数据更新（10-60Hz）

**劣势：**
- 长连接维护成本
- 服务器并发压力

#### 方案 B：MQTT over WebSocket

```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('wss://mqtt.example.com', {
  clientId: `twin_${Date.now()}`,
  clean: true
});

client.subscribe('twin/device/+/status');
client.subscribe('twin/device/+/metrics');

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  const deviceId = topic.split('/')[2];
  
  // 更新 Three.js 场景
  updateDevice(deviceId, data);
});
```

**优势：**
- 发布/订阅模式，解耦
- 支持 QoS 级别
- 适合 IoT 场景
- 支持离线消息

**劣势：**
- 需要 MQTT Broker（EMQX/Mosquitto）
- 协议开销略大

#### 方案 C：gRPC-Web

```javascript
// 需要 Envoy 代理
const client = new TwinServiceClient('https://api.example.com', null, null);

const request = new DeviceSubscriptionRequest();
request.addDeviceIds('device-001');

const stream = client.subscribeDevices(request, {});
stream.on('data', (response) => {
  updateDevice(response.getDeviceId(), response.getData());
});
```

**优势：**
- 强类型（Protocol Buffers）
- 高效二进制传输
- 支持流式 RPC

**劣势：**
- 需要 Envoy 代理
- 浏览器支持有限
- 学习曲线陡峭

### 1.3 性能优化策略

| 优化项 | 技术方案 | 预期收益 |
|-------|---------|---------|
| 渲染优化 | InstancedMesh | 10x 绘制调用减少 |
| 几何体优化 | Draco 压缩 | 70-90% 文件大小减少 |
| 纹理优化 | KTX2 + BasisU | 50-80% 显存占用减少 |
| LOD 系统 | THREE.LOD | 根据距离自动降级 |
| 视锥体裁剪 | 内置 | 自动剔除不可见物体 |
| 数据节流 | 客户端采样 | 减少 50% 网络流量 |
| 增量更新 | 差异同步 | 减少 80% 数据传输 |

---

## 二、Qwen API 与数字孪生体交互接口

### 2.1 Qwen API 能力矩阵

| API 类型 | 端点 | 延迟 | 适用场景 |
|---------|------|------|---------|
| Qwen-Max | `/api/v1/services/aigc/text-generation/generation` | ~500ms | 复杂推理、多轮对话 |
| Qwen-Plus | 同上 | ~300ms | 平衡性能与成本 |
| Qwen-Turbo | 同上 | ~150ms | 高频简单查询 |
| Qwen-VL | `/api/v1/services/aigc/multimodal-generation/generation` | ~800ms | 图像理解 + 文本 |
| Qwen-Audio | 同上 | ~1s | 语音理解 |

### 2.2 数字孪生体交互接口设计

#### 接口架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   用户自然语言   │────▶│   Qwen API       │────▶│  意图解析引擎   │
│   "查看 3 号设备  │     │   (意图识别)     │     │   (Slot Filling)│
│    的温度"      │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Three.js 场景  │◀────│   数据查询服务    │◀────│  命令执行引擎   │
│   高亮显示设备   │     │   (实时数据库)   │     │   (设备 ID:003) │
│   弹出温度面板   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

#### Prompt 工程示例

```python
SYSTEM_PROMPT = """
你是一个数字孪生系统的 AI 助手。你的任务是：
1. 理解用户关于设备/场景的自然语言查询
2. 提取关键信息（设备 ID、指标类型、时间范围）
3. 返回结构化的 JSON 命令

可用设备类型：泵、阀门、传感器、电机、储罐
可用指标：温度、压力、流量、转速、能耗
可用操作：查看、控制、预测、告警

输出格式：
{
  "intent": "query_device_metric",
  "slots": {
    "device_id": "device-003",
    "device_type": "pump",
    "metric": "temperature",
    "time_range": "current"
  },
  "action": "highlight_and_show_panel"
}
"""

# Few-shot 示例
FEW_SHOT_EXAMPLES = [
  {
    "user": "3 号泵现在温度多少？",
    "assistant": '{"intent":"query_device_metric","slots":{"device_id":"device-003","device_type":"pump","metric":"temperature","time_range":"current"},"action":"highlight_and_show_panel"}'
  },
  {
    "user": "把所有阀门打开",
    "assistant": '{"intent":"batch_control","slots":{"device_type":"valve","action":"open","scope":"all"},"action":"execute_and_confirm"}'
  }
]
```

### 2.3 RAG 增强方案

```python
# 向量数据库结构
{
  "device_knowledge": [
    {
      "device_id": "device-003",
      "device_name": "3 号循环泵",
      "device_type": "pump",
      "location": "车间 A-1F-东区",
      "specifications": {
        "power": "15kW",
        "flow_rate": "100m³/h",
        "max_temperature": "80°C"
      },
      "maintenance_history": [...],
      "embedding": [0.123, -0.456, ...]  # 768 维向量
    }
  ],
  "operation_manual": [...],
  "alarm_codes": [...]
}

# 查询流程
1. 用户提问 → Qwen 提取关键词
2. 关键词 → 向量检索（Top-K）
3. 检索结果 + 问题 → Qwen 生成答案
4. 答案 + 动作 → 执行引擎
```

---

## 三、技术选型对比

### 3.1 3D 引擎对比

| 维度 | Three.js | Babylon.js | Unity |
|-----|----------|------------|-------|
| **学习曲线** | 低 | 中 | 高 |
| **包体积** | ~600KB | ~800KB | ~2MB+ |
| **WebGL 支持** | 2.0 | 2.0 | 2.0/3.0 |
| **PBR 材质** | ✅ | ✅ | ✅ |
| **物理引擎** | 需集成 | 内置 (Havok) | 内置 (PhysX) |
| **动画系统** | 基础 | 完善 | 专业 |
| **VR/AR** | WebXR | WebXR | 完整支持 |
| **编辑器** | 第三方 | Babylon.js Inspector | Unity Editor |
| **社区生态** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **企业支持** | 社区驱动 | 微软支持 | Unity Technologies |
| **Web 性能** | 优秀 | 优秀 | 中等（需优化） |
| **适用场景** | 轻量级 Web 3D | 中型 Web 3D | 复杂应用/跨平台 |

**推荐：Three.js**
- 理由：团队前端技术栈匹配、包体积小、社区活跃、足够满足 MVP 需求

### 3.2 实时数据协议对比

| 维度 | WebSocket | MQTT | gRPC |
|-----|-----------|------|------|
| **延迟** | <50ms | <100ms | <30ms |
| **连接模式** | 长连接 | 长连接 | 短连接/流 |
| **消息模式** | 双向 | 发布/订阅 | RPC |
| **QoS** | 无 | 0/1/2 | 无 |
| **离线消息** | ❌ | ✅ | ❌ |
| **浏览器支持** | 原生 | 需 WebSocket | 需代理 |
| **协议开销** | 低 | 中 | 低 |
| **服务端实现** | 简单 | 需 Broker | 复杂 |
| **适用场景** | 实时交互 | IoT 设备 | 微服务 |

**推荐：WebSocket（MVP） → MQTT（规模化）**
- MVP 阶段：WebSocket 简单直接，快速验证
- 规模化后：MQTT 支持海量设备接入

### 3.3 AI 交互方案对比

| 维度 | RAG | Fine-tuning | Agent |
|-----|-----|-------------|-------|
| **准确性** | 高（基于事实） | 中 | 高 |
| **实时性** | 高（可更新知识库） | 低（需重新训练） | 高 |
| **成本** | 低（仅推理） | 高（训练 + 推理） | 中 |
| **开发周期** | 2-3 周 | 4-6 周 | 3-4 周 |
| **可解释性** | 高（可追溯来源） | 低 | 中 |
| **领域适配** | 快速 | 深度 | 灵活 |
| **维护成本** | 低 | 中 | 中 |
| **适用场景** | 知识查询 | 专业领域 | 复杂任务 |

**推荐：RAG + Agent 混合方案**
- RAG：设备知识查询、操作手册检索
- Agent：复杂任务编排（如"预测下月能耗并生成报告"）

---

## 四、推荐技术栈

### 4.1 前端技术栈

```
┌─────────────────────────────────────────────┐
│              用户界面层                      │
│  React 18 + TypeScript + TailwindCSS        │
├─────────────────────────────────────────────┤
│              3D 渲染层                        │
│  Three.js r160+ + React Three Fiber         │
│  - @react-three/drei (辅助组件)             │
│  - @react-three/postprocessing (后处理)     │
├─────────────────────────────────────────────┤
│              状态管理层                      │
│  Zustand (轻量) / Redux Toolkit (复杂)      │
├─────────────────────────────────────────────┤
│              通信层                          │
│  WebSocket + Axios                          │
├─────────────────────────────────────────────┤
│              AI 交互层                        │
│  Qwen API + LangChain.js                    │
└─────────────────────────────────────────────┘
```

### 4.2 后端技术栈

```
┌─────────────────────────────────────────────┐
│              API 网关层                       │
│  Nginx + Express.js / FastAPI               │
├─────────────────────────────────────────────┤
│              业务逻辑层                      │
│  Node.js 20+ / Python 3.11+                 │
├─────────────────────────────────────────────┤
│              实时数据层                      │
│  WebSocket Server (ws/uWebSockets)          │
├─────────────────────────────────────────────┤
│              数据存储层                      │
│  - PostgreSQL (业务数据)                    │
│  - Redis (缓存 + 会话)                       │
│  - InfluxDB/TimescaleDB (时序数据)          │
│  - Milvus/Qdrant (向量数据)                 │
├─────────────────────────────────────────────┤
│              AI 服务层                        │
│  Qwen API + LangChain + 向量数据库           │
└─────────────────────────────────────────────┘
```

### 4.3 部署架构

```
┌──────────────────────────────────────────────────────┐
│                    阿里云                             │
├──────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   ECS       │  │   ECS       │  │   RDS       │  │
│  │   Web 服务   │  │   WebSocket │  │   PostgreSQL│  │
│  │   (Nginx)   │  │   Server    │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   ElastiCache│  │   TSDB     │  │   Vector DB │  │
│  │   Redis     │  │   InfluxDB  │  │   Milvus    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 五、关键技术风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|-----|------|------|---------|
| Three.js 大场景性能 | 高 | 中 | LOD + 实例化 + Draco 压缩 |
| WebSocket 连接稳定性 | 高 | 中 | 心跳检测 + 自动重连 + 降级轮询 |
| Qwen API 延迟 | 中 | 高 | 流式响应 + 本地缓存 + 降级规则引擎 |
| 实时数据一致性 | 高 | 中 | 时间戳同步 + 冲突解决策略 |
| 3D 模型加载慢 | 中 | 高 | 分块加载 + 进度提示 + 预加载 |
| 跨浏览器兼容 | 中 | 低 | Babel 转译 + Polyfill + 特性检测 |

---

## 六、结论与建议

### 6.1 核心选型

| 领域 | 选择 | 理由 |
|-----|------|------|
| 3D 引擎 | **Three.js** | 轻量、社区活跃、团队技术栈匹配 |
| 实时协议 | **WebSocket** | MVP 阶段简单高效，后续可迁移 MQTT |
| AI 方案 | **RAG + Agent** | 平衡准确性、成本与开发周期 |
| 大模型 | **Qwen-Max/Plus** | 中文能力强、阿里云生态集成 |

### 6.2 MVP 范围建议

**必须做（P0）：**
- 基础 3D 场景加载与渲染
- WebSocket 实时数据更新（位置、状态）
- Qwen 自然语言查询（设备信息、指标查询）
- 基础 UI 面板（设备列表、告警列表）

**应该做（P1）：**
- 设备点击交互（高亮、详情面板）
- 历史数据回放
- 告警规则配置
- RAG 知识库（设备手册、操作指南）

**可以做（P2）：**
- AI 预测性维护
- 多场景切换
- VR/AR 支持
- 移动端适配

---

**下一步：** 查看 `competitor-analysis.md` 获取竞品分析，`mvp-architecture.md` 获取架构设计，`development-timeline.md` 获取开发计划。
