# 飞书多 Bot 配置方案 - 文档索引

> 创建日期：2026-03-08  
> 版本：v1.0  
> 用途：5 个 MOSS Bot 的完整配置方案

---

## 快速开始

### 第一步：创建飞书应用
参考：**[飞书应用创建指南](./feishu-app-creation-guide.md)**

1. 访问 https://open.feishu.cn/app
2. 创建 5 个企业内部应用
3. 配置权限
4. 获取凭证

### 第二步：存储凭证到 1Password
参考：**[1Password 凭证指南](./feishu-credentials-guide.md)**

```bash
# 运行批量创建脚本
./scripts/create-feishu-credentials.sh
```

### 第三步：验证凭证
参考：**[测试计划](./feishu-bots-test-plan.md)**

```bash
# 运行测试脚本
./scripts/test-feishu-bots.sh
```

### 第四步：配置 OpenClaw
参考：**[应用配置清单](./feishu-app-checklist.md)**

配置文件位置：`~/.openclaw/feishu-bots-config.yaml`

### 第五步：启动并测试
```bash
# 重启 OpenClaw
openclaw restart

# 检查 Bot 状态
openclaw status

# 在测试群验证消息功能
```

---

## 文档清单

| 序号 | 文档 | 用途 | 读者 |
|------|------|------|------|
| 1 | [Bot 架构设计](./feishu-multi-bot-architecture.md) | 了解整体架构、角色分工、权限设计 | 架构师、管理员 |
| 2 | [应用配置清单](./feishu-app-checklist.md) | 配置每个 Bot 的详细信息 | 配置管理员 |
| 3 | [1Password 凭证指南](./feishu-credentials-guide.md) | 创建和管理凭证 | 运维人员 |
| 4 | [飞书应用创建指南](./feishu-app-creation-guide.md) | 在飞书开放平台创建应用 | 应用管理员 |
| 5 | [测试计划](./feishu-bots-test-plan.md) | 验证 Bot 功能完整性 | 测试人员 |
| 6 | [OpenClaw 配置](~/.openclaw/feishu-bots-config.yaml) | Bot 运行时配置 | 系统 |

---

## 脚本清单

| 脚本 | 用途 | 执行时机 |
|------|------|----------|
| `scripts/create-feishu-credentials.sh` | 批量创建 1Password 凭证 | 初始配置 |
| `scripts/test-feishu-bots.sh` | 验证凭证和 API 连接 | 配置后/定期 |

---

## Bot 矩阵

| Bot | 职能 | 服务群组 | 状态 |
|-----|------|----------|------|
| MOSS-CEO | 总助理/战略 | 管理层群 | ⏳ 待部署 |
| MOSS-PM | 项目经理 | 项目群 | ⏳ 待部署 |
| MOSS-Finance | 财务助手 | 财务群 | ⏳ 待部署 |
| MOSS-HR | 人事助手 | HR 群 | ⏳ 待部署 |
| MOSS-Tech | 技术顾问 | 技术群 | ⏳ 待部署 |

---

## 部署检查清单

### 准备阶段
- [ ] 阅读 [Bot 架构设计](./feishu-multi-bot-architecture.md)
- [ ] 准备 5 个应用图标（1080x1080 PNG）
- [ ] 确认 1Password 已安装并登录

### 创建阶段
- [ ] 创建 5 个飞书应用（参考 [创建指南](./feishu-app-creation-guide.md)）
- [ ] 配置每个应用的权限（参考 [配置清单](./feishu-app-checklist.md)）
- [ ] 获取并存储凭证（运行 `create-feishu-credentials.sh`）

### 验证阶段
- [ ] 运行测试脚本（`test-feishu-bots.sh`）
- [ ] 所有测试项通过
- [ ] 更新 OpenClaw 配置

### 部署阶段
- [ ] 重启 OpenClaw
- [ ] 验证 Bot 在线状态
- [ ] 在测试群验证消息功能
- [ ] 添加到生产群组

### 运维阶段
- [ ] 定期运行测试脚本（建议每周）
- [ ] 监控 Bot 运行状态
- [ ] 90 天轮换凭证

---

## 常见问题

### Q: 凭证存储在哪里？
A: 所有凭证存储在 1Password 的「Personal」保险库中，项名为 `Feishu MOSS-{角色}`。

### Q: 如何验证 Bot 是否正常工作？
A: 运行 `./scripts/test-feishu-bots.sh` 进行自动化测试，或在测试群发送消息验证。

### Q: 凭证多久轮换一次？
A: 建议 90 天轮换一次。运行 `create-feishu-credentials.sh` 重新配置。

### Q: 某个 Bot 不响应怎么办？
A: 
1. 检查 `openclaw status` 确认 Bot 在线
2. 检查群组隔离配置
3. 检查是否被@提及
4. 查看日志：`openclaw logs`

### Q: 如何添加新的 Bot？
A: 
1. 在飞书开放平台创建新应用
2. 在 1Password 中存储凭证
3. 在 `~/.openclaw/feishu-bots-config.yaml` 中添加配置
4. 重启 OpenClaw

---

## 联系支持

- 架构问题：参考 [Bot 架构设计](./feishu-multi-bot-architecture.md)
- 配置问题：参考 [应用配置清单](./feishu-app-checklist.md)
- 凭证问题：参考 [1Password 凭证指南](./feishu-credentials-guide.md)
- 测试问题：参考 [测试计划](./feishu-bots-test-plan.md)

---

**文档维护**：每次配置变更或 Bot 更新后，请同步更新相关文档。
