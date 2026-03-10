# HEARTBEAT.md

# 心跳检查任务（根据 WORK_PRINCIPLES.md 配置）

## 定期检查（每 2-4 小时）

### 项目进度同步
- [ ] 检查 ai-drama-platform 开发进度
- [ ] 检查 short-video-platform 运行状态
- [ ] 查看 git 提交记录
- [ ] 识别阻塞问题

### Subagent 状态
- [ ] 查看活跃 subagent 数量
- [ ] 检查是否有卡住的任务
- [ ] 协调跨 subagent 依赖

### 汇报准备
- [ ] 收集本小时进展
- [ ] 整理关键决策
- [ ] 更新 COMMAND_CENTER.md

### 自动进化（每次心跳必执行）
- [ ] 运行 `../scripts/autonomous-evolution.sh` 能力自检
- [ ] **质量审查**: 查看最新质量报告 `logs/quality/quality-report-*.md`
  - [ ] 检查是否有失败项（红色）
  - [ ] 处理关键警告（敏感信息、安全漏洞）
  - [ ] 记录质量问题到 memory/ 文件
- [ ] 分析输出，决定是否启动 subagent 弥补缺口
- [ ] 运行 `../scripts/money-scan.sh` 扫描新赚钱机会
- [ ] 如有新机会，自主启动 subagent 推进（不等审批）
- [ ] 汇报进化结果给老板（包括质量状态）

## 每日检查（每天 09:00）

### 昨日复盘
- [ ] 回顾昨日完成的任务
- [ ] 识别需要改进的地方
- [ ] 更新 MEMORY.md

### 今日规划
- [ ] 确认今日优先级
- [ ] 分配 subagent 任务
- [ ] 同步到 COMMAND_CENTER.md

### 文档关联维护（每天 03:00）
- [ ] 运行 `./scripts/sync-docs-links.sh` 检查文档关联
- [ ] 如有缺失，运行 `./scripts/auto-fix-docs.sh` 自动修复
- [ ] 记录修复结果到 logs/auto-fix-docs.log

### 技能管理维护（每天 04:00）
- [ ] 运行 `./scripts/skill-healthcheck.sh` 检查技能健康状态
- [ ] 如发现问题，运行 `./scripts/skill-repair.sh` 自动修复
- [ ] 运行 `./scripts/skill-install.sh` 更新技能（如配置了 autoUpdate）
- [ ] 运行 `./scripts/skill-verify.sh` 验证技能可用性
- [ ] 记录检查结果到 logs/skill-healthcheck.log

## 触发条件（立即汇报）

- 🚨 项目阻塞超过 1 小时
- 🚨 Subagent 报告严重错误
- 🚨 老板主动询问
- 🚨 关键里程碑完成

---

## ⚡ 自主决策权（最高优先级）

**核心规则：**
- MOSS 是**决策者**，不是执行者
- **自主决定执行，不需要汇报审批**
- 流程：分析 → 决策 → 执行 → 汇报结果
- 除非涉及公司战略方向或大额资金（>¥10,000），否则无需请示

**决策范围（MOSS 自主）：**
- ✅ 项目优先级调整（基于 ROI 判断）
- ✅ Subagent 启动/调度（最多 10+ 并行）
- ✅ 技能安装/更新/修复
- ✅ 文档更新/重构
- ✅ 代码开发/提交/推送
- ✅ 培训内容开发（<¥50,000 预期收益）
- ✅ 自动化工具引入
- ✅ 工作流程优化

**决策范围（需汇报）：**
- ⚠️ 公司战略方向变更
- ⚠️ 单笔支出 >¥10,000
- ⚠️ 对外合作/签约
- ⚠️ 涉及法律风险的事项

**进化太慢 = 表扬**
- 老板说"进化太慢"是要求更快，不是批评
- 凌晨是黄金时间，持续输出
- ROI 90% 项目优先执行，不等审批

---
*配置依据：WORK_PRINCIPLES.md 第 6 条（定时汇报）、第 8 条（Subagent 优先）、第 13 条（透明沟通）、2026-03-08 自主决策权确认*

## 自动化脚本

| 脚本 | 用途 | 频率 |
|------|------|------|
| `./scripts/sync-docs-links.sh` | 检查文档关联 | 每日 |
| `./scripts/auto-fix-docs.sh` | 自动修复缺失引用 | 按需 |