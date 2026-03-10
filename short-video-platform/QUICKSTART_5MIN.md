# 🚀 快速开始 - 5 分钟上手

## 第一步：启动平台

```bash
cd /Users/chenggl/workspace/short-video-platform
./start.sh
```

启动后：
- **后端 API**: http://localhost:3000
- **Web 界面**: http://localhost:8080

---

## 第二步：配置 API 密钥（3 分钟）

### 方式一：Web 界面（推荐新手）

1. 打开浏览器访问 http://localhost:8080
2. 点击「设置」页面
3. 选择一个 API 提供商（推荐 **火山引擎 - 即梦 AI**）
4. 点击对应的卡片
5. 输入 API 密钥
6. 点击保存

### 方式二：CLI 配置

```bash
# 进入 CLI 目录
cd cli

# 安装（首次使用）
npm install

# 全局安装
npm link

# 启动配置向导
short-video config
```

---

## 第三步：获取 API 密钥

### 推荐：火山引擎 - 即梦 AI ⭐

1. 访问：https://console.volcengine.com/
2. 注册/登录账号
3. 搜索「即梦 AI」
4. 进入 API 密钥管理
5. 创建 API 密钥并复制

**其他提供商**:
- 阿里云：https://dashscope.console.aliyun.com/
- 腾讯云：https://console.cloud.tencent.com/
- 快手可灵：https://klingai.kuaishou.com/

---

## 第四步：生成第一个视频！🎉

### Web 界面

1. 访问 http://localhost:8080
2. 在首页输入提示词，例如：
   ```
   一只柯基在足球场上奔跑，阳光明媚，4K 高清
   ```
3. 选择风格（可选）
4. 选择时长（5-10 秒）
5. 点击「生成视频」
6. 等待 1-2 分钟
7. 在「视频库」查看生成的视频

### CLI 命令行

```bash
# 生成视频
short-video generate "一只柯基在足球场上奔跑，阳光明媚"

# 指定提供商
short-video generate "一只柯基在足球场上奔跑" --provider volcengine

# 指定时长
short-video generate "一只柯基在足球场上奔跑" --duration 10

# 查看进度
short-video list

# 下载视频
short-video download <视频 ID>
```

---

## 📊 免费额度对比

| 提供商 | 免费额度 | 推荐指数 |
|--------|----------|----------|
| 火山引擎 | 200 秒 | ⭐⭐⭐⭐⭐ |
| 阿里云 | 100 秒 | ⭐⭐⭐⭐⭐ |
| 快手可灵 | 100 秒 | ⭐⭐⭐⭐ |
| 腾讯云 | 50 秒 | ⭐⭐⭐ |

**建议**: 新手先用火山引擎或阿里云，免费额度多，质量好！

---

## 🎯 提示词技巧

### 基础格式
```
[主体] + [动作] + [场景] + [风格/质量]
```

### 示例
```
✅ 一只柯基在足球场上奔跑，阳光明媚，4K 高清
✅ 海浪拍打礁石，夕阳西下，电影质感
✅ 樱花飘落，日本庭院，唯美风格
✅ 城市夜景，车水马龙，赛博朋克风格
```

### 进阶技巧
- 添加细节描述：「金色毛发」「蓝天白云」
- 指定镜头：「特写镜头」「广角镜头」
- 指定光影：「逆光」「柔光」「霓虹灯」
- 指定风格：「电影感」「动画风格」「写实风格」

---

## ❓ 常见问题

### Q: 生成失败怎么办？
A: 
1. 检查 API 密钥是否正确
2. 确认后端服务已启动
3. 查看错误提示信息
4. 尝试切换其他提供商

### Q: 生成需要多长时间？
A: 通常 1-3 分钟，取决于：
- 视频时长
- 提供商负载
- 网络状况

### Q: 如何批量生成？
A: 使用 CLI 的 `--batch` 参数：
```bash
short-video generate "四季风景" --batch 4
```

### Q: 视频在哪里？
A: 
- Web 界面：视频库页面
- CLI: `short-video list` 查看
- 本地：`backend/data/videos/` 目录

---

## 🎬 下一步

- 📖 阅读 [国内 API 配置指南](docs/DOMESTIC_API_GUIDE.md)
- 🛠️ 学习 [视频处理功能](video-processor/README.md)
- 💻 探索 [CLI 高级用法](cli/QUICKSTART.md)
- 🎨 查看 [提示词模板](docs/PROMPT_TEMPLATES.md)

---

祝你创作愉快！🎉
