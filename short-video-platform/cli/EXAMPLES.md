# 命令演示

本文档展示所有命令的实际使用效果。

## 1. 查看帮助

```bash
$ short-video --help

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

## 2. 查看支持的提供商

```bash
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

提示：使用 short-video config 更改默认提供商
```

## 3. 配置 API（交互式）

```bash
$ short-video config

⚙️  API 配置向导

? API Key: [********]
? API Secret: [********]
? API 基础 URL: https://api.shortvideo.com
? 选择默认提供商： (Use arrow keys)
❯ 阿里云视频生成
  腾讯云智影
  百度智能云
  默认提供商

✅ 配置已保存

配置文件位置：/Users/username/Library/Preferences/short-video-cli/config.json
```

## 4. 生成视频

```bash
$ short-video generate "夕阳下的海滩，海浪轻拍沙滩"

🎬 开始生成视频...

提示词：夕阳下的海滩，海浪轻拍沙滩
提供商：default
时长：15 秒
分辨率：1080p
批量数量：1

⠋ 正在连接 API...
✔ 正在生成视频...
✔ 正在处理视频...
✔ 视频生成成功！

✅ 视频 ID: vid_1709712345678_xyz
   创建时间：2024/3/6 20:45:30
   文件大小：25MB

========================================
✓ 成功生成 1 个视频
========================================
```

## 5. 批量生成

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
⠋ 正在连接 API...
✔ 视频生成成功！

📹 生成第 3/4 个视频...
⠋ 正在连接 API...
✔ 视频生成成功！

📹 生成第 4/4 个视频...
⠋ 正在连接 API...
✔ 视频生成成功！

========================================
✓ 成功生成 4 个视频
========================================

生成的视频 ID 列表:
  - vid_1709712345678_abc
  - vid_1709712345679_def
  - vid_1709712345680_ghi
  - vid_1709712345681_jkl
```

## 6. 列出视频

```bash
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
2. vid_1709712345679_def
   提示词：四季风景
   状态：completed
   时长：20 秒 | 分辨率：1080p
   创建时间：2024/3/6 20:46:15
────────────────────────────────────────────────────────────────
3. vid_1709712345680_ghi
   提示词：四季风景
   状态：processing
   时长：20 秒 | 分辨率：1080p
   创建时间：2024/3/6 20:46:20
────────────────────────────────────────────────────────────────
```

## 7. 查看视频详情

```bash
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
```

## 8. 查看生成状态

```bash
$ short-video status vid_1709712345680_ghi

📊 生成状态

任务 ID: vid_1709712345680_ghi
提示词：四季风景

状态：🔄 处理中
进度：75%
[██████████████████████░░░░░░]
创建时间：2024/3/6 20:46:20
更新时间：2024/3/6 20:47:05

✓ 视频正在生成中，请稍候...
```

## 9. 下载视频

```bash
$ short-video download vid_1709712345678_abc

⬇️  下载视频

视频 ID: vid_1709712345678_abc
保存路径：./vid_1709712345678_abc.mp4
文件大小：25MB

⠋ 正在下载...
✔ 下载完成！

✅ 视频已保存到：./vid_1709712345678_abc.mp4
```

## 10. 删除视频

```bash
$ short-video delete vid_1709712345678_abc

🗑️  删除视频

? 确定要删除视频 "夕阳下的海滩，海浪轻拍沙滩..." 吗？ (y/N)
> Y

✅ 视频删除成功
```

## 11. 强制删除

```bash
$ short-video delete vid_1709712345678_abc --force

🗑️  删除视频

✅ 视频删除成功
```

## 12. 按状态筛选列表

```bash
$ short-video list --status completed

📋 视频列表

共 3 个视频，显示前 10 个

────────────────────────────────────────────────────────────────
1. vid_1709712345679_def
   提示词：四季风景
   状态：completed
   时长：20 秒 | 分辨率：1080p
   创建时间：2024/3/6 20:46:15
────────────────────────────────────────────────────────────────
```

## 13. 限制显示数量

```bash
$ short-video list --limit 3

📋 视频列表

共 10 个视频，显示前 3 个

────────────────────────────────────────────────────────────────
1. vid_1709712345678_abc
   提示词：夕阳下的海滩，海浪轻拍沙滩
   ...
────────────────────────────────────────────────────────────────
2. vid_1709712345679_def
   提示词：四季风景
   ...
────────────────────────────────────────────────────────────────
3. vid_1709712345680_ghi
   提示词：四季风景
   ...
────────────────────────────────────────────────────────────────
```

## 14. 自定义分辨率和时长

```bash
$ short-video generate "星空下的山脉" --duration 30 --resolution 4k

🎬 开始生成视频...

提示词：星空下的山脉
提供商：default
时长：30 秒
分辨率：4k
批量数量：1

⠋ 正在连接 API...
✔ 视频生成成功！

✅ 视频 ID: vid_1709712345682_mno
   创建时间：2024/3/6 21:00:00
   文件大小：85MB
```

## 15. 指定提供商

```bash
$ short-video generate "热带雨林" --provider tencent

🎬 开始生成视频...

提示词：热带雨林
提供商：tencent
时长：15 秒
分辨率：1080p
批量数量：1

⠋ 正在连接 API...
✔ 视频生成成功！

✅ 视频 ID: vid_1709712345683_pqr
```

## 16. 下载时指定路径

```bash
$ short-video download vid_1709712345678_abc --output ./videos/sunset.mp4

⬇️  下载视频

视频 ID: vid_1709712345678_abc
保存路径：./videos/sunset.mp4
文件大小：25MB

⠋ 正在下载...
✔ 下载完成！

✅ 视频已保存到：./videos/sunset.mp4
```

## 17. 错误处理 - 未找到视频

```bash
$ short-video show vid_invalid

📊 视频详情

❌ 错误：未找到视频 vid_invalid

提示：使用 short-video list 查看所有视频
```

## 18. 错误处理 - 未配置 API

```bash
$ short-video generate "测试"

🎬 开始生成视频...

❌ 错误：未配置 API 密钥
请先运行：short-video config
```

## 19. 使用简写命令

```bash
$ short-video g "提示词"        # generate
$ short-video ls               # list
$ short-video info <id>        # show
$ short-video dl <id>          # download
$ short-video rm <id>          # delete
$ short-video prov             # providers
```

---

所有命令都支持 `--help` 选项查看详细帮助：

```bash
$ short-video generate --help
$ short-video list --help
$ short-video download --help
# 等等...
```
