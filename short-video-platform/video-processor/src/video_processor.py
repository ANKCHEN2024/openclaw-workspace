#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频处理模块 - 核心功能
支持视频格式转换、剪辑、压缩、添加水印等
"""

import subprocess
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any

class VideoProcessor:
    """视频处理器类"""
    
    def __init__(self, output_dir: str = "./output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def check_ffmpeg(self) -> bool:
        """检查 ffmpeg 是否可用"""
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    def convert_format(self, input_file: str, output_format: str = 'mp4') -> str:
        """转换视频格式"""
        input_path = Path(input_file)
        output_file = self.output_dir / f"{input_path.stem}.{output_format}"
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-y',  # 覆盖输出文件
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_file)
    
    def resize_video(self, input_file: str, width: int, height: int) -> str:
        """调整视频分辨率"""
        input_path = Path(input_file)
        output_file = self.output_dir / f"{input_path.stem}_{width}x{height}.mp4"
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-vf', f'scale={width}:{height}',
            '-c:a', 'copy',
            '-y',
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_file)
    
    def trim_video(self, input_file: str, start: float, duration: float) -> str:
        """裁剪视频片段"""
        input_path = Path(input_file)
        output_file = self.output_dir / f"{input_path.stem}_trimmed.mp4"
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-ss', str(start),
            '-t', str(duration),
            '-c', 'copy',
            '-y',
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_file)
    
    def compress_video(self, input_file: str, quality: int = 23) -> str:
        """压缩视频（降低文件大小）"""
        input_path = Path(input_file)
        output_file = self.output_dir / f"{input_path.stem}_compressed.mp4"
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-c:v', 'libx264',
            '-crf', str(quality),  # 18-28，越小质量越高
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_file)
    
    def add_watermark(self, input_file: str, watermark_file: str, position: str = 'bottom-right') -> str:
        """添加水印"""
        input_path = Path(input_file)
        output_file = self.output_dir / f"{input_path.stem}_watermarked.mp4"
        
        # 水印位置映射
        positions = {
            'top-left': '10:10',
            'top-right': 'main_w-overlay_w-10:10',
            'bottom-left': '10:main_h-overlay_h-10',
            'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10'
        }
        
        pos = positions.get(position, positions['bottom-right'])
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-i', str(watermark_file),
            '-filter_complex', f'overlay={pos}',
            '-c:a', 'copy',
            '-y',
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_file)
    
    def extract_frames(self, input_file: str, output_dir: str, interval: int = 1) -> list:
        """提取视频帧为图片"""
        input_path = Path(input_file)
        frames_dir = Path(output_dir)
        frames_dir.mkdir(parents=True, exist_ok=True)
        
        output_pattern = frames_dir / f"{input_path.stem}_%04d.jpg"
        
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-vf', f'fps=1/{interval}',
            '-q:v', '2',
            str(output_pattern)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # 返回生成的文件列表
        frames = sorted(frames_dir.glob("*.jpg"))
        return [str(f) for f in frames]
    
    def merge_videos(self, video_files: list, output_file: Optional[str] = None) -> str:
        """合并多个视频"""
        if not output_file:
            output_file = self.output_dir / "merged_video.mp4"
        else:
            output_file = Path(output_file)
        
        # 创建临时文件列表
        list_file = self.output_dir / "merge_list.txt"
        with open(list_file, 'w', encoding='utf-8') as f:
            for video in video_files:
                f.write(f"file '{video}'\n")
        
        cmd = [
            'ffmpeg', '-f', 'concat',
            '-safe', '0',
            '-i', str(list_file),
            '-c', 'copy',
            '-y',
            str(output_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # 清理临时文件
        list_file.unlink()
        
        return str(output_file)
    
    def get_video_info(self, input_file: str) -> Dict[str, Any]:
        """获取视频信息"""
        cmd = [
            'ffprobe', '-v', 'quiet',
            '-print_format', 'json',
            '-show_format', '-show_streams',
            str(input_file)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        info = json.loads(result.stdout)
        
        return {
            'duration': float(info['format'].get('duration', 0)),
            'size': int(info['format'].get('size', 0)),
            'format': info['format'].get('format_name', ''),
            'width': int(info['streams'][0].get('width', 0)) if info.get('streams') else 0,
            'height': int(info['streams'][0].get('height', 0)) if info.get('streams') else 0,
            'fps': eval(info['streams'][0].get('r_frame_rate', '0/1')) if info.get('streams') else 0
        }


# 快速测试
if __name__ == '__main__':
    processor = VideoProcessor()
    
    if processor.check_ffmpeg():
        print("✅ FFmpeg 可用")
    else:
        print("❌ FFmpeg 不可用，请先安装")
        print("安装命令：brew install ffmpeg")
