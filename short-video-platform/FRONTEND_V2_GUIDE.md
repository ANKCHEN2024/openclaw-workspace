# 🎨 前端 V2.0 升级指南

## 升级内容

### 新增页面

| 页面 | 文件 | 功能 |
|------|------|------|
| 登录/注册 | `login.html` | 用户登录和注册 |
| 个人中心 | `profile.html` | 用户资料、密码修改 |

### 新增 JS 模块

| 文件 | 功能 |
|------|------|
| `js/auth.js` | 认证管理、Token 处理、API 请求封装 |
| `js/login.js` | 登录/注册页面逻辑 |
| `js/profile.js` | 个人中心页面逻辑 |

### 更新文件

| 文件 | 更新内容 |
|------|----------|
| `js/app.js` | 支持 JWT Token 认证 |
| `index.html` | 添加 auth.js 引用 |
| `videos.html` | 添加 auth.js 引用 |
| `settings.html` | 添加 auth.js 引用 |
| `video-detail.html` | 添加 auth.js 引用 |

---

## 🚀 使用方式

### 1. 启动服务

```bash
cd ~/workspace/short-video-platform
./start.sh
```

### 2. 访问登录页面

打开 http://localhost:8080/login.html

### 3. 注册账号

- 切换到"注册"标签
- 输入用户名、邮箱、密码
- 点击注册

### 4. 登录

- 输入用户名和密码
- 点击登录
- 自动跳转到首页

### 5. 查看个人中心

点击导航栏"我的"或访问 http://localhost:8080/profile.html

---

## 📱 功能特性

### 认证功能
- ✅ JWT Token 自动管理
- ✅ 登录状态持久化
- ✅ Token 过期自动跳转
- ✅ 登录/注册表单验证

### 用户功能
- ✅ 查看个人资料
- ✅ 编辑用户名和邮箱
- ✅ 修改密码
- ✅ 查看生成统计
- ✅ 退出登录

### 权限控制
- ✅ 登录后才能访问个人中心
- ✅ 未登录用户只能看到自己的视频
- ✅ 登录用户可以管理自己的视频

---

## 🔧 API 接口

### 认证相关

```javascript
// 登录
Auth.login(username, password)

// 注册
Auth.register(username, email, password)

// 登出
Auth.logout()

// 获取当前用户
Auth.getCurrentUser()

// 更新资料
Auth.updateProfile({ username, email })

// 修改密码
Auth.changePassword(currentPassword, newPassword)

// 检查登录状态
Auth.isLoggedIn()

// 获取 Token
Auth.getToken()
```

### 带认证的 API 请求

```javascript
// 发送需要认证的请求
Auth.authRequest('/videos', {
  method: 'GET'
})
```

---

## 📝 本地存储

登录信息存储在 localStorage：
- `sv_token` - JWT Token
- `sv_user` - 用户信息

---

## 🎯 权限说明

| 功能 | 未登录 | 已登录 |
|------|--------|--------|
| 生成视频 | ✅ | ✅ |
| 查看视频列表 | ✅ (所有公开) | ✅ (自己的) |
| 删除视频 | ❌ | ✅ (自己的) |
| 个人中心 | ❌ | ✅ |
| 修改密码 | ❌ | ✅ |

---

## 🐛 故障排查

### 登录后提示过期
可能是后端 JWT 密钥不匹配，检查后端配置。

### 无法获取用户信息
确保前端和后端服务都已启动。

### 页面不显示登录状态
刷新页面或检查浏览器控制台错误。

---

## 📦 文件结构

```
frontend/
├── login.html              # 登录/注册页面 [新增]
├── profile.html            # 个人中心 [新增]
├── js/
│   ├── auth.js            # 认证模块 [新增]
│   ├── login.js           # 登录逻辑 [新增]
│   ├── profile.js         # 个人中心逻辑 [新增]
│   └── app.js             # [更新] 支持认证
└── [其他页面.html]         # [更新] 添加 auth.js 引用
```
