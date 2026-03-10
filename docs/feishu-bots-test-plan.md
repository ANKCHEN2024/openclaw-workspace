# 飞书 Bot 测试计划

> 文档版本：v1.0  
> 创建日期：2026-03-08  
> 用途：验证 5 个 Bot 的功能完整性和稳定性

---

## 一、测试环境

### 1.1 环境配置

| 项目 | 配置 |
|------|------|
| 测试群组 | 创建测试群「MOSS Bot 测试群」 |
| 测试成员 | 磊哥 + 至少 2 名测试人员 |
| OpenClaw 版本 | 最新稳定版 |
| 1Password | 已安装 CLI 并登录 |
| 网络 | 稳定的互联网连接 |

### 1.2 测试数据准备

- [ ] 5 个飞书应用已创建并发布
- [ ] 5 套凭证已存储到 1Password
- [ ] OpenClaw 配置已更新
- [ ] 测试群组已创建

---

## 二、测试清单

### 2.1 连接测试

| 测试项 | MOSS-CEO | MOSS-PM | MOSS-Finance | MOSS-HR | MOSS-Tech |
|--------|----------|---------|--------------|---------|-----------|
| Bot 能正常登录 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 头像/名称显示正确 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 状态在线 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**测试步骤**：
1. 在测试群中添加所有 Bot
2. 观察 Bot 是否正常显示
3. 使用 `openclaw status` 检查 Bot 状态

**预期结果**：
- 所有 Bot 在群内可见
- Bot 头像、名称正确
- OpenClaw 状态显示为「在线」

---

### 2.2 消息发送测试

| 测试项 | MOSS-CEO | MOSS-PM | MOSS-Finance | MOSS-HR | MOSS-Tech |
|--------|----------|---------|--------------|---------|-----------|
| Bot 能发送文本消息 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 能发送富文本 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 能发送文件 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 消息格式正确 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**测试步骤**：
```bash
# 在测试群发送消息
@MOSS-CEO 助理 你好，请回复
@MOSS-项目经理 你好，请回复
@MOSS-财务助手 你好，请回复
@MOSS-人事助手 你好，请回复
@MOSS-技术顾问 你好，请回复
```

**预期结果**：
- 每个 Bot 都能回复消息
- 回复内容符合角色定位
- 消息格式正常（无乱码）

---

### 2.3 消息接收测试

| 测试项 | MOSS-CEO | MOSS-PM | MOSS-Finance | MOSS-HR | MOSS-Tech |
|--------|----------|---------|--------------|---------|-----------|
| Bot 能接收群消息 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 能识别@提及 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Bot 能解析命令 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**测试步骤**：
1. 在群内发送普通消息（不@Bot）
2. 在群内发送@Bot 消息
3. 发送包含命令的消息

**预期结果**：
- Bot 能正确接收消息
- 仅在@提及时响应（根据配置）
- 命令解析正确

---

### 2.4 权限测试

| 测试项 | MOSS-CEO | MOSS-PM | MOSS-Finance | MOSS-HR | MOSS-Tech |
|--------|----------|---------|--------------|---------|-----------|
| 文档访问权限 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 多维表格访问 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 日历访问权限 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 权限隔离正常 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**测试步骤**：
```bash
# 测试文档访问
@MOSS-CEO 助理 请创建一个测试文档

# 测试表格访问
@MOSS-项目经理 请查看项目看板

# 测试权限隔离（跨权限访问应失败）
@MOSS-Tech 请查看财务数据表
```

**预期结果**：
- 各 Bot 能访问授权资源
- 跨权限访问被拒绝
- 错误提示清晰

---

### 2.5 消息路由测试

| 测试项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| @MOSS-CEO 仅 CEO 响应 | CEO 响应 | ⬜ | ⬜ |
| @MOSS-PM 仅 PM 响应 | PM 响应 | ⬜ | ⬜ |
| 无@时主 Bot 响应 | 主 Bot 响应 | ⬜ | ⬜ |
| 非目标群不响应 | 静默 | ⬜ | ⬜ |
| 无重复响应 | 单次响应 | ⬜ | ⬜ |

