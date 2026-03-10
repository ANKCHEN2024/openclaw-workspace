# 🧪 快速测试指南

## 1. 启动服务

```bash
cd ~/workspace/short-video-platform
./start.sh
```

## 2. 测试 Mock 模式（无需 API 密钥）

```bash
# 创建生成任务
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的柯基在草地上奔跑，阳光明媚",
    "duration": 10,
    "style": "realistic"
  }'

# 返回示例：
# {
#   "success": true,
#   "message": "视频生成任务已创建",
#   "data": {
#     "taskId": "xxxx-xxxx",
#     "status": "pending",
#     "provider": "mock",
#     "estimatedTime": "30 秒"
#   }
# }

# 查询任务状态（使用返回的 taskId）
curl http://localhost:3000/api/tasks/{taskId}

# 查看视频列表
curl http://localhost:3000/api/videos
```

## 3. 测试 Web 界面

打开浏览器访问 http://localhost:8080

1. 首页输入视频描述
2. 点击「生成视频」
3. 观察进度条变化
4. 完成后查看视频库

## 4. 查看提供商列表

```bash
curl http://localhost:3000/api/providers
```

## 5. 配置真实 API（可选）

```bash
# 配置 Runway
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "runway",
    "apiKey": "your_api_key"
  }'
```

## 预期结果

- ✅ 服务启动成功
- ✅ 可以创建视频生成任务
- ✅ 任务状态会更新（pending -> processing -> completed）
- ✅ 可以查看视频列表
- ✅ Mock 模式约 10-15 秒完成

## 故障排查

如果测试失败，运行诊断脚本：

```bash
./diagnostic.sh
```
