# 短视频生成平台 CLI 工具

一个功能丰富的命令行工具，用于生成、管理和下载 AI 短视频。

## ✨ 功能特性

- 🎬 **视频生成** - 根据文本提示自动生成视频
- 📋 **视频管理** - 列出、查看、下载和删除视频
- ⚙️ **配置管理** - 交互式 API 配置向导
- 🌐 **多提供商支持** - 支持阿里云、腾讯云、百度智能云等
- 🎨 **彩色输出** - 美观的终端界面
- 📊 **进度显示** - 实时显示生成进度
- 🔄 **批量生成** - 支持一次生成多个视频

## 🚀 快速开始

### 安装

```bash
# 进入项目目录
cd /Users/chenggl/workspace/short-video-platform/cli

# 安装依赖
npm install

# 全局安装（可选）
npm link
```

### 配置

首次使用前，需要配置 API 密钥：

```bash
short-video config
```

按照提示输入：
- API Key
- API Secret
- API 基础 URL
- 选择默认提供商

## 📖 命令说明

### 1. generate - 生成视频

根据文本提示生成视频。

```bash
# 基本用法
short-video generate "一只可爱的小猫在草地上玩耍"

# 简写
short-video g "提示词"

# 指定提供商
short-video generate "提示词" --provider aliyun

# 设置视频时长和分辨率
short-video generate "提示词" --duration 30 --resolution 4k

# 批量生成
short-video generate "提示词" --batch 5
```

**选项：**
- `-p, --provider <provider>` - 指定视频生成提供商
- `-d, --duration <seconds>` - 视频时长（秒），默认 15
- `-r, --resolution <resolution>` - 视频分辨率，默认 1080p
- `-b, --batch <count>` - 批量生成数量，默认 1

### 2. list - 列出所有视频

```bash
# 列出所有视频
short-video list

# 简写
short-video ls

# 按状态筛选
short-video list --status completed

# 限制显示数量
short-video list --limit 5
```

**选项：**
- `-s, --status <status>` - 按状态筛选（pending/processing/completed/failed）
- `-l, --limit <number>` - 限制显示数量，默认 10

### 3. show - 显示视频详情

```bash
# 显示视频详情
short-video show vid_1234567890_abc

# 简写
short-video info vid_1234567890_abc
```

### 4. download - 下载视频

```bash
# 下载视频到当前目录
short-video download vid_1234567890_abc

# 简写
short-video dl vid_1234567890_abc

# 指定保存路径
short-video download vid_1234567890_abc --output ./videos/my-video.mp4
```

**选项：**
- `-o, --output <path>` - 保存路径

### 5. delete - 删除视频

```bash
# 删除视频（会提示确认）
short-video delete vid_1234567890_abc

# 简写
short-video rm vid_1234567890_abc

# 强制删除（不确认）
short-video delete vid_1234567890_abc --force
```

**选项：**
- `-f, --force` - 强制删除，不确认

### 6. config - 配置 API 密钥

```bash
# 启动交互式配置向导
short-video config
```

### 7. providers - 列出支持的提供商

```bash
# 列出所有支持的提供商
short-video providers

# 简写
short-video prov
```

### 8. status - 查看生成状态

```bash
# 查看任务状态
short-video status vid_1234567890_abc
```

## 💡 使用示例

### 示例 1: 生成单个视频

```bash
$ short-video generate "夕阳下的海滩，海浪轻拍沙滩"

🎬 开始生成视频...

提示词：夕阳下的海滩，海浪轻拍沙滩
提供商：default
时长：15 秒
分辨率：1080p
批量数量：1

⠋ 正在连接 API...
✔ 视频生成成功！

✅ 视频 ID: vid_1709712345678_xyz
   创建时间：2024/3/6 20:45:30
   文件大小：25MB

========================================
✓ 成功生成 1 个视频
========================================
```

### 示例 2: 批量生成视频

