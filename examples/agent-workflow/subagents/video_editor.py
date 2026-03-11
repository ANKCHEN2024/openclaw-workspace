"""
视频编辑 Subagent

职责：将图像和音频合成为最终视频
"""

import os
import json
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

@dataclass
class VideoResult:
    """视频生成结果"""
    video_path: str
    duration: int
    resolution: str
    format: str
    status: str = "complete"

class VideoEditorSubagent:
    """视频编辑 Subagent"""
    
    def __init__(self, config=None):
        self.config = config
        self.output_dir = config.VIDEOS_DIR if config else "./outputs/videos"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run(
        self,
        images: List[str],
        audio_path: Optional[str] = None,
        topic: str = "demo",
        fps: int = 30,
        transition: str = "fade"
    ) -> VideoResult:
        """
        执行视频编辑任务
        
        Args:
            images: 图像路径列表
            audio_path: 配音音频路径
            topic: 主题名称
            fps: 帧率
            transition: 转场效果
        
        Returns:
            VideoResult: 视频结果
        """
        print(f"[VideoEditor] 开始合成视频：{topic}")
        print(f"[VideoEditor] 图像数量：{len(images)}")
        print(f"[VideoEditor] 音频：{audio_path or '无'}")
        
        # 1. 验证输入
        valid_images = [img for img in images if os.path.exists(img)]
        if not valid_images:
            raise ValueError("没有有效的图像文件")
        
        # 2. 计算时长
        total_duration = len(valid_images) * 5  # 每张图 5 秒
        
        # 3. 生成视频
        video_path = self._create_video(
            images=valid_images,
            audio_path=audio_path,
            topic=topic,
            fps=fps,
            transition=transition
        )
        
        # 4. 添加字幕（可选）
        # subtitle_path = self._add_subtitles(video_path, script)
        
        # 5. 汇总结果
        result = VideoResult(
            video_path=video_path,
            duration=total_duration,
            resolution="1920x1080",
            format="mp4",
            status="complete"
        )
        
        # 6. 保存元数据
        self._save_metadata(result, topic, images, audio_path)
        
        print(f"[VideoEditor] 完成！视频：{video_path}")
        
        return result
    
    def _create_video(
        self,
        images: List[str],
        audio_path: Optional[str],
        topic: str,
        fps: int,
        transition: str
    ) -> str:
        """创建视频"""
        # 实际实现会调用 ffmpeg 或 Sparki API
        # 这里创建占位文件
        
        video_filename = f"{topic}_final.mp4"
        video_path = os.path.join(self.output_dir, video_filename)
        
        # 创建占位文件
        Path(video_path).touch()
        
        # 模拟 ffmpeg 命令（实际使用时取消注释）
        # ffmpeg_command = self._build_ffmpeg_command(images, audio_path, fps, transition, video_path)
        # subprocess.run(ffmpeg_command, check=True)
        
        return video_path
    
    def _build_ffmpeg_command(
        self,
        images: List[str],
        audio_path: Optional[str],
        fps: int,
        transition: str,
        output_path: str
    ) -> List[str]:
        """构建 ffmpeg 命令"""
        # 图像序列输入
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-pattern_type", "glob",
            "-i", f"{images[0]}",  # 实际需要用通配符
        ]
        
        # 音频输入
        if audio_path and os.path.exists(audio_path):
            cmd.extend(["-i", audio_path])
        
        # 转场效果
        if transition == "fade":
            cmd.extend(["-vf", "fade=in:0:30"])
        
        # 输出
        cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            output_path
        ])
        
        return cmd
    
    def _add_subtitles(self, video_path: str, script: str) -> str:
        """添加字幕"""
        # 实际实现会调用 ffmpeg 字幕滤镜
        # 或使用 Sparki 的 AI Caption 功能
        return video_path
    
    def _save_metadata(
        self,
        result: VideoResult,
        topic: str,
        images: List[str],
        audio_path: Optional[str]
    ):
        """保存元数据"""
        metadata_path = os.path.join(self.output_dir, f"{topic}_video.json")
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                "topic": topic,
                "video_path": result.video_path,
                "duration": result.duration,
                "resolution": result.resolution,
                "format": result.format,
                "source_images": images,
                "audio_path": audio_path,
                "status": result.status
            }, f, ensure_ascii=False, indent=2)
        
        print(f"[VideoEditor] 元数据已保存：{metadata_path}")


# 命令行入口
if __name__ == "__main__":
    import argparse
    from config import config
    
    parser = argparse.ArgumentParser(description="视频编辑 Subagent")
    parser.add_argument("--topic", default="demo", help="主题名称")
    parser.add_argument("--images", nargs='*', help="图像路径列表")
    parser.add_argument("--audio", help="音频路径")
    
    args = parser.parse_args()
    
    agent = VideoEditorSubagent(config)
    
    try:
        result = agent.run(
            images=args.images or [],
            audio_path=args.audio,
            topic=args.topic
        )
        
        print(f"\n✅ 视频合成完成！")
        print(f"   路径：{result.video_path}")
        print(f"   时长：{result.duration}秒")
        print(f"   分辨率：{result.resolution}")
    except Exception as e:
        print(f"\n❌ 视频合成失败：{e}")
