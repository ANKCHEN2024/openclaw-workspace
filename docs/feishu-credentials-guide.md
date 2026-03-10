# 1Password 凭证创建指南

> 文档版本：v1.0  
> 创建日期：2026-03-08  
> 用途：为 5 个飞书 Bot 创建和管理 1Password 凭证

---

## 一、准备工作

### 1.1 前置条件

- [ ] 已安装 1Password 客户端（macOS/Windows/Linux）
- [ ] 已安装 1Password CLI (`op`)
- [ ] 已登录 1Password 账户
- [ ] 已在飞书开放平台创建应用并获取凭证

### 1.2 安装 1Password CLI

**macOS**:
```bash
brew install --cask 1password-cli
```

**验证安装**:
```bash
op --version
```

**登录 1Password**:
```bash
op signin
```

---

## 二、手动创建凭证（推荐）

### 2.1 创建 MOSS-CEO 凭证

#### 步骤 1：打开 1Password
1. 打开 1Password 应用
2. 选择「Personal」保险库（或你的工作保险库）

#### 步骤 2：新建密码项
1. 点击右上角「+ 新建」
2. 选择「密码」类型

#### 步骤 3：填写基本信息
| 字段 | 填写内容 |
|------|----------|
| 标题 | `Feishu MOSS-CEO` |
| 用户名 | `cli_a1b2c3d4e5f6g7h8`（你的 app_id） |
| 密码 | 点击「生成新密码」或粘贴 app_secret |
| 网站 | `https://open.feishu.cn` |

#### 步骤 4：添加自定义字段
点击「添加字段」→「文本字段」，添加以下字段：

| 字段名 | 字段值 | 备注 |
|--------|--------|------|
| `app_id` | `cli_xxxxxxxxxxxxxxx` | 从飞书应用基本信息复制 |
| `verify_token` | `your_verify_token` | 从飞书应用凭证页面复制 |
| `encrypt_key` | `your_encrypt_key` | 从飞书应用凭证页面复制 |

#### 步骤 5：保存
点击「保存」完成创建。

### 2.2 重复创建其他 Bot 凭证

按照相同步骤，创建以下凭证项：

| 凭证标题 | 对应 Bot | 保险库 |
|----------|----------|--------|
| `Feishu MOSS-CEO` | MOSS-CEO 助理 | Personal |
| `Feishu MOSS-PM` | MOSS-项目经理 | Personal |
| `Feishu MOSS-Finance` | MOSS-财务助手 | Personal |
| `Feishu MOSS-HR` | MOSS-人事助手 | Personal |
| `Feishu MOSS-Tech` | MOSS-技术顾问 | Personal |

---

## 三、命令行批量创建（高级）

### 3.1 创建脚本

保存以下脚本为 `scripts/create-feishu-credentials.sh`：

```bash
#!/bin/bash

# 飞书 Bot 凭证批量创建脚本
# 用法：./create-feishu-credentials.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1Password 保险库名称（根据实际情况修改）
VAULT="Personal"

# Bot 列表
declare -a BOTS=(
    "MOSS-CEO:MOSS-CEO 助理"
    "MOSS-PM:MOSS-项目经理"
    "MOSS-Finance:MOSS-财务助手"
    "MOSS-HR:MOSS-人事助手"
    "MOSS-Tech:MOSS-技术顾问"
)

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}飞书 Bot 1Password 凭证创建脚本${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# 检查 1Password CLI 是否安装
if ! command -v op &> /dev/null; then
    echo -e "${RED}错误：1Password CLI 未安装${NC}"
    echo "请先安装：brew install --cask 1password-cli"
    exit 1
fi

# 检查是否已登录
if ! op account get &> /dev/null; then
    echo -e "${YELLOW}未登录 1Password，请先登录${NC}"
    op signin
fi

echo -e "${GREEN}✓ 1Password CLI 已就绪${NC}"
echo ""

# 遍历每个 Bot
for bot_entry in "${BOTS[@]}"; do
    bot_key="${bot_entry%%:*}"
    bot_name="${bot_entry##*:}"
    
    echo -e "${YELLOW}----------------------------------${NC}"
    echo -e "${YELLOW}正在创建：Feishu ${bot_name}${NC}"
    echo -e "${YELLOW}----------------------------------${NC}"
    
    # 提示用户输入凭证
    echo "请从飞书开放平台获取以下信息："
    echo "1. 访问 https://open.feishu.cn/app"
    echo "2. 找到应用「${bot_name}」"
    echo "3. 进入「凭证管理」页面"
    echo ""
    
    read -p "App ID: " app_id
    read -sp "App Secret: " app_secret
    echo ""
    read -sp "Verify Token: " verify_token
    echo ""
    read -sp "Encrypt Key: " encrypt_key
    echo ""
    
    # 检查是否已存在
    if op item get "Feishu ${bot_key}" --vault "${VAULT}" &> /dev/null; then
        echo -e "${YELLOW}警告：凭证项已存在，将更新${NC}"
        
        # 更新现有项
        op item edit "Feishu ${bot_key}" \
            --vault "${VAULT}" \
            username="${app_id}" \
            password="${app_secret}" \
            --field "app_id=${app_id}" \
            --field "verify_token=${verify_token}" \
            --field "encrypt_key=${encrypt_key}"
        
        echo -e "${GREEN}✓ 凭证已更新${NC}"
    else
        # 创建新项
        op item create \
            --vault "${VAULT}" \
            --title "Feishu ${bot_key}" \
            --category password \
            username="${app_id}" \
            password="${app_secret}" \
            --field "app_id=${app_id}" \
            --field "verify_token=${verify_token}" \
            --field "encrypt_key=${encrypt_key}" \
            --field "website=https://open.feishu.cn"
        
        echo -e "${GREEN}✓ 凭证已创建${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}所有凭证创建完成！${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "下一步："
echo "1. 验证凭证：op read 'op://Personal/Feishu MOSS-CEO/app_id'"
echo "2. 更新 OpenClaw 配置：~/.openclaw/feishu-bots-config.yaml"
echo "3. 重启 OpenClaw 使配置生效"
```

