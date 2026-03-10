#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频帧提取模块
支持提取视频帧为图片
"""

import os
import re
from typing import Optional, List, Dict, Any
from pathlib import Path
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class FrameExtractor:
    """视频帧提取器"""
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化视频帧提取器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def extract_frame(
        self,
        input_path: str,
        output_path: str,
        timestamp: float = 0.0,
        overwrite: bool = True
    ) -> str:
        """
        提取指定时间点的帧
        
        Args:
            input_path: 输入视频路径
            output_path: 输出图片路径
            timestamp: 时间点（秒）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-ss', str(timestamp)])
        args.extend(['-i', input_path])
        args.extend(['-vframes', '1'])
        args.extend(['-q:v', '2'])  # 高质量
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def extract_frames(
        self,
        input_path: str,
        output_dir: str,
        interval: float = 1.0,
        start_time: float = 0.0,
        end_time: Optional[float] = None,
        output_format: str = 'jpg',
        output_prefix: str = 'frame',
        width: Optional[int] = None,
        height: Optional[int] = None,
        overwrite: bool = True
    ) -> List[str]:
        """
        按时间间隔提取多帧
        
        Args:
            input_path: 输入视频路径
            output_dir: 输出目录
            interval: 提取间隔（秒）
            start_time: 开始时间（秒）
            end_time: 结束时间（秒），None 表示到视频末尾
            output_format: 输出图片格式（jpg, png）
            output_prefix: 输出文件前缀
            width: 输出宽度（可选）
            height: 输出高度（可选）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径列表
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 获取视频时长
        duration = self.ffmpeg.get_duration(input_path)
        if end_time is None:
            end_time = duration
        end_time = min(end_time, duration)
        
        # 构建输出文件名模式
        output_pattern = os.path.join(
            output_dir,
            f"{output_prefix}_%04d.{output_format}"
        )
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-ss', str(start_time)])
        args.extend(['-to', str(end_time)])
        args.extend(['-i', input_path])
        
        # 设置帧率（1/interval）
        fps = 1.0 / interval
        args.extend(['-vf', f'fps={fps}'])
        
        # 分辨率调整
        if width or height:
            scale = f'scale={width or -1}:{height or -1}'
            args.extend(['-vf', f'{args.pop()}, {scale}'])
        
        args.extend(['-q:v', '2'])
        args.append(output_pattern)
        
        self.ffmpeg.run_command(args)
        
        # 获取生成的文件列表
        output_files = []
        pattern = re.compile(rf"{re.escape(output_prefix)}_\d+\.{output_format}")
        for filename in sorted(os.listdir(output_dir)):
            if pattern.match(filename):
                output_files.append(os.path.join(output_dir, filename))
        
        return output_files
    
    def extract_all_frames(
        self,
        input_path: str,
        output_dir: str,
        output_format: str = 'jpg',
        output_prefix: str = 'frame',
        overwrite: bool = True
    ) -> List[str]:
        """
        提取所有帧
        
        Args:
            input_path: 输入视频路径
            output_dir: 输出目录
            output_format: 输出图片格式
            output_prefix: 输出文件前缀
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径列表
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        output_pattern = os.path.join(
            output_dir,
            f"{output_prefix}_%04d.{output_format}"
        )
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-q:v', '2'])
        args.append(output_pattern)
        
        self.ffmpeg.run_command(args)
        
        # 获取生成的文件列表
        output_files = []
        pattern = re.compile(rf"{re.escape(output_prefix)}_\d+\.{output_format}")
        for filename in sorted(os.listdir(output_dir)):
            if pattern.match(filename):
                output_files.append(os.path.join(output_dir, filename))
        
        return output_files
    
    def extract_keyframes(
        self,
        input_path: str,
        output_dir: str,
        output_format: str = 'jpg',
        output_prefix: str = 'keyframe',
        overwrite: bool = True
    ) -> List[str]:
        """
        提取关键帧（I 帧）
        
        Args:
            input_path: 输入视频路径
            output_dir: 输出目录
            output_format: 输出图片格式
            output_prefix: 输出文件前缀
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径列表
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        output_pattern = os.path.join(
            output_dir,
            f"{output_prefix}_%04d.{output_format}"
        )
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-vf', 'select=eq(pict_type\,I)'])
        args.extend(['-vsync', 'vfr'])
        args.extend(['-q:v', '2'])
        args.append(output_pattern)
        
        self.ffmpeg.run_command(args)
        
        # 获取生成的文件列表
        output_files = []
        pattern = re.compile(rf"{re.escape(output_prefix)}_\d+\.{output_format}")
        for filename in sorted(os.listdir(output_dir)):
            if pattern.match(filename):
                output_files.append(os.path.join(output_dir, filename))
        
        return output_files
    
    def create_thumbnail(
        self,
        input_path: str,
        output_path: str,
        size: tuple = (320, 180),
        timestamp: Optional[str] = None,
        overwrite: bool = True
    ) -> str:
        """
        创建视频缩略图
        
        Args:
            input_path: 输入视频路径
            output_path: 输出图片路径
            size: 缩略图尺寸 (宽，高)
            timestamp: 时间点（如 '00:00:01' 或 '25%' 表示 25% 位置）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        args = ['-y'] if overwrite else ['-n']
        
        # 处理时间点
        if timestamp:
            if '%' in timestamp:
                # 百分比位置
                percent = float(timestamp.replace('%', '')) / 100
                duration = self.ffmpeg.get_duration(input_path)
                args.extend(['-ss', str(duration * percent)])
            else:
                # 直接时间
                args.extend(['-ss', timestamp])
        else:
            # 默认在 10% 位置
            duration = self.ffmpeg.get_duration(input_path)
            args.extend(['-ss', str(duration * 0.1)])
        
        args.extend(['-i', input_path])
        args.extend(['-vframes', '1'])
        args.extend(['-vf', f'scale={size[0]}:{size[1]}'])
        args.extend(['-q:v', '2'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def extract_to_contact_sheet(
        self,
        input_path: str,
        output_path: str,
        cols: int = 4,
        rows: int = 4,
        overwrite: bool = True
    ) -> str:
        """
        创建视频联系表（多帧拼贴）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出图片路径
            cols: 列数
            rows: 行数
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        total_frames = cols * rows
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        
        # 使用 tile 滤镜创建联系表
        filter_str = f"fps=1/10,scale=320:-1,tile={cols}x{rows}"
        args.extend(['-vf', filter_str])
        args.extend(['-frames:v', '1'])
        args.extend(['-q:v', '2'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path


# 使用示例
if __name__ == '__main__':
    extractor = FrameExtractor()
    
    # 提取单帧
    try:
        output = extractor.extract_frame('video.mp4', 'thumbnail.jpg', timestamp=5.0)
        print(f"帧提取完成：{output}")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 按间隔提取多帧
    # frames = extractor.extract_frames('video.mp4', './frames', interval=2.0)
    
    # 创建缩略图
    # extractor.create_thumbnail('video.mp4', 'thumb.jpg', size=(320, 180))
    
    # 创建联系表
    # extractor.extract_to_contact_sheet('video.mp4', 'contact.jpg', cols=4, rows=4)
