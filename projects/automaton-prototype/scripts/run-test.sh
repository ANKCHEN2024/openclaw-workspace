#!/bin/bash

# Automaton Prototype 测试脚本

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Automaton Prototype - 运行测试                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo ""
echo "🧪 运行测试..."
echo ""

# 运行测试
npm test