### 3.2 使用脚本

```bash
# 赋予执行权限
chmod +x scripts/create-feishu-credentials.sh

# 运行脚本
./scripts/create-feishu-credentials.sh
```

---

## 四、验证凭证

### 4.1 命令行验证

```bash
# 验证 MOSS-CEO 凭证
echo "App ID:"
op read 'op://Personal/Feishu MOSS-CEO/app_id'

echo "App Secret:"
op read 'op://Personal/Feishu MOSS-CEO/password'

echo "Verify Token:"
op read 'op://Personal/Feishu MOSS-CEO/verify_token'

echo "Encrypt Key:"
op read 'op://Personal/Feishu MOSS-CEO/encrypt_key'
```

### 4.2 OpenClaw 配置验证

```bash
# 测试配置加载
openclaw config validate

# 查看 Bot 状态
openclaw status
```

### 4.3 飞书 API 验证

```bash
# 获取访问令牌（测试凭证是否有效）
APP_ID=$(op read 'op://Personal/Feishu MOSS-CEO/app_id')
APP_SECRET=$(op read 'op://Personal/Feishu MOSS-CEO/password')

curl -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":\"${APP_ID}\",\"app_secret\":\"${APP_SECRET}\"}"
```

**预期响应**：
```json
{
  "code": 0,
  "msg": "ok",
  "tenant_access_token": "xxxxx",
  "expire": 7200
}
```

---

## 五、凭证管理最佳实践

### 5.1 安全存储

- ✅ 所有凭证存储在 1Password
- ✅ 禁止硬编码在配置文件或代码中
- ✅ 使用 `$(op read ...)` 动态读取
- ✅ 定期备份 1Password 保险库

### 5.2 凭证轮换

**建议轮换周期**：90 天

**轮换步骤**：
1. 在飞书开放平台重置凭证
2. 更新 1Password 中的凭证
3. 验证 OpenClaw 配置
4. 重启相关服务

**轮换脚本**：
```bash
#!/bin/bash
# 凭证轮换提醒
# 添加到 crontab：0 9 1 * * /path/to/rotate-reminder.sh

echo "📋 飞书 Bot 凭证轮换提醒"
echo ""
echo "以下凭证即将到期（90 天轮换周期）："
echo "- Feishu MOSS-CEO"
echo "- Feishu MOSS-PM"
echo "- Feishu MOSS-Finance"
echo "- Feishu MOSS-HR"
echo "- Feishu MOSS-Tech"
echo ""
echo "请登录飞书开放平台重置凭证并更新 1Password"
```

### 5.3 访问审计

**查看访问日志**：
```bash
# 1Password 审计日志（需在 1Password 后台查看）
# 访问 https://start.1password.com/signin
# 进入「保险库」→「活动」
```

**建议审计频率**：每月一次

### 5.4 应急处理

**凭证泄露应急流程**：
```
1. 立即在飞书开放平台重置凭证
   └─ 访问 https://open.feishu.cn/app
   └─ 选择应用 → 凭证管理 → 重置

2. 更新 1Password 中的凭证
   └─ 打开 1Password
   └─ 找到对应凭证项
   └─ 编辑并更新字段

3. 验证 OpenClaw 配置
   └─ openclaw config validate
   └─ openclaw status

4. 审查访问日志
   └─ 检查是否有异常 API 调用
   └─ 检查是否有未授权访问

5. 通知相关人员
   └─ 磊哥
   └─ 技术团队
```

---

## 六、常见问题

### Q1: `op read` 命令失败
**A**: 确保已登录 1Password：
```bash
op signin
```

### Q2: 凭证项不存在
**A**: 检查保险库名称是否正确：
```bash
# 列出所有保险库
op vault list

# 使用正确的保险库名称
op read 'op://YourVault/Feishu MOSS-CEO/app_id'
```

### Q3: 字段名不匹配
**A**: 检查字段名是否完全一致（区分大小写）：
```bash
# 查看凭证项详情
op item get "Feishu MOSS-CEO" --vault "Personal"
```

### Q4: 权限不足
**A**: 确保你有该保险库的访问权限：
```bash
# 查看保险库权限
op vault get "Personal"
```

---

## 七、凭证清单

| Bot | 1Password 项 | App ID | 状态 | 最后更新 |
|-----|-------------|--------|------|----------|
| MOSS-CEO | `Feishu MOSS-CEO` | 待填写 | ⏳ 未创建 | - |
| MOSS-PM | `Feishu MOSS-PM` | 待填写 | ⏳ 未创建 | - |
| MOSS-Finance | `Feishu MOSS-Finance` | 待填写 | ⏳ 未创建 | - |
| MOSS-HR | `Feishu MOSS-HR` | 待填写 | ⏳ 未创建 | - |
| MOSS-Tech | `Feishu MOSS-Tech` | 待填写 | ⏳ 未创建 | - |

---

**文档维护**：每次创建或更新凭证后，请更新此文档的凭证清单。