**测试步骤**：
1. 在测试群@MOSS-CEO，观察响应
2. 在测试群@MOSS-PM，观察响应
3. 在测试群发送普通消息，观察主 Bot 响应
4. 同时在多个群测试隔离

**预期结果**：
- 仅被@的 Bot 响应
- 无@时仅主 Bot 响应
- 非目标群 Bot 静默
- 无重复响应

---

### 2.6 1Password 凭证测试

| 测试项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| CEO 凭证读取正常 | 成功 | ⬜ | ⬜ |
| PM 凭证读取正常 | 成功 | ⬜ | ⬜ |
| Finance 凭证读取正常 | 成功 | ⬜ | ⬜ |
| HR 凭证读取正常 | 成功 | ⬜ | ⬜ |
| Tech 凭证读取正常 | 成功 | ⬜ | ⬜ |
| 凭证错误时告警 | 告警 | ⬜ | ⬜ |

**测试步骤**：
```bash
# 测试凭证读取
op read 'op://Personal/Feishu MOSS-CEO/app_id'
op read 'op://Personal/Feishu MOSS-PM/app_id'
op read 'op://Personal/Feishu MOSS-Finance/app_id'
op read 'op://Personal/Feishu MOSS-HR/app_id'
op read 'op://Personal/Feishu MOSS-Tech/app_id'

# 测试错误凭证（临时修改）
# 观察 OpenClaw 是否告警
```

**预期结果**：
- 所有凭证可正常读取
- 凭证错误时 OpenClaw 告警
- 告警信息清晰

---

### 2.7 性能测试

| 测试项 | 目标 | 实际 | 状态 |
|--------|------|------|------|
| 响应时间 <2 秒 | <2s | ⬜ | ⬜ |
| 并发消息处理 | 正常 | ⬜ | ⬜ |
| 长时间运行稳定 | 24h+ | ⬜ | ⬜ |
| 内存占用正常 | <500MB | ⬜ | ⬜ |

**测试步骤**：
```bash
# 并发消息测试
for i in {1..10}; do
  @MOSS-CEO 助理 测试消息 $i &
done

# 长时间运行监控
watch -n 60 'openclaw status'
```

**预期结果**：
- 响应时间符合预期
- 并发处理正常
- 长时间运行无崩溃
- 资源占用合理

---

### 2.8 异常处理测试

| 测试项 | 预期行为 | 实际 | 状态 |
|--------|----------|------|------|
| 网络中断 | 重试机制 | ⬜ | ⬜ |
| 凭证过期 | 告警通知 | ⬜ | ⬜ |
| API 限流 | 降级处理 | ⬜ | ⬜ |
| 消息格式错误 | 友好提示 | ⬜ | ⬜ |

**测试步骤**：
1. 模拟网络中断（关闭网络）
2. 观察重试行为
3. 恢复网络，验证自动重连

**预期结果**：
- 网络中断时重试
- 凭证过期时告警
- API 限流时降级
- 错误提示友好

---

## 三、自动化测试脚本

### 3.1 连接测试脚本

创建文件 `scripts/test-feishu-bots.sh`：

