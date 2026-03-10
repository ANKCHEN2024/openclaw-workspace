# 快速使用指南

## 🚀 5 分钟快速上手

### 步骤 1: 安装依赖

```bash
cd /Users/chenggl/workspace/short-video-platform/cli
npm install
```

### 步骤 2: 全局安装（可选）

```bash
npm link
```

安装后，可以在任何目录使用 `short-video` 命令。

### 步骤 3: 配置 API

```bash
short-video config
```

按提示输入：
- API Key
- API Secret  
- API 基础 URL
- 选择默认提供商

### 步骤 4: 生成第一个视频

```bash
short-video generate "一只可爱的小猫在草地上玩耍"
```

### 步骤 5: 查看生成的视频

```bash
short-video list
```

### 步骤 6: 下载视频

```bash
short-video download <视频 ID>
```

---

## 📝 常用命令速查

### 生成视频

```bash
# 基本生成
short-video generate "提示词"

# 指定参数
short-video generate "提示词" --duration 30 --resolution 4k

# 批量生成
short-video generate "提示词" --batch 5

# 指定提供商
short-video generate "提示词" --provider aliyun
```

### 查看视频

```bash
# 列出所有
short-video list

# 筛选状态
short-video list --status completed

# 查看详情
short-video show <视频 ID>
```

### 下载/删除

```bash
# 下载
short-video download <视频 ID>

# 指定路径下载
short-video download <视频 ID> --output ./videos/

# 删除（会确认）
short-video delete <视频 ID>

# 强制删除
short-video delete <视频 ID> --force
```

### 配置

```bash
# 配置 API
short-video config

# 查看提供商
short-video providers

# 查看状态
short-video status <任务 ID>
```

---

## 💡 实用技巧

### 1. 使用简写

```bash
short-video g "提示词"      # generate
short-video ls             # list
short-video info <id>      # show
short-video dl <id>        # download
short-video rm <id>        # delete
short-video prov           # providers
```

### 2. 批量操作

```bash
# 一次生成 10 个视频
short-video generate "创意提示" --batch 10

# 只查看最近的 3 个视频
short-video list --limit 3
```

### 3. 管道和脚本

可以在脚本中使用 CLI：

```bash
#!/bin/bash

# 生成多个不同主题的视频
themes=("春天" "夏天" "秋天" "冬天")

for theme in "${themes[@]}"; do
  short-video generate "$theme 的美丽风景" --duration 20
done

# 列出所有生成的视频
short-video list --limit 10
```

---

## ❓ 常见问题

### Q: 提示"未配置 API 密钥"
A: 运行 `short-video config` 配置 API 密钥

### Q: 如何更改默认提供商？
A: 运行 `short-video config` 重新选择提供商

### Q: 视频保存在哪里？
A: 视频数据保存在 `data/videos.json`，下载的视频保存在指定路径

### Q: 如何查看配置文件位置？
A: 运行 `short-video config` 后会显示配置文件路径

### Q: 支持哪些视频分辨率？
A: 常用分辨率：720p, 1080p, 2k, 4k

### Q: 视频时长有限制吗？
A: 通常支持 5-60 秒，具体取决于提供商

---

## 🎯 完整工作流示例

```bash
# 1. 配置（首次使用）
short-video config

# 2. 生成视频
short-video generate "晨曦中的山峰，云雾缭绕" --duration 30 --resolution 4k

# 3. 查看生成的视频
short-video list

# 4. 查看视频详情
short-video show vid_xxxxx

# 5. 下载视频
short-video download vid_xxxxx --output ./my-videos/

# 6. 如果需要，删除不满意的视频
short-video delete vid_xxxxx
```

---

## 🔗 更多帮助

```bash
# 查看完整帮助
short-video --help

# 查看具体命令帮助
short-video generate --help
short-video list --help
```
