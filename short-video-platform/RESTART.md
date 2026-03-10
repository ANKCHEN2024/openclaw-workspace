# 🔄 重启服务指南

## 修改已生效

后端路由已更新为**强制登录模式**：
- ✅ 生成视频需要登录
- ✅ 查看视频列表需要登录
- ✅ 查看视频详情需要登录
- ✅ 查看任务需要登录

前端页面已添加登录检查：
- ✅ 未登录显示登录提示
- ✅ 隐藏功能界面

## 如何重启服务

### 方法 1: 停止并重新运行 start.sh

1. 按 `Ctrl+C` 停止当前服务
2. 重新运行:
   ```bash
   cd ~/workspace/short-video-platform
   ./start.sh
   ```

### 方法 2: 只重启后端

1. 找到后端进程并停止:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. 只启动后端:
   ```bash
   cd ~/workspace/short-video-platform/backend
   node src/index.js
   ```

3. 前端用 Python 启动:
   ```bash
   cd ~/workspace/short-video-platform/frontend
   python3 -m http.server 8080
   ```

## 验证修改

重启后测试:

```bash
# 未登录访问视频列表（应该返回 401）
curl http://localhost:3000/api/videos

# 登录后访问（应该成功）
curl http://localhost:3000/api/videos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 访问地址

- 登录页面: http://localhost:8080/login.html
- 首页: http://localhost:8080 (未登录会显示登录提示)
