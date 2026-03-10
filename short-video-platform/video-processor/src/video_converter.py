#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频格式转换模块
支持各种视频格式之间的转换
"""

import os
from typing import Optional, Dict, Any
from pathlib import Path
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class VideoConverter:
    """视频格式转换器"""
    
    # 常见视频格式
    SUPPORTED_FORMATS = {
        'mp4': 'libx264',
        'avi': 'mpeg4',
        'mov': 'libx264',
        'mkv': 'libx264',
        'webm': 'libvpx-vp9',
        'flv': 'flv',
        'wmv': 'wmv2',
        'm4v': 'libx264',
        '3gp': 'libx264',
        'gif': 'gif'
    }
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化视频转换器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例，如果不提供则创建默认实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def convert(
        self,
        input_path: str,
        output_path: str,
        output_format: Optional[str] = None,
        video_codec: Optional[str] = None,
        audio_codec: Optional[str] = 'aac',
        quality: str = 'medium',
        overwrite: bool = True
    ) -> str:
        """
        转换视频格式
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径（可包含或不包含扩展名）
            output_format: 输出格式（如 'mp4', 'avi'），如果不指定则从 output_path 推断
            video_codec: 视频编码器，如果不指定则根据格式自动选择
            audio_codec: 音频编码器，默认 'aac'
            quality: 质量级别 ('low', 'medium', 'high', 'ultra')
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
            
        Raises:
            FFmpegError: 转换失败
        """
        # 验证输入文件
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        # 确定输出格式
        if output_format is None:
            output_format = Path(output_path).suffix.lstrip('.')
            if not output_format:
                raise FFmpegError("无法确定输出格式，请指定 output_format 参数")
        
        output_format = output_format.lower()
        
        # 如果 output_path 没有扩展名，添加扩展名
        if not Path(output_path).suffix:
            output_path = f"{output_path}.{output_format}"
        
        # 确定视频编码器
        if video_codec is None:
            video_codec = self.SUPPORTED_FORMATS.get(output_format, 'libx264')
        
        # 构建质量参数
        quality_params = self._get_quality_params(quality, video_codec)
        
        # 构建 FFmpeg 命令
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-c:v', video_codec])
        
        if audio_codec:
            args.extend(['-c:a', audio_codec])
        
        args.extend(quality_params)
        args.extend([output_path])
        
        # 执行转换
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def _get_quality_params(self, quality: str, codec: str) -> list:
        """
        根据质量级别获取 FFmpeg 参数
        
        Args:
            quality: 质量级别
            codec: 编码器
            
        Returns:
            参数字符串列表
        """
        # CRF 值（越小质量越高）
        crf_values = {
            'low': 28,
            'medium': 23,
            'high': 18,
            'ultra': 15
        }
        
        crf = crf_values.get(quality, 23)
        
        if codec in ['libx264', 'libx265']:
            return ['-crf', str(crf), '-preset', 'medium']
        elif codec == 'libvpx-vp9':
            return ['-crf', str(crf), '-b:v', '0']
        elif codec == 'mpeg4':
            return ['-q:v', str(10 - crf // 7)]
        else:
            return ['-crf', str(crf)]
    
    def convert_to_mp4(self, input_path: str, output_path: Optional[str] = None, **kwargs) -> str:
        """
        转换为 MP4 格式（便捷方法）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出路径（可选）
            **kwargs: 其他传递给 convert 方法的参数
            
        Returns:
            输出文件路径
        """
        if output_path is None:
            output_path = Path(input_path).with_suffix('.mp4')
        
        return self.convert(input_path, output_path, output_format='mp4', **kwargs)
    
    def convert_to_gif(self, input_path: str, output_path: Optional[str] = None, 
                       fps: int = 10, width: Optional[int] = None) -> str:
        """
        转换为 GIF 格式
        
        Args:
            input_path: 输入视频路径
            output_path: 输出路径（可选）
            fps: 帧率
            width: 宽度（可选，保持宽高比）
            
        Returns:
            输出文件路径
        """
        if output_path is None:
            output_path = Path(input_path).with_suffix('.gif')
        
        args = ['-y', '-i', input_path, '-vf']
        
        filter_parts = []
        if width:
            filter_parts.append(f'scale={width}:-1')
        filter_parts.append(f'fps={fps}')
        
        args.append(','.join(filter_parts))
        args.extend(['-c:v', 'gif', output_path])
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def batch_convert(
        self,
        input_files: list,
        output_dir: str,
        output_format: str = 'mp4',
        **kwargs
    ) -> list:
        """
        批量转换视频
        
        Args:
            input_files: 输入文件路径列表
            output_dir: 输出目录
            output_format: 输出格式
            **kwargs: 其他传递给 convert 方法的参数
            
        Returns:
            输出文件路径列表
        """
        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)
        
        output_files = []
        for input_file in input_files:
            # 生成输出文件名
            input_name = Path(input_file).stem
            output_path = os.path.join(output_dir, f"{input_name}.{output_format}")
            
            try:
                result = self.convert(input_file, output_path, output_format=output_format, **kwargs)
                output_files.append(result)
                print(f"✓ 转换成功：{input_file} -> {result}")
            except FFmpegError as e:
                print(f"✗ 转换失败：{input_file} - {e}")
        
        return output_files


# 使用示例
if __name__ == '__main__':
    converter = VideoConverter()
    
    # 转换为 MP4
    try:
        output = converter.convert_to_mp4('input.avi', 'output.mp4', quality='high')
        print(f"转换完成：{output}")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 批量转换
    # files = ['video1.avi', 'video2.mov', 'video3.mkv']
    # converter.batch_convert(files, './converted', output_format='mp4')
