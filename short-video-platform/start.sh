#!/bin/bash
# 一键短视频生成平台 - 启动脚本

echo "🎬 一键短视频生成平台"
echo "===================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装"
    exit 1
fi
echo "✅ Python3: $(python3 -v)"

# 检查 ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ 未找到 ffmpeg，请先安装"
    echo "安装命令：brew install ffmpeg"
    exit 1
fi
echo "✅ FFmpeg: $(ffmpeg -version | head -1)"

echo ""
echo "📦 安装依赖..."

# 安装后端依赖
cd backend
npm install --silent
cd ..

# 安装 CLI 依赖
cd cli
npm install --silent
cd ..

# 安装视频处理依赖
cd video-processor
pip3 install -r requirements.txt --quiet
cd ..

echo ""
echo "✅ 所有依赖安装完成"
echo ""
echo "🚀 启动服务..."
echo ""
echo "后端服务：http://localhost:3000"
echo "前端页面：http://localhost:8080"
echo "CLI 工具：short-video --help"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动后端
cd backend
node src/index.js &
BACKEND_PID=$!
cd ..

# 启动前端
cd frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!
cd ..

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 服务已停止'; exit" INT

# 保持运行
wait
