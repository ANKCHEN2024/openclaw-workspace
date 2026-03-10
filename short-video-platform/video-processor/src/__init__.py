#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频处理模块 - 主入口
提供统一的视频处理 API
"""

from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError
from .video_converter import VideoConverter
from .video_editor import VideoEditor
from .video_compressor import VideoCompressor
from .video_watermark import VideoWatermarker
from .frame_extractor import FrameExtractor
from .metadata_manager import MetadataManager
from .batch_processor import BatchProcessor


class VideoProcessor:
    """
    视频处理器 - 统一接口
    
    提供所有视频处理功能的便捷访问
    """
    
    def __init__(self, ffmpeg_path: str = 'ffmpeg', ffprobe_path: str = 'ffprobe'):
        """
        初始化视频处理器
        
        Args:
            ffmpeg_path: ffmpeg 可执行文件路径
            ffprobe_path: ffprobe 可执行文件路径
        """
        self.ffmpeg = FFmpegWrapper(ffmpeg_path, ffprobe_path)
        
        # 初始化各个模块
        self.converter = VideoConverter(self.ffmpeg)
        self.editor = VideoEditor(self.ffmpeg)
        self.compressor = VideoCompressor(self.ffmpeg)
        self.watermarker = VideoWatermarker(self.ffmpeg)
        self.frame_extractor = FrameExtractor(self.ffmpeg)
        self.metadata = MetadataManager(self.ffmpeg)
        self.batch = BatchProcessor(self.ffmpeg)
    
    def get_info(self, video_path: str) -> dict:
        """获取视频信息"""
        return self.metadata.get_metadata(video_path)
    
    def convert(self, input_path: str, output_path: str, **kwargs) -> str:
        """转换视频格式"""
        return self.converter.convert(input_path, output_path, **kwargs)
    
    def compress(self, input_path: str, output_path: str, **kwargs) -> dict:
        """压缩视频"""
        return self.compressor.compress(input_path, output_path, **kwargs)
    
    def trim(self, input_path: str, output_path: str, start: float, end: float) -> str:
        """裁剪视频"""
        return self.editor.trim(input_path, output_path, start, end_time=end)
    
    def merge(self, input_files: list, output_path: str) -> str:
        """合并视频"""
        return self.editor.merge_videos(input_files, output_path)
    
    def add_watermark(self, input_path: str, output_path: str, 
                     watermark_path: str, **kwargs) -> str:
        """添加水印"""
        return self.watermarker.add_image_watermark(
            input_path, output_path, watermark_path, **kwargs
        )
    
    def extract_frame(self, video_path: str, output_path: str, 
                     timestamp: float = 0) -> str:
        """提取帧"""
        return self.frame_extractor.extract_frame(
            video_path, output_path, timestamp
        )
    
    def create_thumbnail(self, video_path: str, output_path: str, **kwargs) -> str:
        """创建缩略图"""
        return self.frame_extractor.create_thumbnail(
            video_path, output_path, **kwargs
        )


# 便捷函数
def create_processor() -> VideoProcessor:
    """创建视频处理器实例"""
    return VideoProcessor()


__version__ = '1.0.0'
__author__ = 'Short Video Platform'
__all__ = [
    'VideoProcessor',
    'create_processor',
    'FFmpegWrapper',
    'FFmpegError',
    'VideoConverter',
    'VideoEditor',
    'VideoCompressor',
    'VideoWatermarker',
    'FrameExtractor',
    'MetadataManager',
    'BatchProcessor',
]
