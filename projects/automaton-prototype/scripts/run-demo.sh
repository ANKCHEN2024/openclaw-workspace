#!/bin/bash

# Automaton Prototype 演示脚本

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Automaton Prototype - 快速演示                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查环境配置
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境配置..."
    cp .env.example .env
fi

echo ""
echo "🚀 启动 Agent..."
echo ""

# 运行演示
npm run dev

echo ""
echo "✅ 演示完成！"
