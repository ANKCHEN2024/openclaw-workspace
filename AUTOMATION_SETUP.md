# 自动化定时任务配置指南

## ⚠️ 重要说明

由于 **OpenClaw 沙盒限制**，无法直接配置系统级定时任务（launchd/cron）。

## ✅ 解决方案

### 方案一：手动配置 cron（推荐）

在终端运行以下命令：

```bash
# 1. 打开 crontab 编辑器
crontab -e

# 2. 添加以下内容（上海时间）
0 3 * * * cd /Users/chenggl/workspace && ./scripts/sync-docs-links.sh >> logs/cron-sync.log 2>&1
5 3 * * * cd /Users/chenggl/workspace && ./scripts/auto-fix-docs.sh >> logs/cron-fix.log 2>&1
0 4 * * * cd /Users/chenggl/workspace && ./scripts/skill-healthcheck.sh >> logs/cron-skill-check.log 2>&1
5 4 * * * cd /Users/chenggl/workspace && ./scripts/skill-install.sh >> logs/cron-skill-install.log 2>&1
0 23 * * 0 cd /Users/chenggl/workspace && ./scripts/weekly-report.sh >> logs/cron-weekly.log 2>&1

# 3. 保存并退出

# 4. 验证配置
crontab -l
```

---

### 方案二：使用 macOS 日历提醒

1. 打开「日历」应用
2. 创建每日重复事件：
   - 03:00 - 文档同步检查
   - 04:00 - 技能健康检查
3. 设置提醒运行脚本

---

### 方案三：手动运行（临时）

每次需要时手动运行：

```bash
cd /Users/chenggl/workspace

# 运行所有每日任务
./scripts/run-daily.sh

# 或单独运行
./scripts/sync-docs-links.sh    # 文档检查
./scripts/skill-healthcheck.sh  # 技能检查
```

---

## 📋 任务时间表（上海时间）

| 时间 | 任务 | 脚本 |
|------|------|------|
| 每天 03:00 | 文档关联检查 | `sync-docs-links.sh` |
| 每天 03:05 | 文档自动修复 | `auto-fix-docs.sh` |
| 每天 04:00 | 技能健康检查 | `skill-healthcheck.sh` |
| 每天 04:05 | 技能安装/更新 | `skill-install.sh` |
| 每周日 23:00 | 周报告 | `weekly-report.sh` |

---

## 🔍 验证方法

### 检查 cron 配置
```bash
crontab -l
```

### 查看日志
```bash
tail -f logs/cron-sync.log
tail -f logs/cron-skill-check.log
```

### 测试脚本
```bash
./scripts/sync-docs-links.sh
./scripts/skill-healthcheck.sh
```

---

## 📝 下一步

**请选择方案一并手动配置 cron**，因为这是最可靠的方式。

配置完成后运行：
```bash
./scripts/test-automation.sh
```

---

*创建时间：2026-03-07*  
*最后更新：2026-03-07*
