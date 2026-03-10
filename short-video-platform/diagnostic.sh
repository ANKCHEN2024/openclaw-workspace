#!/bin/bash
# 诊断脚本 - 检查平台健康状态

echo "🔍 短视频生成平台 - 健康检查"
echo "============================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASS=0
FAIL=0
WARN=0

# 检查函数
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $1"
        ((FAIL++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    ((WARN++))
}

# 1. 检查系统依赖
echo "📦 系统依赖检查"
echo "---------------"

command -v node &> /dev/null
check "Node.js: $(node -v 2>&1)"

command -v python3 &> /dev/null
check "Python3: $(python3 --version 2>&1)"

command -v ffmpeg &> /dev/null
check "FFmpeg: 已安装" || warn "FFmpeg 未安装（视频处理功能将不可用）"

echo ""

# 2. 检查项目结构
echo "📁 项目结构检查"
echo "--------------"

[ -f "backend/package.json" ]
check "后端目录"

[ -f "frontend/index.html" ]
check "前端目录"

[ -f "frontend/register.html" ]
check "注册页面"

[ -f "frontend/settings.html" ]
check "设置页面"

[ -f "cli/package.json" ]
check "CLI 工具"

[ -f "api-providers/package.json" ]
check "API 集成模块"

[ -f "video-processor/src/video_processor.py" ]
check "视频处理模块"

[ -f "start.sh" ]
check "启动脚本"

echo ""

# 3. 检查依赖安装
echo "📦 依赖安装检查"
echo "--------------"

if [ -f "backend/package.json" ]; then
    if [ -d "backend/node_modules" ]; then
        check "后端依赖已安装"
    else
        warn "后端依赖未安装 (运行：cd backend && npm install)"
    fi
fi

if [ -f "cli/package.json" ]; then
    if [ -d "cli/node_modules" ]; then
        check "CLI 依赖已安装"
    else
        warn "CLI 依赖未安装 (运行：cd cli && npm install)"
    fi
fi

if [ -f "api-providers/package.json" ]; then
    if [ -d "api-providers/node_modules" ]; then
        check "API 集成依赖已安装"
    else
        warn "API 集成依赖未安装 (运行：cd api-providers && npm install)"
    fi
fi

echo ""

# 4. 检查服务状态
echo "📡 服务状态检查"
echo "--------------"

if command -v lsof &> /dev/null; then
    if lsof -i:3000 &> /dev/null; then
        check "后端服务 (3000 端口): 运行中"
    else
        warn "后端服务未启动 (运行：cd backend && npm start)"
    fi

    if lsof -i:8080 &> /dev/null; then
        check "前端服务 (8080 端口): 运行中"
    else
        warn "前端服务未启动 (运行：cd frontend && python3 -m http.server 8080)"
    fi
else
    warn "lsof 命令不可用，跳过服务状态检查"
fi

echo ""

# 5. 检查配置文件
echo "⚙️  配置文件检查"
echo "--------------"

if [ -f "backend/config/config.json" ]; then
    check "后端配置文件存在"
    
    # 检查 JSON 是否有效
    if command -v jq &> /dev/null; then
        if jq empty backend/config/config.json 2>/dev/null; then
            check "后端配置文件格式正确"
        else
            warn "后端配置文件格式错误"
        fi
    fi
    
    # 检查是否配置了 API 密钥
    if grep -q '"apiKey": ""' backend/config/config.json 2>/dev/null; then
        warn "部分 API 密钥未配置"
    else
        check "已配置至少一个 API 密钥"
    fi
else
    warn "后端配置文件不存在 (首次启动会自动创建)"
fi

echo ""

# 6. 检查文档
echo "📖 文档完整性检查"
echo "----------------"

[ -f "README.md" ]
check "README.md"

[ -f "QUICKSTART.md" ]
check "QUICKSTART.md"

[ -f "docs/REGISTRATION_GUIDE.md" ]
check "注册指南"

[ -f "docs/PASSWORD_MANAGER_GUIDE.md" ]
check "密码管理器指南"

[ -f "docs/TROUBLESHOOTING.md" ]
check "故障排查指南"

[ -f "docs/DOMESTIC_PLATFORMS_COMPLETE.md" ]
check "国内平台完整指南"

echo ""

# 7. 磁盘空间检查
echo "💾 磁盘空间检查"
echo "--------------"

if command -v df &> /dev/null; then
    AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
    check "可用磁盘空间：$AVAILABLE"
fi

echo ""

# 总结
echo "📊 检查总结"
echo "=========="
echo -e "${GREEN}通过：$PASS${NC}"
echo -e "${RED}失败：$FAIL${NC}"
echo -e "${YELLOW}警告：$WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 系统健康状态良好！${NC}"
else
    echo -e "${RED}❌ 发现 $FAIL 个问题需要修复${NC}"
    echo ""
    echo "建议操作:"
    echo "1. 安装缺失的依赖：cd <目录> && npm install"
    echo "2. 启动服务：./start.sh"
    echo "3. 配置 API 密钥：访问 http://localhost:8080/register.html"
fi

echo ""
echo "详细排查指南：docs/TROUBLESHOOTING.md"
echo ""

# 返回状态码
if [ $FAIL -gt 0 ]; then
    exit 1
else
    exit 0
fi
