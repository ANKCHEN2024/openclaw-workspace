# MOSS 进化系统 - 快速启动清单

_5 分钟内开始使用_

---

## ✅ 已完成

- [x] 设计方案 (`proposals/moss-evolution-system.md`)
- [x] 主进化脚本 (`scripts/moss-self-improve.sh`)
- [x] 自动反思脚本 (`scripts/auto-reflect.sh`)
- [x] 能力缺口检测 (`scripts/capability-gap-check.sh`)
- [x] 进化状态追踪 (`memory/evolution-state.json`)
- [x] Subagent 任务模板 (`templates/subagent-task-template.md`)
- [x] 使用指南 (`proposals/evolution-system-guide.md`)
- [x] 今日记忆 (`memory/2026-03-07.md`)
- [x] 待执行任务 (`tasks/evolve-*.md`)

---

## 🚀 立即使用（3 个命令）

### 1. 运行进化引擎
```bash
cd /Users/chenggl/workspace
./scripts/moss-self-improve.sh
```

**输出：**
- 能力自检报告
- 缺口分析
- 生成的进化任务
- 进化报告

### 2. 查看能力缺口
```bash
./scripts/capability-gap-check.sh
```

**输出：**
- 能力矩阵可视化
- 优先级建议
- 行动计划

### 3. 会话结束反思
```bash
./scripts/auto-reflect.sh
```

**输出：**
- 反思模板 (`memory/YYYY-MM-DD-reflect.md`)
- 填写提示

---

## 📊 当前状态

### 能力基线
- **总体平均：** 2.25/5
- **最低项：** proactive_proposal (1/5) 🔴
- **最高项：** automation, task_decomposition, script_encapsulation (3/5)

### 待执行任务
1. **evolve-proactive-proposal** (高优先级，2 小时)
2. **evolve-quality-control** (中优先级，1.5 小时)

### 进化历史
- 系统创建：2026-03-07 19:36
- 总进化次数：0
- 成功部署：0

---

## 📅 下一步

### 今晚（立即执行）
```bash
# 1. 分配 subagent 执行紧急任务
# 2. 监控执行进度
# 3. 验收并部署新能力
```

### 明天
- [ ] 回顾进化报告
- [ ] 调整进化方向（如需要）
- [ ] 继续执行待办任务

### 本周
- [ ] 完成 Phase 1（基础框架）
- [ ] 能力提升到 2.5/5
- [ ] 建立定时触发机制

---

## 📞 需要老板拍板

以下情况需要老板确认：
- [ ] 进化方向是否符合战略
- [ ] 是否批准付费学习资源
- [ ] 优先级调整建议

---

## 📖 相关文档

| 文档 | 用途 |
|------|------|
| `proposals/moss-evolution-system.md` | 完整设计方案 |
| `proposals/evolution-system-guide.md` | 使用指南 |
| `memory/evolution-state.json` | 状态追踪 |
| `tasks/evolve-*.md` | 待执行任务 |
| `templates/subagent-task-template.md` | 任务模板 |

---

## 💡 快速提示

### 查看进化状态
```bash
cat memory/evolution-state.json | head -50
```

### 查看今日反思
```bash
cat memory/$(date +%Y-%m-%d)-reflect.md
```

### 查看所有任务
```bash
ls -la tasks/
```

---

_系统版本：v0.1 | 启动时间：2026-03-07 19:36_
