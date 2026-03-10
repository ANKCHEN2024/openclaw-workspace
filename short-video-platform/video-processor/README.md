# 🎬 视频处理模块

基于 FFmpeg 的视频处理工具，支持格式转换、剪辑、压缩、水印等功能。

## 📦 安装

```bash
# 安装系统依赖
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu

# Python 依赖（可选）
pip3 install -r requirements.txt
```

## 🚀 快速使用

```python
from src.video_processor import VideoProcessor

# 创建处理器
processor = VideoProcessor(output_dir="./output")

# 检查 FFmpeg
if processor.check_ffmpeg():
    print("FFmpeg 可用")

# 转换格式
processor.convert_format("input.avi", "mp4")

# 调整分辨率
processor.resize_video("input.mp4", 1920, 1080)

# 裁剪视频（从第 10 秒开始，截取 30 秒）
processor.trim_video("input.mp4", 10, 30)

# 压缩视频
processor.compress_video("input.mp4", quality=23)

# 添加水印
processor.add_watermark("input.mp4", "logo.png", "bottom-right")

# 提取帧（每 1 秒提取一帧）
frames = processor.extract_frames("input.mp4", "./frames", interval=1)

# 合并视频
processor.merge_videos(["video1.mp4", "video2.mp4"])

# 获取视频信息
info = processor.get_video_info("input.mp4")
print(f"时长：{info['duration']}秒")
print(f"分辨率：{info['width']}x{info['height']}")
```

## 📋 API 参考

### `VideoProcessor(output_dir)`

初始化视频处理器

**参数:**
- `output_dir`: 输出目录路径

### `check_ffmpeg() -> bool`

检查 FFmpeg 是否可用

### `convert_format(input_file, output_format='mp4') -> str`

转换视频格式

**参数:**
- `input_file`: 输入文件路径
- `output_format`: 输出格式 (mp4, avi, mov, webm 等)

**返回:** 输出文件路径

### `resize_video(input_file, width, height) -> str`

调整视频分辨率

**参数:**
- `input_file`: 输入文件路径
- `width`: 目标宽度
- `height`: 目标高度

**返回:** 输出文件路径

### `trim_video(input_file, start, duration) -> str`

裁剪视频片段

**参数:**
- `input_file`: 输入文件路径
- `start`: 开始时间（秒）
- `duration`: 持续时间（秒）

**返回:** 输出文件路径

### `compress_video(input_file, quality=23) -> str`

压缩视频

**参数:**
- `input_file`: 输入文件路径
- `quality`: 质量参数 (18-28，越小质量越高)

**返回:** 输出文件路径

### `add_watermark(input_file, watermark_file, position='bottom-right') -> str`

添加水印

**参数:**
- `input_file`: 输入文件路径
- `watermark_file`: 水印图片路径
- `position`: 位置 (top-left, top-right, bottom-left, bottom-right)

**返回:** 输出文件路径

### `extract_frames(input_file, output_dir, interval=1) -> list`

提取视频帧

**参数:**
- `input_file`: 输入文件路径
- `output_dir`: 输出目录
- `interval`: 提取间隔（秒）

**返回:** 图片文件路径列表

### `merge_videos(video_files, output_file=None) -> str`

合并多个视频

**参数:**
- `video_files`: 输入文件路径列表
- `output_file`: 输出文件路径（可选）

**返回:** 输出文件路径

### `get_video_info(input_file) -> dict`

获取视频信息

**参数:**
- `input_file`: 输入文件路径

**返回:** 包含 duration, size, format, width, height, fps 的字典

---

## 💡 使用示例

### 批量压缩视频

```python
import os
from src.video_processor import VideoProcessor

processor = VideoProcessor()

for filename in os.listdir("./raw_videos"):
    if filename.endswith(".mp4"):
        input_path = f"./raw_videos/{filename}"
        output_path = processor.compress_video(input_path, quality=25)
        print(f"已压缩：{output_path}")
```

### 创建视频预览

```python
processor = VideoProcessor()

# 提取前 5 秒作为预览
preview = processor.trim_video("full_video.mp4", 0, 5)

# 压缩预览
preview = processor.compress_video(preview, quality=28)

print(f"预览视频：{preview}")
```

### 添加片头片尾

```python
processor = VideoProcessor()

# 合并片头 + 主视频 + 片尾
merged = processor.merge_videos([
    "intro.mp4",
    "main_video.mp4",
    "outro.mp4"
])

print(f"完整视频：{merged}")
```

---

## 📝 注意事项

1. **FFmpeg 必须安装**: 本模块依赖系统 FFmpeg
2. **输出目录**: 所有输出文件默认保存到 `./output` 目录
3. **大文件处理**: 处理大文件时确保有足够磁盘空间
4. **格式兼容性**: 某些格式可能需要额外的编解码器

---

## 🛠️ 故障排除

### FFmpeg 不可用

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# 验证安装
ffmpeg -version
```

### 内存不足

处理大文件时，降低质量参数或分批次处理。

### 格式不支持

尝试转换为标准 MP4 格式：

```python
processor.convert_format("input.xxx", "mp4")
```

---

## 📖 参考资源

- [FFmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [FFmpeg 常见用法](https://ffmpeg.org/ffmpeg-all.html)