```bash
$ short-video generate "四季风景" --batch 4 --duration 20

🎬 开始生成视频...

提示词：四季风景
提供商：aliyun
时长：20 秒
分辨率：1080p
批量数量：4

📹 生成第 1/4 个视频...
⠋ 正在连接 API...
✔ 视频生成成功！

📹 生成第 2/4 个视频...
...

生成的视频 ID 列表:
  - vid_1709712345678_abc
  - vid_1709712345679_def
  - vid_1709712345680_ghi
  - vid_1709712345681_jkl
```

### 示例 3: 查看和管理视频

```bash
# 列出所有视频
$ short-video list

📋 视频列表

共 5 个视频，显示前 10 个

────────────────────────────────────────────────────────────────
1. vid_1709712345678_abc
   提示词：夕阳下的海滩，海浪轻拍沙滩
   状态：completed
   时长：15 秒 | 分辨率：1080p
   创建时间：2024/3/6 20:45:30
────────────────────────────────────────────────────────────────

# 查看视频详情
$ short-video show vid_1709712345678_abc

📊 视频详情

────────────────────────────────────────────────────────────
视频 ID: vid_1709712345678_abc
────────────────────────────────────────────────────────────
提示词：夕阳下的海滩，海浪轻拍沙滩
状态：completed
提供商：default
时长：15 秒
分辨率：1080p
文件大小：25MB
创建时间：2024/3/6 20:45:30
更新时间：2024/3/6 20:46:15
下载链接：https://cdn.shortvideo.com/videos/vid_...
缩略图：https://cdn.shortvideo.com/thumbnails/vid_...
────────────────────────────────────────────────────────────

# 下载视频
$ short-video download vid_1709712345678_abc

⬇️  下载视频

视频 ID: vid_1709712345678_abc
保存路径：./vid_1709712345678_abc.mp4
文件大小：25MB

⠋ 正在下载...
✔ 下载完成！

✅ 视频已保存到：./vid_1709712345678_abc.mp4
```

### 示例 4: 配置和提供商

```bash
# 配置 API
$ short-video config

⚙️  API 配置向导

? API Key: [********]
? API Secret: [********]
? API 基础 URL: https://api.shortvideo.com
? 选择默认提供商：阿里云视频生成

✅ 配置已保存

配置文件位置：/Users/.../config.json

# 查看支持的提供商
$ short-video providers

🌐 支持的提供商

✓ 阿里云视频生成
   ID: aliyun
   端点：https://video.aliyuncs.com
   ← 当前使用

○ 腾讯云智影
   ID: tencent
   端点：https://api.tencentcloud.com

○ 百度智能云
   ID: baidu
   端点：https://cloud.baidu.com

○ 默认提供商
   ID: default
   端点：https://api.shortvideo.com
```

## 🎨 界面预览

### 帮助信息
```
========================================
     短视频生成平台 CLI 工具
========================================

用法:
  short-video <command> [options]

可用命令:
  generate <prompt>   根据提示生成视频
  list                列出所有视频
  show <id>           显示视频详情
  download <id>       下载视频
  delete <id>         删除视频
  config              配置 API 密钥
  providers           列出支持的提供商
  status <task-id>    查看生成状态

示例:
  short-video generate "一只可爱的小猫在草地上玩耍"
  short-video list
  short-video show vid_1234567890_abc
  short-video download vid_1234567890_abc
  short-video config
  short-video providers
```

## 📁 项目结构

```
cli/
├── bin/
│   └── cli.js          # 主 CLI 程序
├── data/
│   └── videos.json     # 视频数据（自动生成）
├── package.json        # 项目配置
└── README.md          # 说明文档
```

## 🔧 开发

### 本地测试

```bash
# 不全局安装的情况下测试
node bin/cli.js --help

# 或者使用 npm script
npm start -- --help
```

### 全局安装

```bash
# 创建全局链接
npm link

# 现在可以在任何地方使用
short-video --help
```

### 卸载

```bash
npm unlink -g
```

## 📝 注意事项

1. **首次使用**：必须先运行 `short-video config` 配置 API 密钥
2. **视频存储**：视频数据保存在 `data/videos.json` 文件中
3. **配置文件**：用户配置保存在系统配置目录（由 `conf` 库管理）
4. **API 集成**：当前为模拟实现，实际使用需要接入真实的视频生成 API

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC
