#!/bin/bash

# 短视频生成平台 CLI 工具 - 安装脚本

echo "========================================"
echo "  短视频生成平台 CLI 工具 - 安装"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本：$(node -v)"
echo ""

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm"
    exit 1
fi

echo "✓ npm 版本：$(npm -v)"
echo ""

# 进入项目目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 项目目录：$SCRIPT_DIR"
echo ""

# 安装依赖
echo "📦 安装依赖包..."
echo "----------------------------------------"
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "✓ 依赖安装完成"
echo ""

# 全局安装（可选）
echo "🔗 是否要全局安装？（可以在任何目录使用 short-video 命令）"
read -p "是否全局安装？(y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 执行全局安装..."
    npm link
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ 全局安装完成"
        echo ""
        echo "现在可以在任何目录使用："
        echo "  short-video --help"
    else
        echo ""
        echo "⚠️  全局安装失败（可能需要 sudo 权限）"
        echo "可以手动运行：sudo npm link"
    fi
fi

echo ""
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "📖 下一步："
echo ""
echo "1. 配置 API 密钥："
echo "   short-video config"
echo ""
echo "2. 查看支持的提供商："
echo "   short-video providers"
echo ""
echo "3. 生成第一个视频："
echo "   short-video generate \"一只可爱的小猫在草地上玩耍\""
echo ""
echo "4. 查看完整帮助："
echo "   short-video --help"
echo ""
echo "📚 更多文档："
echo "   - README.md       完整功能说明"
echo "   - QUICKSTART.md   快速入门指南"
echo "   - DEVELOPER.md    开发者文档"
echo ""
