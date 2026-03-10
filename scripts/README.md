# 技能学习自动化脚本

_最后更新：2026-03-09 | 维护者：MOSS_

---

## 📁 脚本清单

| 脚本 | 用途 | 命令 |
|------|------|------|
| **auto-learn-skill.sh** | 自动学习单个技能 | `./auto-learn-skill.sh <skill>` |
| **batch-install-skills.sh** | 批量安装多个技能 | `./batch-install-skills.sh <skill1> <skill2>...` |
| **skill-validator.sh** | 验证技能功能和安全性 | `./skill-validator.sh [skill]` |
| **skill-learning-cron.sh** | 定时自动学习 | 添加到 crontab |

---

## 🚀 快速开始

### 1. 学习单个技能

```bash
# 基础用法
./scripts/auto-learn-skill.sh <skill-name>

# 示例
./scripts/auto-learn-skill.sh github
./scripts/auto-learn-skill.sh video-frames
./scripts/auto-learn-skill.sh feishu-doc

# 强制安装（可疑技能）
./scripts/auto-learn-skill.sh video-edit --force
```

**执行流程**:
1. 下载技能
2. 阅读 SKILL.md
3. 运行测试（如果有）
4. 执行集成（如果有）
5. 更新能力清单

### 2. 批量安装技能

```bash
# 安装多个技能
./scripts/batch-install-skills.sh github feishu-doc memory-setup

# 强制安装所有
./scripts/batch-install-skills.sh --force video-edit douyin-video-fetch

# 从文件读取技能列表
./scripts/batch-install-skills.sh --file skills-to-install.txt
```

**skills-to-install.txt 示例**:
```
# 每行一个技能
github
feishu-doc
memory-setup
video-frames
```

### 3. 验证技能

```bash
# 验证所有技能
./scripts/skill-validator.sh

# 验证单个技能
./scripts/skill-validator.sh video-frames

# 仅安全检查
./scripts/skill-validator.sh --security

# 仅功能检查
./scripts/skill-validator.sh --functional video-frames
```

### 4. 定时学习

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每周一早上 9 点运行）
0 9 * * 1 /Users/chenggl/workspace/scripts/skill-learning-cron.sh

# 或者每天运行（早上 8 点）
0 8 * * * /Users/chenggl/workspace/scripts/skill-learning-cron.sh
```

---

## 📊 输出文件

所有脚本会生成以下文件：

| 文件 | 路径 | 用途 |
|------|------|------|
| 技能学习队列 | `/training/skill-learning-queue.md` | 技能优先级列表 |
| 能力清单 | `/training/capability-inventory.md` | 已掌握/学习/待学习技能 |
| 安装日志 | `/training/skill-install-log.md` | 每次安装记录 |
| 批量安装日志 | `/training/batch-install-log.md` | 批量安装记录 |
| 验证报告 | `/training/skill-validation-report.md` | 技能验证结果 |
| 学习报告 | `/training/skill-acquisition-report.md` | 总体学习报告 |
| Cron 日志 | `/training/cron-learning-log.md` | 定时任务日志 |

---

## 🔧 配置选项

### auto-learn-skill.sh

| 参数 | 说明 | 示例 |
|------|------|------|
| `<skill-name>` | 技能名称（必需） | `video-frames` |
| `--force` | 强制安装可疑技能 | `--force` |

### batch-install-skills.sh

| 参数 | 说明 | 示例 |
|------|------|------|
| `<skill1> <skill2>...` | 技能列表 | `github feishu-doc` |
| `--force, -f` | 强制安装所有 | `--force` |
| `--file, -F` | 从文件读取 | `--file skills.txt` |
| `--help, -h` | 显示帮助 | `--help` |

### skill-validator.sh

| 参数 | 说明 | 示例 |
|------|------|------|
| `[skill-name]` | 技能名称（可选） | `video-frames` |
| `--security, -s` | 仅安全检查 | `--security` |
| `--functional, -f` | 仅功能检查 | `--functional` |
| `--all, -a` | 完整检查（默认） | `--all` |
| `--help, -h` | 显示帮助 | `--help` |

---

## 📋 使用场景

### 场景 1: 发现新技能，立即学习

```bash
# 搜索技能
clawhub search video

