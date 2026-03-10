# 🔧 故障排查指南

## 常见问题及解决方案

### 1. ❌ API 提供商加载失败

**现象**: 设置页面看不到国内 API 选项

**原因**: 
- 后端服务未启动
- `providers.js` 文件未更新

**解决方案**:
```bash
# 1. 重启后端
cd /Users/chenggl/workspace/short-video-platform/backend
npm install
npm start

# 2. 检查 providers.js 是否存在
ls -la backend/src/routes/providers.js

# 3. 测试 API
curl http://localhost:3000/api/providers
```

---

### 2. ❌ 配置保存失败

**现象**: 点击保存后提示错误

**原因**:
- 后端未启动
- 配置文件权限问题
- CORS 跨域问题

**解决方案**:
```bash
# 1. 确保后端已启动
cd backend
npm start

# 2. 检查配置文件权限
chmod 644 backend/config/config.json

# 3. 查看后端日志
tail -f backend/logs/app.log
```

---

### 3. ❌ 视频生成失败

**现象**: 提交后显示失败或超时

**可能原因**:

#### 3.1 API 密钥未配置
```bash
# 检查配置
curl http://localhost:3000/api/config

# 如果有密钥，应该返回（隐藏敏感信息）:
# {"providers": {"volcengine": {"apiKey": "***"}}}
```

**解决**: 在设置页面配置 API 密钥

#### 3.2 API 密钥无效
```bash
# 测试 API 密钥
curl -X POST http://localhost:3000/api/config/test \
  -H "Content-Type: application/json" \
  -d '{"provider": "volcengine"}'
```

**解决**: 重新获取 API 密钥（访问平台控制台）

#### 3.3 余额不足
```bash
# 查看使用额度（需要访问各平台控制台）
# 火山引擎：https://console.volcengine.com/bill
# 阿里云：https://usercenter2.aliyun.com/bill
```

**解决**: 充值或切换到其他有免费额度的平台

#### 3.4 网络问题
```bash
# 测试网络连接
ping console.volcengine.com

# 测试 API 端点
curl -I https://console.volcengine.com/
```

**解决**: 检查网络连接，或使用代理

---

### 4. ❌ TypeScript 编译错误

**现象**: `api-providers` 模块无法使用

**原因**: 
- 未安装依赖
- TypeScript 配置问题
- 类型定义缺失

**解决方案**:
```bash
cd api-providers

# 1. 安装依赖
npm install

# 2. 编译 TypeScript
npm run build

# 3. 如果还有错误，检查 tsconfig.json
cat tsconfig.json
```

---

### 5. ❌ 前端页面空白

**现象**: 访问 http://localhost:8080 显示空白

**原因**:
- 前端服务未启动
- 文件路径错误
- 浏览器缓存

**解决方案**:
```bash
# 1. 启动前端服务
cd frontend
python3 -m http.server 8080

# 2. 清除浏览器缓存
# Chrome: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)

# 3. 检查文件是否存在
ls -la frontend/index.html
ls -la frontend/register.html
```

---

### 6. ❌ 注册页面打不开

**现象**: 点击「注册 API」404 错误

**原因**: `register.html` 文件不存在

**解决方案**:
```bash
# 检查文件
ls -la frontend/register.html

# 如果不存在，重新创建
# （文件应该在之前的步骤中已创建）
```

---

### 7. ❌ 密码管理器无法使用

**现象**: 浏览器不提示保存密码

**原因**:
- 浏览器密码管理功能未开启
- 使用了隐私模式

**解决方案**:

#### Chrome
```
1. 设置 → 自动填充 → 密码管理器
2. 开启「保存密码」
3. 开启「自动登录」
```

#### Safari
```
1. 偏好设置 → 密码
3. 开启「自动填充密码」
```

#### Firefox
```
1. 设置 → 隐私与安全
2. 勾选「询问是否保存登录信息」
```

---

### 8. ❌ 一键启动脚本失败

**现象**: `./start.sh` 执行失败

**可能原因**:
- 缺少执行权限
- 缺少依赖（Node.js、Python、ffmpeg）

**解决方案**:
```bash
# 1. 赋予执行权限
chmod +x start.sh

# 2. 检查依赖
node -v      # 应该显示版本号
python3 -v   # 应该显示版本号
ffmpeg -version  # 应该显示版本信息

# 3. 安装缺失的依赖
brew install node python3 ffmpeg  # macOS
```

---

## 快速诊断脚本

创建诊断脚本自动检查问题：

```bash
#!/bin/bash
# diagnostic.sh

echo "🔍 短视频生成平台诊断工具"
echo "========================"
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node -v)"
else
    echo "❌ Node.js 未安装"
fi

# 检查 Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3: $(python3 -v)"
else
    echo "❌ Python3 未安装"
fi

# 检查 ffmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg: 已安装"
else
    echo "❌ FFmpeg 未安装"
fi

# 检查后端
if [ -f "backend/package.json" ]; then
    echo "✅ 后端目录：存在"
else
    echo "❌ 后端目录：不存在"
fi

# 检查前端
if [ -f "frontend/index.html" ]; then
    echo "✅ 前端目录：存在"
else
    echo "❌ 前端目录：不存在"
fi

# 检查注册页面
if [ -f "frontend/register.html" ]; then
    echo "✅ 注册页面：存在"
else
    echo "❌ 注册页面：不存在"
fi

# 检查 API 提供商
if [ -f "api-providers/package.json" ]; then
    echo "✅ API 集成模块：存在"
else
    echo "❌ API 集成模块：不存在"
fi

# 检查服务状态
echo ""
echo "📡 服务状态:"
if lsof -i:3000 &> /dev/null; then
    echo "✅ 后端服务 (3000): 运行中"
else
    echo "❌ 后端服务 (3000): 未启动"
fi

if lsof -i:8080 &> /dev/null; then
    echo "✅ 前端服务 (8080): 运行中"
else
    echo "❌ 前端服务 (8080): 未启动"
fi

echo ""
echo "诊断完成！"
```

使用方法:
```bash
chmod +x diagnostic.sh
./diagnostic.sh
```

---

## 获取帮助

### 查看日志

```bash
# 后端日志
tail -f backend/logs/app.log

# 前端错误
# 打开浏览器开发者工具 → Console

# 系统日志
tail -f /var/log/system.log
```

### 提交问题

如果以上方法都无法解决，请提供：

1. **错误信息**: 完整的错误提示
2. **操作步骤**: 你是怎么操作的
3. **环境信息**: 
   ```bash
   node -v
   python3 -v
   ffmpeg -version
   uname -a
   ```
4. **日志文件**: `backend/logs/app.log`

---

## 预防措施

### 定期检查

```bash
# 每周检查一次
./diagnostic.sh

# 更新依赖
cd backend && npm update
cd cli && npm update
cd api-providers && npm update
```

### 备份配置

```bash
# 备份配置文件
cp backend/config/config.json backend/config/config.json.backup

# 备份 API 密钥（加密存储）
# 建议使用密码管理器保存
```

### 监控额度

```bash
# 定期检查各平台剩余额度
# 访问各平台控制台查看
```

---

## 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|----------|------|----------|
| 401 | 未授权 | 检查 API 密钥 |
| 403 | 禁止访问 | 检查权限和余额 |
| 404 | 未找到 | 检查 URL 和路由 |
| 429 | 请求过多 | 降低频率或升级套餐 |
| 500 | 服务器错误 | 查看日志，联系支持 |
| 503 | 服务不可用 | 稍后重试 |

---

保持冷静，按照步骤排查，大部分问题都能解决！💪
