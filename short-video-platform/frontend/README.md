# 短视频生成平台 - Web 前端

一个简洁现代的短视频生成平台 Web 前端界面，支持文生视频和图生视频功能。

## 📁 项目结构

```
frontend/
├── index.html          # 首页 - 视频生成表单
├── videos.html         # 视频库 - 展示所有生成的视频
├── video-detail.html   # 视频详情 - 预览、下载、删除
├── settings.html       # 设置页面 - 配置 API 密钥
├── css/
│   └── style.css       # 全局样式文件
├── js/
│   └── app.js          # 主应用逻辑
└── assets/             # 静态资源目录
└── README.md           # 本说明文件
```

## 🚀 快速开始

### 1. 直接打开

由于是纯静态页面，可以直接用浏览器打开：

```bash
# 在浏览器中打开
open index.html
```

### 2. 使用本地服务器（推荐）

```bash
# 使用 Python
cd frontend
python3 -m http.server 8080

# 或使用 Node.js
npx serve .

# 然后访问 http://localhost:8080
```

### 3. 使用 Live Server（VS Code）

1. 安装 VS Code 的 Live Server 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## ⚙️ 配置

### 首次使用

1. 打开 **设置页面** (`settings.html`)
2. 输入你的 **API 密钥**
3. 输入 **API 地址**（默认：`http://localhost:3000/api`）
4. 点击 **测试连接** 验证配置
5. 点击 **保存设置**

### API 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| API 密钥 | 短视频生成服务的认证密钥 | `sk-xxxxxxxxxxxx` |
| API 地址 | 后端服务的 baseURL | `http://localhost:3000/api` |

## 📄 页面功能

### 首页 (`index.html`)

- **视频描述输入**：详细描述想要生成的视频内容
- **图片上传**：支持拖拽上传参考图片（图生视频）
- **风格选择**：8 种视频风格可选
  - 写实风格、动漫风格、电影质感
  - 卡通风格、艺术风格、奇幻风格
  - 科幻风格、极简风格
- **时长设置**：5 秒到 60 秒可选
- **实时进度**：显示视频生成进度

### 视频库 (`videos.html`)

- 网格展示所有生成的视频
- 显示视频状态（已完成/生成中/失败）
- 点击卡片查看视频详情
- 空状态引导创建新视频

### 视频详情 (`video-detail.html`)

- 视频播放器（支持播放控制）
- 显示视频元信息（创建时间、时长、风格）
- 下载视频功能
- 删除视频功能
- 查看生成提示词

### 设置页面 (`settings.html`)

- API 密钥配置（本地存储）
- API 地址配置
- 连接测试功能
- 使用说明和常见问题

## 🎨 设计特点

- **响应式设计**：适配桌面、平板、手机
- **现代 UI**：简洁美观的界面设计
- **流畅交互**：平滑的动画和过渡效果
- **中文界面**：完整的中文本地化
- **无障碍**：支持键盘导航

## 🔌 API 接口

前端需要后端提供以下 API 接口：

### 生成视频
```
POST /api/videos/generate
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "prompt": "视频描述",
  "style": "realistic",
  "duration": 10,
  "image": "data:image/jpeg;base64,..."  // 可选
}

Response:
{
  "data": {
    "task_id": "xxx"
  }
}
```

### 查询任务状态
```
GET /api/tasks/{task_id}
Authorization: Bearer {api_key}

Response:
{
  "data": {
    "status": "processing|completed|failed",
    "progress": 50,
    "video_id": "xxx",
    "error": "错误信息"  // 仅在失败时
  }
}
```

### 获取视频列表
```
GET /api/videos
Authorization: Bearer {api_key}

Response:
{
  "data": [
    {
      "id": "xxx",
      "title": "视频标题",
      "prompt": "生成提示词",
      "style": "realistic",
      "duration": 10,
      "status": "completed",
      "video_url": "https://...",
      "thumbnail_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 获取视频详情
```
GET /api/videos/{video_id}
Authorization: Bearer {api_key}

Response:
{
  "data": {
    "id": "xxx",
    "title": "视频标题",
    "prompt": "生成提示词",
    "style": "realistic",
    "duration": 10,
    "status": "completed",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 删除视频
```
DELETE /api/videos/{video_id}
Authorization: Bearer {api_key}

Response:
{
  "success": true
}
```

### 健康检查
```
GET /api/health

Response:
{
  "status": "ok"
}
```

## 🛠️ 自定义

### 修改主题色

编辑 `css/style.css` 中的 CSS 变量：

```css
:root {
  --primary-color: #6366f1;      /* 主色调 */
  --primary-hover: #4f46e5;      /* 悬停色 */
  --secondary-color: #8b5cf6;    /* 辅助色 */
  /* ... 其他颜色 */
}
```

### 添加新风格

编辑 `index.html` 中的风格选择器：

```html
<select id="style" class="form-control">
  <option value="your-style">你的风格名称</option>
  <!-- 更多选项 -->
</select>
```

### 修改 API 默认地址

编辑 `js/app.js` 中的 `API_CONFIG`：

```javascript
const API_CONFIG = {
  baseURL: 'http://your-api-server.com/api',
  apiKey: ''
};
```

## 📝 使用说明

1. **配置 API**：首次使用先到设置页面配置 API 密钥
2. **创建视频**：在首页填写描述，选择风格和时长
3. **上传图片**（可选）：拖拽图片到上传区域
4. **等待生成**：提交后实时查看生成进度
5. **查看结果**：生成完成后自动跳转到详情页
6. **管理视频**：在视频库查看所有视频，可预览、下载、删除

## 💡 最佳实践

- **描述越详细越好**：包含场景、角色、动作、氛围等
- **合理使用参考图**：图生视频效果更准确
- **选择合适时长**：短时长生成更快，长时长更完整
- **耐心等待**：视频生成通常需要 1-3 分钟

## 🔒 安全说明

- API 密钥仅存储在本地浏览器（localStorage）
- 不会上传或分享你的 API 密钥
- 建议使用 HTTPS 连接后端 API
- 定期更换 API 密钥

## 📱 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- 移动端浏览器

## 📄 许可证

MIT License

---

**短视频生成平台** - 让视频创作更简单 ✨
