#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频编辑模块
支持视频裁剪、剪辑、合并等操作
"""

import os
from typing import Optional, List, Tuple
from pathlib import Path
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class VideoEditor:
    """视频编辑器"""
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化视频编辑器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def crop(
        self,
        input_path: str,
        output_path: str,
        x: int,
        y: int,
        width: int,
        height: int,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        overwrite: bool = True
    ) -> str:
        """
        裁剪视频（裁剪画面区域）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            x: 裁剪区域左上角 X 坐标
            y: 裁剪区域左上角 Y 坐标
            width: 裁剪区域宽度
            height: 裁剪区域高度
            start_time: 开始时间（秒）
            end_time: 结束时间（秒）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        args = ['-y'] if overwrite else ['-n']
        
        # 时间裁剪参数
        if start_time is not None:
            args.extend(['-ss', str(start_time)])
        if end_time is not None and start_time is not None:
            args.extend(['-t', str(end_time - start_time)])
        elif end_time is not None:
            args.extend(['-to', str(end_time)])
        
        args.extend(['-i', input_path])
        
        # 画面裁剪滤镜
        args.extend(['-vf', f'crop={width}:{height}:{x}:{y}'])
        
        # 保持原始编码
        args.extend(['-c:v', 'libx264', '-c:a', 'aac'])
        
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def trim(
        self,
        input_path: str,
        output_path: str,
        start_time: float,
        end_time: Optional[float] = None,
        duration: Optional[float] = None,
        overwrite: bool = True
    ) -> str:
        """
        裁剪视频（时间裁剪）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            start_time: 开始时间（秒）
            end_time: 结束时间（秒），与 duration 二选一
            duration: 持续时间（秒），与 end_time 二选一
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        if end_time is None and duration is None:
            raise FFmpegError("必须指定 end_time 或 duration")
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-ss', str(start_time)])
        
        if duration is not None:
            args.extend(['-t', str(duration)])
        elif end_time is not None:
            args.extend(['-to', str(end_time)])
        
        args.extend(['-i', input_path])
        args.extend(['-c', 'copy'])  # 流复制，速度快
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def cut(
        self,
        input_path: str,
        output_path: str,
        segments: List[Tuple[float, float]],
        overwrite: bool = True
    ) -> str:
        """
        剪辑视频（提取多个片段并合并）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            segments: 片段列表，每个元素为 (开始时间，结束时间) 元组
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not segments:
            raise FFmpegError("必须至少指定一个片段")
        
        # 为每个片段创建临时文件
        temp_files = []
        for i, (start, end) in enumerate(segments):
            temp_path = f"{output_path}.temp{i}.mp4"
            self.trim(input_path, temp_path, start, end_time=end, overwrite=True)
            temp_files.append(temp_path)
        
        # 合并片段
        try:
            self.merge_videos(temp_files, output_path, overwrite=overwrite)
        finally:
            # 清理临时文件
            for temp_path in temp_files:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        return output_path
    
    def merge_videos(
        self,
        input_files: List[str],
        output_path: str,
        overwrite: bool = True
    ) -> str:
        """
        合并多个视频文件
        
        Args:
            input_files: 输入视频文件路径列表
            output_path: 输出视频路径
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not input_files:
            raise FFmpegError("必须至少指定一个输入文件")
        
        if len(input_files) == 1:
            # 只有一个文件，直接复制
            import shutil
            shutil.copy2(input_files[0], output_path)
            return output_path
        
        # 创建文件列表
        list_file = f"{output_path}.merge_list.txt"
        with open(list_file, 'w', encoding='utf-8') as f:
            for file_path in input_files:
                if not os.path.exists(file_path):
                    raise FFmpegError(f"输入文件不存在：{file_path}")
                # 使用绝对路径
                abs_path = os.path.abspath(file_path)
                f.write(f"file '{abs_path}'\n")
        
        try:
            args = ['-y'] if overwrite else ['-n']
            args.extend(['-f', 'concat'])
            args.extend(['-safe', '0'])
            args.extend(['-i', list_file])
            args.extend(['-c', 'copy'])
            args.append(output_path)
            
            self.ffmpeg.run_command(args)
            
        finally:
            # 清理列表文件
            if os.path.exists(list_file):
                os.remove(list_file)
        
        return output_path
    
    def split(
        self,
        input_path: str,
        output_dir: str,
        segment_duration: float = 10.0,
        output_prefix: str = 'segment'
    ) -> List[str]:
        """
        分割视频为多个片段
        
        Args:
            input_path: 输入视频路径
            output_dir: 输出目录
            segment_duration: 每个片段的时长（秒）
            output_prefix: 输出文件前缀
            
        Returns:
            输出文件路径列表
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 获取视频总时长
        duration = self.ffmpeg.get_duration(input_path)
        
        output_files = []
        segment_num = 0
        
        current_time = 0
        while current_time < duration:
            output_path = os.path.join(
                output_dir,
                f"{output_prefix}_{segment_num:03d}.mp4"
            )
            
            remaining = duration - current_time
            actual_duration = min(segment_duration, remaining)
            
            self.trim(
                input_path,
                output_path,
                current_time,
                duration=actual_duration
            )
            
            output_files.append(output_path)
            segment_num += 1
            current_time += segment_duration
        
        return output_files
    
    def reverse(self, input_path: str, output_path: str, overwrite: bool = True) -> str:
        """
        反转视频（倒放）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-vf', 'reverse'])
        args.extend(['-af', 'areverse'])  # 同时反转音频
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path


# 使用示例
if __name__ == '__main__':
    editor = VideoEditor()
    
    # 裁剪视频（时间）
    try:
        output = editor.trim('input.mp4', 'output.mp4', start_time=10, end_time=30)
        print(f"裁剪完成：{output}")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 合并视频
    # videos = ['part1.mp4', 'part2.mp4', 'part3.mp4']
    # editor.merge_videos(videos, 'merged.mp4')
    
    # 分割视频
    # segments = editor.split('long_video.mp4', './segments', segment_duration=30)
