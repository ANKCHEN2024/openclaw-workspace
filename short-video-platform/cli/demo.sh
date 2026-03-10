#!/bin/bash

# 短视频生成平台 CLI 工具 - 演示脚本
# 用于展示所有命令的功能

CLI="node bin/cli.js"

echo "========================================"
echo "  短视频生成平台 CLI 工具 - 功能演示"
echo "========================================"
echo ""

# 1. 显示帮助
echo "📖 1. 查看帮助信息"
echo "----------------------------------------"
$CLI --help
echo ""
echo "按回车继续..."
read -r
clear

# 2. 查看支持的提供商
echo "🌐 2. 查看支持的提供商"
echo "----------------------------------------"
$CLI providers
echo ""
echo "按回车继续..."
read -r
clear

# 3. 查看视频列表（空）
echo "📋 3. 查看视频列表"
echo "----------------------------------------"
$CLI list
echo ""
echo "按回车继续..."
read -r
clear

# 4. 生成视频
echo "🎬 4. 生成视频"
echo "----------------------------------------"
echo "生成命令：$CLI generate \"夕阳下的海滩，海浪轻拍沙滩\""
echo ""
$CLI generate "夕阳下的海滩，海浪轻拍沙滩"
echo ""
echo "按回车继续..."
read -r
clear

# 5. 查看视频列表（有数据）
echo "📋 5. 再次查看视频列表"
echo "----------------------------------------"
$CLI list
echo ""
echo "按回车继续..."
read -r
clear

# 6. 批量生成
echo "🔄 6. 批量生成视频"
echo "----------------------------------------"
echo "生成命令：$CLI generate \"四季风景\" --batch 2"
echo ""
$CLI generate "四季风景" --batch 2
echo ""
echo "按回车继续..."
read -r
clear

# 7. 查看视频列表
echo "📋 7. 查看所有视频"
echo "----------------------------------------"
$CLI list --limit 5
echo ""
echo "按回车继续..."
read -r
clear

echo "========================================"
echo "  演示完成！"
echo "========================================"
echo ""
echo "其他可用命令："
echo "  - show <id>      : 查看视频详情"
echo "  - download <id>  : 下载视频"
echo "  - delete <id>    : 删除视频"
echo "  - config         : 配置 API 密钥"
echo "  - status <id>    : 查看生成状态"
echo ""
