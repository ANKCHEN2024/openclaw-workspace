#!/bin/bash
# scripts/1password-setup.sh
# 1Password 集成配置脚本

set -e

echo "🔐 1Password 集成配置脚本"
echo "================================"
echo ""

# 检查 1Password CLI 是否安装
if ! command -v op &> /dev/null; then
  echo "❌ 1Password CLI 未安装"
  echo ""
  echo "请先安装："
  echo "  brew install --cask 1password-cli"
  exit 1
fi

echo "✅ 1Password CLI 已安装：$(op --version)"
echo ""

# 检查登录状态
echo "📋 检查登录状态..."
if ! op account get &> /dev/null; then
  echo "⚠️  未登录 1Password"
  echo ""
  echo "请登录（支持 TouchID/面容 ID）："
  echo "  eval \$(op signin)"
  echo ""
  read -p "按 Enter 继续登录..."
  eval $(op signin)
fi

echo "✅ 已登录 1Password"
echo ""

# 显示账户信息
echo "📊 账户信息："
op account get --format json | jq -r '.email, .account_type' 2>/dev/null || echo "  (无法获取详细信息)"
echo ""

# 创建 OpenClaw 凭证目录
echo "📁 创建配置目录..."
mkdir -p ~/.openclaw/credentials
echo "✅ 目录已创建：~/.openclaw/credentials"
echo ""

# 创建凭证管理脚本
echo "📝 创建凭证管理脚本..."
cat > ~/.openclaw/credentials/load-secrets.sh << 'EOF'
#!/bin/bash
# 加载所有凭证到环境变量

# 检查 1Password 登录
if ! op account get &> /dev/null; then
  echo "请先登录 1Password: eval \$(op signin)"
  exit 1
fi

# 飞书 Bot 凭证
export FEISHU_MOSS_SECRET=$(op read "op://Personal/Feishu MOSS-CEO/password" 2>/dev/null || echo "")
export FEISHU_MOSS_APPID=$(op read "op://Personal/Feishu MOSS-CEO/app_id" 2>/dev/null || echo "")

# GitHub Token
export GITHUB_TOKEN=$(op read "op://Personal/GitHub ANKCHEN2024/password" 2>/dev/null || echo "")

echo "✅ 凭证已加载到环境变量"
EOF

chmod +x ~/.openclaw/credentials/load-secrets.sh
echo "✅ 脚本已创建：~/.openclaw/credentials/load-secrets.sh"
echo ""

# 创建 .zshrc 集成
echo "📝 配置 Shell 集成..."
if ! grep -q "1Password" ~/.zshrc 2>/dev/null; then
  cat >> ~/.zshrc << 'EOF'

# 1Password 凭证加载
alias op-load='source ~/.openclaw/credentials/load-secrets.sh'
EOF
  echo "✅ 已添加到 ~/.zshrc"
  echo "   使用 'op-load' 命令加载凭证"
else
  echo "✅ Shell 集成已存在"
fi
echo ""

# 创建凭证存储指南
echo "📖 创建凭证存储指南..."
cat > ~/.openclaw/credentials/README.md << 'EOF'
# 1Password 凭证管理

## 快速开始

```bash
# 1. 登录 1Password
eval $(op signin)

# 2. 加载凭证到环境变量
op-load

# 3. 验证
echo $GITHUB_TOKEN
```

## 存储新凭证

```bash
# 飞书 Bot
op item create --title="Feishu MOSS-CEO" \
  --category=Password \
  --password="your_app_secret" \
  --label="app_id:cli_xxx"

# GitHub
op item create --title="GitHub ANKCHEN2024" \
  --category=Password \
  --password="ghp_xxx"
```

## 读取凭证

```bash
# 单个读取
op read "op://Personal/Feishu MOSS-CEO/password"

# 批量加载
op-load
```

## 可用凭证

| 名称 | 用途 | 命令 |
|------|------|------|
| FEISHU_MOSS_SECRET | 飞书主 Bot | `echo $FEISHU_MOSS_SECRET` |
| GITHUB_TOKEN | GitHub 推送 | `echo $GITHUB_TOKEN` |

## 安全提示

- ✅ 所有凭证加密存储在 1Password
- ✅ 使用 TouchID/面容 ID 解锁
- ✅ 不要明文保存凭证文件
- ✅ 定期轮换敏感凭证
EOF

echo "✅ 指南已创建：~/.openclaw/credentials/README.md"
echo ""

# 检查现有凭证
echo "🔍 检查现有凭证..."
echo ""

# 检查飞书凭证
if op item get "Feishu MOSS-CEO" &> /dev/null; then
  echo "✅ 飞书 Bot 凭证：已存在"
else
  echo "⚠️  飞书 Bot 凭证：未找到"
  echo "   创建命令："
  echo '   op item create --title="Feishu MOSS-CEO" --category=Password --password="your_secret" --label="app_id:cli_xxx"'
fi

# 检查 GitHub 凭证
if op item get "GitHub ANKCHEN2024" &> /dev/null; then
  echo "✅ GitHub 凭证：已存在"
else
  echo "⚠️  GitHub 凭证：未找到"
  echo "   创建命令："
  echo '   op item create --title="GitHub ANKCHEN2024" --category=Password --password="ghp_xxx"'
fi

echo ""
echo "================================"
echo "✅ 1Password 集成配置完成！"
echo ""
echo "下一步："
echo "1. 在 1Password 中创建凭证项"
echo "2. 运行 'op-load' 加载凭证"
echo "3. 在 OpenClaw 配置中使用环境变量"
echo ""
echo "详细文档：~/.openclaw/credentials/README.md"
echo "================================"
