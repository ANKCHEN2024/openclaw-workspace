#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频元数据管理模块
支持读取和修改视频元数据
"""

import os
import json
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class MetadataManager:
    """视频元数据管理器"""
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化元数据管理器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def get_metadata(self, video_path: str) -> Dict[str, Any]:
        """
        获取视频完整元数据
        
        Args:
            video_path: 视频文件路径
            
        Returns:
            包含元数据的字典
        """
        if not os.path.exists(video_path):
            raise FFmpegError(f"文件不存在：{video_path}")
        
        info = self.ffmpeg.get_video_info(video_path)
        
        # 整理元数据
        metadata = {
            'file': {
                'path': video_path,
                'filename': os.path.basename(video_path),
                'size': os.path.getsize(video_path),
                'format': info['format'].get('format_name', 'unknown'),
                'duration': float(info['format'].get('duration', 0)),
            },
            'video': {},
            'audio': {},
            'tags': {}
        }
        
        # 提取视频流信息
        for stream in info['streams']:
            if stream['codec_type'] == 'video':
                metadata['video'] = {
                    'codec': stream.get('codec_name', 'unknown'),
                    'codec_long': stream.get('codec_long_name', 'unknown'),
                    'width': int(stream.get('width', 0)),
                    'height': int(stream.get('height', 0)),
                    'fps': self._parse_fps(stream.get('r_frame_rate', '0/1')),
                    'bitrate': int(stream.get('bit_rate', 0)),
                    'pixel_format': stream.get('pix_fmt', 'unknown'),
                    'profile': stream.get('profile', 'unknown'),
                }
            elif stream['codec_type'] == 'audio':
                metadata['audio'] = {
                    'codec': stream.get('codec_name', 'unknown'),
                    'sample_rate': int(stream.get('sample_rate', 0)),
                    'channels': int(stream.get('channels', 0)),
                    'bitrate': int(stream.get('bit_rate', 0)),
                }
        
        # 提取标签信息
        if 'tags' in info['format']:
            metadata['tags'] = info['format']['tags']
        
        # 添加计算字段
        metadata['file']['size_mb'] = metadata['file']['size'] / 1024 / 1024
        metadata['file']['duration_formatted'] = self._format_duration(
            metadata['file']['duration']
        )
        metadata['video']['resolution'] = f"{metadata['video']['width']}x{metadata['video']['height']}"
        metadata['video']['aspect_ratio'] = self._calculate_aspect_ratio(
            metadata['video']['width'],
            metadata['video']['height']
        )
        
        return metadata
    
    def _parse_fps(self, fps_str: str) -> float:
        """解析 FPS 字符串"""
        try:
            if '/' in fps_str:
                num, den = fps_str.split('/')
                return float(num) / float(den)
            return float(fps_str)
        except (ValueError, ZeroDivisionError):
            return 0.0
    
    def _format_duration(self, seconds: float) -> str:
        """格式化时长"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes:02d}:{secs:02d}"
    
    def _calculate_aspect_ratio(self, width: int, height: int) -> str:
        """计算宽高比"""
        def gcd(a, b):
            while b:
                a, b = b, a % b
            return a
        
        if height == 0:
            return "0:0"
        
        divisor = gcd(width, height)
        return f"{width // divisor}:{height // divisor}"
    
    def set_metadata(
        self,
        input_path: str,
        output_path: str,
        metadata: Dict[str, str],
        copy_streams: bool = True,
        overwrite: bool = True
    ) -> str:
        """
        设置视频元数据
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            metadata: 元数据字典（键值对）
            copy_streams: 是否复制流（不重新编码）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        args = ['-y'] if overwrite else ['-n']
        
        # 添加元数据
        for key, value in metadata.items():
            args.extend(['-metadata', f'{key}={value}'])
        
        args.extend(['-i', input_path])
        
        if copy_streams:
            args.extend(['-c', 'copy'])
        
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def add_tags(
        self,
        input_path: str,
        output_path: str,
        title: Optional[str] = None,
        artist: Optional[str] = None,
        album: Optional[str] = None,
        genre: Optional[str] = None,
        year: Optional[str] = None,
        comment: Optional[str] = None,
        copyright: Optional[str] = None,
        custom_tags: Optional[Dict[str, str]] = None,
        overwrite: bool = True
    ) -> str:
        """
        添加视频标签
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            title: 标题
            artist: 作者
            album: 专辑
            genre: 类型
            year: 年份
            comment: 注释
            copyright: 版权信息
            custom_tags: 自定义标签
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        metadata = {}
        
        if title:
            metadata['title'] = title
        if artist:
            metadata['artist'] = artist
        if album:
            metadata['album'] = album
        if genre:
            metadata['genre'] = genre
        if year:
            metadata['year'] = year
        if comment:
            metadata['comment'] = comment
        if copyright:
            metadata['copyright'] = copyright
        
        if custom_tags:
            metadata.update(custom_tags)
        
        return self.set_metadata(input_path, output_path, metadata, overwrite=overwrite)
    
    def remove_metadata(
        self,
        input_path: str,
        output_path: str,
        overwrite: bool = True
    ) -> str:
        """
        移除所有元数据
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-map_metadata', '-1'])  # 移除所有元数据
        args.extend(['-c', 'copy'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def export_metadata(
        self,
        video_path: str,
        output_path: str,
        format: str = 'json'
    ) -> str:
        """
        导出元数据到文件
        
        Args:
            video_path: 视频文件路径
            output_path: 输出文件路径
            format: 导出格式（json, text）
            
        Returns:
            输出文件路径
        """
        metadata = self.get_metadata(video_path)
        
        if format.lower() == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
        elif format.lower() == 'text':
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(self._metadata_to_text(metadata))
        else:
            raise FFmpegError(f"不支持的导出格式：{format}")
        
        return output_path
    
    def _metadata_to_text(self, metadata: Dict[str, Any]) -> str:
        """将元数据转换为文本格式"""
        lines = []
        lines.append("=" * 50)
        lines.append("视频元数据")
        lines.append("=" * 50)
        
        # 文件信息
        lines.append("\n【文件信息】")
        for key, value in metadata['file'].items():
            lines.append(f"  {key}: {value}")
        
        # 视频信息
        if metadata['video']:
            lines.append("\n【视频信息】")
            for key, value in metadata['video'].items():
                lines.append(f"  {key}: {value}")
        
        # 音频信息
        if metadata['audio']:
            lines.append("\n【音频信息】")
            for key, value in metadata['audio'].items():
                lines.append(f"  {key}: {value}")
        
        # 标签信息
        if metadata['tags']:
            lines.append("\n【标签信息】")
            for key, value in metadata['tags'].items():
                lines.append(f"  {key}: {value}")
        
        return '\n'.join(lines)
    
    def compare_metadata(
        self,
        video_path1: str,
        video_path2: str
    ) -> Dict[str, Any]:
        """
        比较两个视频的元数据
        
        Args:
            video_path1: 第一个视频路径
            video_path2: 第二个视频路径
            
        Returns:
            比较结果字典
        """
        meta1 = self.get_metadata(video_path1)
        meta2 = self.get_metadata(video_path2)
        
        differences = {
            'duration': {
                'video1': meta1['file']['duration'],
                'video2': meta2['file']['duration'],
                'difference': abs(meta1['file']['duration'] - meta2['file']['duration'])
            },
            'size': {
                'video1': meta1['file']['size'],
                'video2': meta2['file']['size'],
                'difference': abs(meta1['file']['size'] - meta2['file']['size'])
            },
            'resolution': {
                'video1': meta1['video'].get('resolution', 'N/A'),
                'video2': meta2['video'].get('resolution', 'N/A'),
                'same': meta1['video'].get('resolution') == meta2['video'].get('resolution')
            },
            'codec': {
                'video1': meta1['video'].get('codec', 'N/A'),
                'video2': meta2['video'].get('codec', 'N/A'),
                'same': meta1['video'].get('codec') == meta2['video'].get('codec')
            },
            'fps': {
                'video1': meta1['video'].get('fps', 0),
                'video2': meta2['video'].get('fps', 0),
                'difference': abs(meta1['video'].get('fps', 0) - meta2['video'].get('fps', 0))
            }
        }
        
        return differences


# 使用示例
if __name__ == '__main__':
    manager = MetadataManager()
    
    # 获取元数据
    try:
        meta = manager.get_metadata('video.mp4')
        print(f"视频时长：{meta['file']['duration_formatted']}")
        print(f"分辨率：{meta['video']['resolution']}")
        print(f"编码：{meta['video']['codec']}")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 添加标签
    # manager.add_tags(
    #     'input.mp4', 'output.mp4',
    #     title='我的视频',
    #     artist='作者名',
    #     year='2024'
    # )
    
    # 导出元数据
    # manager.export_metadata('video.mp4', 'metadata.json', format='json')
