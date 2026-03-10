# 决策：WORK_PRINCIPLES.md 全局集成方案

**日期**: 2026-03-07  
**决策者**: MOSS  
**状态**: 已执行

## 背景

老板提出关键问题：`WORK_PRINCIPLES.md` 中的 15 条核心准则如何在**所有对话中自动生效**，包括 subagent 会话？

当前问题：
- 主会话可以看到 WORK_PRINCIPLES.md（Project Context 机制）
- Subagent 会话不会自动加载这个文件
- 规则存在断层

## 选项分析

| 选项 | 优点 | 缺点 | 评估 |
|------|------|------|------|
| **方案一：Spawn 时显式传递** | 精确控制，每次可定制 | token 消耗大，维护成本高 | ⭐⭐ |
| **方案二：写入 AGENTS.md** | 所有会话自动加载，一次配置永久生效 | AGENTS.md 会变长 | ⭐⭐⭐⭐⭐ |
| **方案三：创建技能** | 可显式激活/停用 | 需要技能机制支持，复杂度高 | ⭐⭐⭐ |
| **方案四：系统提示注入** | 最优雅 | 需要 OpenClaw 支持，不可控 | ⭐⭐ |

## 最终决策

选择 **方案二：写入 AGENTS.md**

理由：
1. **最简单** - 只需修改 AGENTS.md 的必读清单
2. **最可靠** - Project Context 机制保证所有会话加载
3. **最持久** - 配置一次，永久生效
4. **易维护** - 集中管理，容易更新

## 实施计划

- [x] 在 AGENTS.md 中添加 WORK_PRINCIPLES.md 到必读清单
- [x] 在 AGENTS.md 中添加 IDENTITY.md 到必读清单（之前遗漏）
- [x] 配置 HEARTBEAT.md 以支持定时汇报（第 6 条）
- [x] 创建 decisions/ 目录用于决策日志（第 5、10 条）
- [x] 创建 training/ 目录用于能力培训（第 7 条）
- [x] 在项目文档中添加 WORK_PRINCIPLES.md 引用

## 预期结果

1. 所有新会话（包括 subagent）自动加载 WORK_PRINCIPLES.md
2. 心跳机制支持定时汇报和进度同步
3. 决策和经验有专门的记录位置
4. 能力培训有明确的框架

## 复盘日期

2026-03-14（7 天后复盘效果）

## 相关文件

- `/Users/chenggl/workspace/AGENTS.md` - 已更新
- `/Users/chenggl/workspace/HEARTBEAT.md` - 已配置
- `/Users/chenggl/workspace/decisions/` - 新建
- `/Users/chenggl/workspace/training/` - 新建

---
*本决策记录于 decisions/ 目录，精华内容将提炼至 MEMORY.md*