```bash
#!/bin/bash

# 飞书 Bot 连接测试脚本
# 用法：./test-feishu-bots.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Bot 列表
declare -a BOTS=(
    "MOSS-CEO:Feishu MOSS-CEO"
    "MOSS-PM:Feishu MOSS-PM"
    "MOSS-Finance:Feishu MOSS-Finance"
    "MOSS-HR:Feishu MOSS-HR"
    "MOSS-Tech:Feishu MOSS-Tech"
)

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}飞书 Bot 连接测试${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# 检查 1Password CLI
if ! command -v op &> /dev/null; then
    echo -e "${RED}错误：1Password CLI 未安装${NC}"
    exit 1
fi

# 检查是否已登录
if ! op account get &> /dev/null; then
    echo -e "${YELLOW}未登录 1Password，请先登录${NC}"
    op signin
fi

# 测试每个 Bot 的凭证
passed=0
failed=0

for bot_entry in "${BOTS[@]}"; do
    bot_key="${bot_entry%%:*}"
    credential_name="${bot_entry##*:}"
    
    echo -e "${YELLOW}测试：${bot_key}${NC}"
    
    # 测试凭证读取
    if app_id=$(op read "op://Personal/${credential_name}/app_id" 2>/dev/null); then
        if app_secret=$(op read "op://Personal/${credential_name}/password" 2>/dev/null); then
            if verify_token=$(op read "op://Personal/${credential_name}/verify_token" 2>/dev/null); then
                if encrypt_key=$(op read "op://Personal/${credential_name}/encrypt_key" 2>/dev/null); then
                    echo -e "  ${GREEN}✓ 凭证读取成功${NC}"
                    echo -e "  App ID: ${app_id:0:10}..."
                    ((passed++))
                else
                    echo -e "  ${RED}✗ encrypt_key 读取失败${NC}"
                    ((failed++))
                fi
            else
                echo -e "  ${RED}✗ verify_token 读取失败${NC}"
                ((failed++))
            fi
        else
            echo -e "  ${RED}✗ app_secret 读取失败${NC}"
            ((failed++))
        fi
    else
        echo -e "  ${RED}✗ app_id 读取失败${NC}"
        ((failed++))
    fi
    
    echo ""
done

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "通过：${GREEN}${passed}${NC}"
echo -e "失败：${RED}${failed}${NC}"
echo ""

if [ $failed -gt 0 ]; then
    echo -e "${RED}部分测试失败，请检查 1Password 配置${NC}"
    exit 1
else
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
fi
```

### 3.2 使用测试脚本

```bash
# 赋予执行权限
chmod +x scripts/test-feishu-bots.sh

# 运行测试
./scripts/test-feishu-bots.sh
```

### 3.3 OpenClaw 状态检查

```bash
#!/bin/bash
# 检查 OpenClaw Bot 状态

echo "OpenClaw Bot 状态检查"
echo "===================="
echo ""

openclaw status

echo ""
echo "健康检查"
echo "========"
openclaw health
```

---

## 四、测试报告模板

### 4.1 测试结果汇总

| 测试类别 | 测试项数 | 通过 | 失败 | 通过率 |
|----------|----------|------|------|--------|
| 连接测试 | 15 | - | - | - |
| 消息发送 | 20 | - | - | - |
| 消息接收 | 15 | - | - | - |
| 权限测试 | 20 | - | - | - |
| 消息路由 | 5 | - | - | - |
| 凭证测试 | 6 | - | - | - |
| 性能测试 | 4 | - | - | - |
| 异常处理 | 4 | - | - | - |
| **总计** | **89** | **-** | **-** | **-** |

### 4.2 问题记录

| 编号 | 问题描述 | 严重程度 | 状态 | 备注 |
|------|----------|----------|------|------|
| 001 | - | - | ⏳ 待修复 | - |
| 002 | - | - | ⏳ 待修复 | - |

### 4.3 测试结论

```
测试日期：YYYY-MM-DD
测试人员：[姓名]
测试环境：[环境描述]

整体结论：□ 通过  □ 有条件通过  □ 不通过

主要问题：
1. ...
2. ...

建议：
1. ...
2. ...
```

---

## 五、上线检查清单

### 5.1 上线前检查

- [ ] 所有测试项通过
- [ ] 无严重/高危问题
- [ ] 性能指标达标
- [ ] 文档已更新
- [ ] 备份已完成

### 5.2 上线步骤

1. 确认测试环境验证通过
2. 将配置应用到生产环境
3. 在生产环境进行冒烟测试
4. 监控运行状态（24 小时）
5. 确认无异常后正式上线

### 5.3 上线后监控

- [ ] Bot 在线状态正常
- [ ] 消息响应时间正常
- [ ] 无异常错误日志
- [ ] 用户反馈正常

---

## 六、回滚计划

### 6.1 回滚条件

出现以下情况时执行回滚：
- Bot 大面积离线
- 消息响应失败率 >10%
- 凭证泄露风险
- 严重安全漏洞

### 6.2 回滚步骤

```bash
# 1. 停止所有 Bot
openclaw bot stop --all

# 2. 恢复旧配置
cp ~/.openclaw/feishu-bots-config.yaml.backup ~/.openclaw/feishu-bots-config.yaml

# 3. 重启 OpenClaw
openclaw restart

# 4. 验证回滚
openclaw status
```

---

**文档维护**：每次测试完成后，请更新测试结果和问题记录。
