#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FFmpeg 包装器模块
提供对 FFmpeg 命令的封装和统一调用接口
"""

import subprocess
import json
import os
from typing import Optional, Dict, Any, List
from pathlib import Path


class FFmpegError(Exception):
    """FFmpeg 操作异常"""
    pass


class FFmpegWrapper:
    """FFmpeg 命令包装器"""
    
    def __init__(self, ffmpeg_path: str = 'ffmpeg', ffprobe_path: str = 'ffprobe'):
        """
        初始化 FFmpeg 包装器
        
        Args:
            ffmpeg_path: ffmpeg 可执行文件路径
            ffprobe_path: ffprobe 可执行文件路径
        """
        self.ffmpeg_path = ffmpeg_path
        self.ffprobe_path = ffprobe_path
        self._verify_installation()
    
    def _verify_installation(self):
        """验证 FFmpeg 是否已安装"""
        try:
            subprocess.run(
                [self.ffmpeg_path, '-version'],
                capture_output=True,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise FFmpegError(f"FFmpeg 未安装或路径不正确：{self.ffmpeg_path}")
        
        try:
            subprocess.run(
                [self.ffprobe_path, '-version'],
                capture_output=True,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise FFmpegError(f"FFprobe 未安装或路径不正确：{self.ffprobe_path}")
    
    def run_command(self, args: List[str], timeout: Optional[int] = 300) -> subprocess.CompletedProcess:
        """
        运行 FFmpeg 命令
        
        Args:
            args: 命令参数列表（不包含 ffmpeg 命令本身）
            timeout: 超时时间（秒）
            
        Returns:
            CompletedProcess 对象
            
        Raises:
            FFmpegError: 命令执行失败
        """
        cmd = [self.ffmpeg_path] + args
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            
            if result.returncode != 0:
                error_msg = result.stderr.strip() or f"FFmpeg 命令执行失败，返回码：{result.returncode}"
                raise FFmpegError(error_msg)
            
            return result
            
        except subprocess.TimeoutExpired:
            raise FFmpegError(f"FFmpeg 命令执行超时（{timeout}秒）")
        except FileNotFoundError:
            raise FFmpegError(f"找不到 FFmpeg 可执行文件：{self.ffmpeg_path}")
    
    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """
        获取视频详细信息
        
        Args:
            video_path: 视频文件路径
            
        Returns:
            包含视频信息的字典
            
        Raises:
            FFmpegError: 获取信息失败
        """
        if not os.path.exists(video_path):
            raise FFmpegError(f"视频文件不存在：{video_path}")
        
        cmd = [
            self.ffprobe_path,
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise FFmpegError(f"获取视频信息失败：{e.stderr}")
        except json.JSONDecodeError as e:
            raise FFmpegError(f"解析视频信息失败：{e}")
    
    def get_duration(self, video_path: str) -> float:
        """
        获取视频时长（秒）
        
        Args:
            video_path: 视频文件路径
            
        Returns:
            视频时长（秒）
        """
        info = self.get_video_info(video_path)
        return float(info['format']['duration'])
    
    def get_resolution(self, video_path: str) -> tuple:
        """
        获取视频分辨率
        
        Args:
            video_path: 视频文件路径
            
        Returns:
            (宽度，高度) 元组
        """
        info = self.get_video_info(video_path)
        for stream in info['streams']:
            if stream['codec_type'] == 'video':
                return (int(stream['width']), int(stream['height']))
        raise FFmpegError("未找到视频流")
    
    def get_codec(self, video_path: str) -> str:
        """
        获取视频编码格式
        
        Args:
            video_path: 视频文件路径
            
        Returns:
            编码格式名称
        """
        info = self.get_video_info(video_path)
        for stream in info['streams']:
            if stream['codec_type'] == 'video':
                return stream['codec_name']
        raise FFmpegError("未找到视频流")


# 使用示例
if __name__ == '__main__':
    # 创建包装器实例
    ffmpeg = FFmpegWrapper()
    
    # 获取视频信息
    try:
        info = ffmpeg.get_video_info('example.mp4')
        print(f"视频时长：{info['format']['duration']} 秒")
        print(f"文件大小：{info['format']['size']} 字节")
    except FFmpegError as e:
        print(f"错误：{e}")