# 学习感兴趣的技能
./scripts/auto-learn-skill.sh new-video-skill
```

### 场景 2: 按照学习队列系统学习

```bash
# 查看学习队列
cat /training/skill-learning-queue.md

# 安装高优先级第一个技能
./scripts/auto-learn-skill.sh video-frames

# 更新队列（标记为已学习）
# 编辑 skill-learning-queue.md，移到已掌握部分
```

### 场景 3: 周末批量学习

```bash
# 周末抽出时间批量学习
./scripts/batch-install-skills.sh \
  github \
  feishu-doc \
  feishu-drive \
  memory-setup \
  tavily-search-secure
```

### 场景 4: 定期检查技能安全

```bash
# 每周运行一次安全检查
./scripts/skill-validator.sh --security
```

### 场景 5: 自动化持续学习

```bash
# 设置 cron，每周一自动学习 3 个新技能
crontab -e

# 添加：
0 9 * * 1 /Users/chenggl/workspace/scripts/skill-learning-cron.sh
```

---

## 🛡️ 安全提示

1. **可疑技能**: 部分技能被 VirusTotal 标记为可疑
   - 使用 `--force` 强制安装前，先运行安全检查
   - 推荐：`./scripts/skill-validator.sh --security <skill>`

2. **技能扫描**: 安装前使用 skill-scanner
   ```bash
   # 如果已安装 skill-scanner
   clawhub scan <skill-name>
   ```

3. **权限检查**: 验证脚本会检查执行权限
   - 自动修复缺失的权限
   - 记录所有警告到验证报告

---

## 📈 最佳实践

### 1. 优先级驱动
- 始终先学习高优先级技能
- 参考 `/training/skill-learning-queue.md`
- ROI 高 + 难度低 + 项目相关 = 优先学习

### 2. 批量操作
- 使用 `batch-install-skills.sh` 一次性安装多个
- 节省时间，减少重复操作
- 自动生成批量日志

### 3. 定期验证
- 每周运行 `skill-validator.sh`
- 确保技能功能正常
- 及时发现安全问题

### 4. 持续学习
- 设置 cron 定时任务
- 每周自动学习 3-5 个新技能
- 保持能力持续增长

### 5. 文档同步
- 每次学习后更新能力清单
- 记录学习心得和注意事项
- 建立个人技能知识库

---

## 🔍 故障排除

### 问题 1: 技能安装失败

```bash
# 尝试强制安装
./scripts/auto-learn-skill.sh <skill> --force

# 检查网络连接
ping clawhub.com

# 查看 clawhub 状态
clawhub status
```

### 问题 2: 技能验证失败

```bash
# 查看详细验证报告
cat /training/skill-validation-report.md

# 重新安装技能
./scripts/auto-learn-skill.sh <skill> --force

# 联系技能作者（如果有联系方式）
```

### 问题 3: cron 不执行

```bash
# 检查 cron 状态
crontab -l

# 查看 cron 日志
tail -f /var/log/system.log | grep cron

# 测试脚本手动执行
./scripts/skill-learning-cron.sh
```

### 问题 4: 权限错误

```bash
# 确保脚本有执行权限
chmod +x /Users/chenggl/workspace/scripts/*.sh

# 检查技能目录权限
ls -la /Users/chenggl/workspace/skills/
```

---

## 📚 相关文档

- [技能学习队列](/training/skill-learning-queue.md) - 优先级列表
- [能力清单](/training/capability-inventory.md) - 技能掌握情况
- [安装日志](/training/skill-install-log.md) - 安装历史
- [学习报告](/training/skill-acquisition-report.md) - 总体报告

---

## 🤝 贡献

欢迎提交新的脚本或改进建议！

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

_脚本版本：v1.0 | 最后更新：2026-03-09_
