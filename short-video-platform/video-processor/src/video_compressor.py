#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频压缩优化模块
提供视频压缩和大小优化功能
"""

import os
from typing import Optional, Dict, Any
from pathlib import Path
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class VideoCompressor:
    """视频压缩器"""
    
    # 预设配置
    PRESETS = {
        'ultra_fast': {'preset': 'ultrafast', 'crf': 28},
        'fast': {'preset': 'fast', 'crf': 26},
        'medium': {'preset': 'medium', 'crf': 23},
        'slow': {'preset': 'slow', 'crf': 20},
        'veryslow': {'preset': 'veryslow', 'crf': 18},
    }
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化视频压缩器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def compress(
        self,
        input_path: str,
        output_path: str,
        target_size: Optional[int] = None,
        crf: Optional[int] = None,
        preset: str = 'medium',
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        audio_bitrate: str = '128k',
        overwrite: bool = True
    ) -> Dict[str, Any]:
        """
        压缩视频
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            target_size: 目标文件大小（字节），如果指定则自动计算比特率
            crf: 质量因子（0-51，越小质量越高），与 target_size 二选一
            preset: 编码速度预设（ultra_fast, fast, medium, slow, veryslow）
            max_width: 最大宽度（保持宽高比）
            max_height: 最大高度（保持宽高比）
            audio_bitrate: 音频比特率
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            包含压缩信息的字典（原始大小、输出大小、压缩率等）
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        # 获取原始文件大小和时长
        original_size = os.path.getsize(input_path)
        duration = self.ffmpeg.get_duration(input_path)
        
        args = ['-y'] if overwrite else ['-n']
        
        # 如果指定了目标大小，计算视频比特率
        if target_size is not None:
            # 计算视频比特率（目标大小 - 音频大小）/ 时长
            audio_size = int(audio_bitrate.replace('k', '000') / 8 * duration)
            video_size = target_size - audio_size
            video_bitrate = int(video_size * 8 / duration)
            
            args.extend(['-b:v', f'{video_bitrate}k'])
        else:
            # 使用 CRF 模式
            if crf is None:
                crf = self.PRESETS.get(preset, self.PRESETS['medium'])['crf']
            args.extend(['-crf', str(crf)])
        
        # 添加预设
        preset_value = self.PRESETS.get(preset, self.PRESETS['medium'])['preset']
        args.extend(['-preset', preset_value])
        
        # 分辨率调整
        if max_width or max_height:
            scale_filter = self._build_scale_filter(
                max_width,
                max_height,
                self.ffmpeg.get_resolution(input_path)
            )
            args.extend(['-vf', scale_filter])
        
        args.extend(['-i', input_path])
        args.extend(['-c:v', 'libx264'])
        args.extend(['-c:a', 'aac', '-b:a', audio_bitrate])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        # 计算压缩结果
        output_size = os.path.getsize(output_path)
        compression_ratio = (1 - output_size / original_size) * 100
        
        return {
            'original_size': original_size,
            'output_size': output_size,
            'compression_ratio': compression_ratio,
            'saved_bytes': original_size - output_size,
            'duration': duration
        }
    
    def _build_scale_filter(
        self,
        max_width: Optional[int],
        max_height: Optional[int],
        original_resolution: tuple
    ) -> str:
        """
        构建缩放滤镜
        
        Args:
            max_width: 最大宽度
            max_height: 最大高度
            original_resolution: 原始分辨率 (width, height)
            
        Returns:
            滤镜字符串
        """
        orig_width, orig_height = original_resolution
        
        if max_width and max_height:
            # 同时限制宽高，保持宽高比
            width_ratio = max_width / orig_width
            height_ratio = max_height / orig_height
            scale = min(width_ratio, height_ratio)
            
            new_width = int(orig_width * scale)
            new_height = int(orig_height * scale)
            
            # 确保是偶数（H.264 要求）
            new_width = new_width - (new_width % 2)
            new_height = new_height - (new_height % 2)
            
            return f'scale={new_width}:{new_height}'
        elif max_width:
            return f'scale={max_width}:-2'
        elif max_height:
            return f'scale=-2:{max_height}'
        
        return 'scale=iw:ih'
    
    def compress_for_platform(
        self,
        input_path: str,
        output_path: str,
        platform: str = 'tiktok',
        overwrite: bool = True
    ) -> Dict[str, Any]:
        """
        为特定平台压缩视频
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            platform: 平台名称（tiktok, youtube, instagram, wechat）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            压缩信息字典
        """
        # 平台配置
        platform_configs = {
            'tiktok': {
                'max_width': 1080,
                'max_height': 1920,
                'crf': 23,
                'preset': 'medium',
                'audio_bitrate': '128k'
            },
            'youtube': {
                'max_width': 1920,
                'max_height': 1080,
                'crf': 23,
                'preset': 'slow',
                'audio_bitrate': '192k'
            },
            'instagram': {
                'max_width': 1080,
                'max_height': 1080,
                'crf': 22,
                'preset': 'medium',
                'audio_bitrate': '128k'
            },
            'wechat': {
                'target_size': 25 * 1024 * 1024,  # 25MB
                'max_width': 1280,
                'max_height': 720,
                'preset': 'fast',
                'audio_bitrate': '128k'
            }
        }
        
        config = platform_configs.get(platform.lower())
        if not config:
            raise FFmpegError(f"不支持的平台：{platform}")
        
        return self.compress(
            input_path,
            output_path,
            crf=config.get('crf'),
            target_size=config.get('target_size'),
            max_width=config.get('max_width'),
            max_height=config.get('max_height'),
            preset=config.get('preset', 'medium'),
            audio_bitrate=config.get('audio_bitrate', '128k'),
            overwrite=overwrite
        )
    
    def optimize(
        self,
        input_path: str,
        output_path: str,
        quality: str = 'balanced',
        overwrite: bool = True
    ) -> Dict[str, Any]:
        """
        智能优化视频（自动选择最佳参数）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            quality: 质量模式（size, balanced, quality）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            压缩信息字典
        """
        # 获取原始视频信息
        info = self.ffmpeg.get_video_info(input_path)
        resolution = self.ffmpeg.get_resolution(input_path)
        codec = self.ffmpeg.get_codec(input_path)
        
        # 根据质量模式选择参数
        if quality == 'size':
            # 优先减小体积
            return self.compress(
                input_path, output_path,
                crf=28,
                preset='fast',
                overwrite=overwrite
            )
        elif quality == 'quality':
            # 优先保证质量
            return self.compress(
                input_path, output_path,
                crf=18,
                preset='slow',
                overwrite=overwrite
            )
        else:  # balanced
            # 平衡模式
            config = {
                'crf': 23,
                'preset': 'medium',
                'max_width': None,
                'max_height': None
            }
            
            # 如果原始分辨率很高，适当降低
            if resolution[0] > 1920 or resolution[1] > 1080:
                config['max_width'] = 1920
                config['max_height'] = 1080
            
            return self.compress(
                input_path, output_path,
                crf=config['crf'],
                preset=config['preset'],
                max_width=config['max_width'],
                max_height=config['max_height'],
                overwrite=overwrite
            )
    
    def batch_compress(
        self,
        input_files: list,
        output_dir: str,
        **kwargs
    ) -> list:
        """
        批量压缩视频
        
        Args:
            input_files: 输入文件路径列表
            output_dir: 输出目录
            **kwargs: 传递给 compress 方法的参数
            
        Returns:
            结果列表，每个元素包含输入路径、输出路径和压缩信息
        """
        os.makedirs(output_dir, exist_ok=True)
        
        results = []
        for input_file in input_files:
            output_path = os.path.join(
                output_dir,
                Path(input_file).stem + '_compressed.mp4'
            )
            
            try:
                info = self.compress(input_file, output_path, **kwargs)
                results.append({
                    'input': input_file,
                    'output': output_path,
                    'info': info,
                    'success': True
                })
                print(f"✓ 压缩成功：{Path(input_file).name}")
                print(f"  原始大小：{info['original_size'] / 1024 / 1024:.2f} MB")
                print(f"  输出大小：{info['output_size'] / 1024 / 1024:.2f} MB")
                print(f"  压缩率：{info['compression_ratio']:.1f}%")
            except FFmpegError as e:
                results.append({
                    'input': input_file,
                    'output': None,
                    'error': str(e),
                    'success': False
                })
                print(f"✗ 压缩失败：{Path(input_file).name} - {e}")
        
        return results


# 使用示例
if __name__ == '__main__':
    compressor = VideoCompressor()
    
    # 压缩视频
    try:
        result = compressor.compress('input.mp4', 'output.mp4', crf=25)
        print(f"压缩完成，压缩率：{result['compression_ratio']:.1f}%")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 为 TikTok 优化
    # result = compressor.compress_for_platform('input.mp4', 'tiktok.mp4', platform='tiktok')
