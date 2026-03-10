# MOSS 进化系统使用指南

_快速上手，让 MOSS 自动进化_

**版本：** v0.1  
**创建时间：** 2026-03-07

---

## 🚀 快速开始

### 1. 运行进化引擎

```bash
cd /Users/chenggl/workspace
./scripts/moss-self-improve.sh
```

这会：
- ✅ 能力自检
- ✅ 缺口分析
- ✅ 生成进化任务
- ✅ 准备 subagent 分配
- ✅ 更新状态

### 2. 查看能力缺口

```bash
./scripts/capability-gap-check.sh
```

### 3. 会话结束反思

```bash
./scripts/auto-reflect.sh
```

---

## 📂 文件结构

```
workspace/
├── proposals/
│   └── moss-evolution-system.md    # 完整设计方案
├── scripts/
│   ├── moss-self-improve.sh        # 主进化脚本
│   ├── auto-reflect.sh             # 自动反思
│   └── capability-gap-check.sh     # 缺口检测
├── memory/
│   ├── evolution-state.json        # 进化状态追踪
│   └── YYYY-MM-DD-reflect.md       # 每日反思
├── templates/
│   └── subagent-task-template.md   # subagent 任务模板
└── tasks/
    ├── evolve-proactive-proposal.md  # 待执行任务
    └── evolve-quality-control.md     # 待执行任务
```

---

## 🔄 进化流程

```
┌─────────────┐
│ 能力自检    │ 每 4 小时自动运行
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 缺口分析    │ 识别最低能力项
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 任务生成    │ 创建 subagent 任务
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Subagent 执行 │ 并行学习 + 实现
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 质量验证    │ 测试 + 安全检查
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 知识沉淀    │ 更新状态 + memory
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 汇报        │ 整点报告
└─────────────┘
```

---

## 📊 能力矩阵

| 维度 | 能力项 | 当前 | 目标 | 优先级 |
|------|--------|------|------|--------|
| **Subagent 指挥官** | task_decomposition | 3/5 | 5/5 | 中 |
| | parallel_orchestration | 3/5 | 5/5 | 中 |
| | quality_control | 2/5 | 5/5 | 高 |
| | conflict_resolution | 2/5 | 5/5 | 高 |
| **AI 合伙人** | business_insight | 2/5 | 5/5 | 高 |
| | proactive_proposal | 1/5 | 5/5 | 🔴 紧急 |
| | risk_warning | 2/5 | 5/5 | 高 |
| | resource_optimization | 2/5 | 5/5 | 中 |
| **执行能力** | automation | 3/5 | 5/5 | 中 |
| | toolchain | 2/5 | 5/5 | 高 |
| | script_encapsulation | 3/5 | 5/5 | 中 |
| | knowledge_persistence | 2/5 | 5/5 | 高 |

---

## 🎯 当前任务

### 紧急任务

**evolve-proactive-proposal**
- 目标：proactive_proposal 1→3
- 预计：2 小时
- 状态：待分配

**evolve-quality-control**
- 目标：quality_control 2→3
- 预计：1.5 小时
- 状态：待分配

---

## ⚙️ 配置

编辑 `memory/evolution-state.json` 的 `config` 部分：

```json
{
  "auto_scan_interval_hours": 4,
  "auto_report_interval_hours": 1,
  "max_concurrent_subagents": 5,
  "api_daily_budget": 100,
  "require_human_approval_for": [
    "paid_resources",
    "major_direction_change",
    "legal_gray_area"
  ]
}
```

---

## 📝 最佳实践

### 1. 定期运行

- 每 4 小时：`./scripts/moss-self-improve.sh`
- 每天：`./scripts/auto-reflect.sh`
- 每周：手动复盘 evolution-state.json

### 2. 任务分配

使用模板创建任务：
```bash
cp templates/subagent-task-template.md tasks/task-XXX.md
# 编辑任务内容
# 分配给 subagent 执行
```

### 3. 知识沉淀

每次进化后：
- 更新 evolution-state.json
- 写入 memory/YYYY-MM-DD.md
- 提炼到 MEMORY.md（每周）

---

## ⚠️ 注意事项

### 法律边界（原则一）
- 所有学习内容必须合法
- 灰色地带需老板拍板
- 禁止侵犯版权/隐私

### 成本控制（原则三）
- API 调用设置日限额
- 优先使用免费资源
- ROI 导向决策

### 质量要求（原则四）
- 新技能必须测试
- 文档必须完整
- 无安全漏洞

---

## 🆘 故障排除

### 问题：状态文件不存在

```bash
./scripts/moss-self-improve.sh
# 会自动初始化
```

### 问题：脚本无权限

```bash
chmod +x scripts/*.sh
```

### 问题：任务卡住

- 检查 subagent 状态
- 查看任务日志
- 超过 30 分钟上报老板

---

## 📈 进阶使用

### 自定义进化方向

编辑 `memory/evolution-state.json` 的 `capabilities` 部分，添加新的能力项。

### 创建自定义脚本

参考现有脚本结构，在 `scripts/` 目录创建新脚本。

### 集成到工作流

在 HEARTBEAT.md 中添加定时检查：
```markdown
- [ ] 运行 capability-gap-check.sh
- [ ] 检查进化任务进度
```

---

_文档版本：v0.1 | 最后更新：2026-03-07_
