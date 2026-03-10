#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频处理模块单元测试
"""

import os
import sys
import unittest
import tempfile
import shutil
from pathlib import Path

# 添加 src 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ffmpeg_wrapper import FFmpegWrapper, FFmpegError
from video_converter import VideoConverter
from video_compressor import VideoCompressor
from video_editor import VideoEditor
from frame_extractor import FrameExtractor
from metadata_manager import MetadataManager


class TestFFmpegWrapper(unittest.TestCase):
    """测试 FFmpeg 包装器"""
    
    def setUp(self):
        """测试前准备"""
        self.ffmpeg = FFmpegWrapper()
    
    def test_verify_installation(self):
        """测试 FFmpeg 安装验证"""
        # 如果初始化成功，说明 FFmpeg 已安装
        self.assertIsNotNone(self.ffmpeg)
        self.assertTrue(hasattr(self.ffmpeg, 'ffmpeg_path'))
    
    def test_get_video_info_nonexistent(self):
        """测试获取不存在视频的信息"""
        with self.assertRaises(FFmpegError):
            self.ffmpeg.get_video_info('nonexistent.mp4')


class TestVideoConverter(unittest.TestCase):
    """测试视频转换器"""
    
    def setUp(self):
        """测试前准备"""
        self.test_dir = tempfile.mkdtemp()
        self.converter = VideoConverter()
    
    def tearDown(self):
        """测试后清理"""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_supported_formats(self):
        """测试支持的格式"""
        expected_formats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'gif']
        for fmt in expected_formats:
            self.assertIn(fmt, VideoConverter.SUPPORTED_FORMATS)


class TestVideoCompressor(unittest.TestCase):
    """测试视频压缩器"""
    
    def setUp(self):
        """测试前准备"""
        self.compressor = VideoCompressor()
    
    def test_presets(self):
        """测试预设配置"""
        expected_presets = ['ultra_fast', 'fast', 'medium', 'slow', 'veryslow']
        for preset in expected_presets:
            self.assertIn(preset, VideoCompressor.PRESETS)
    
    def test_platform_configs(self):
        """测试平台配置"""
        # 检查平台配置是否存在
        self.assertTrue(hasattr(self.compressor, 'compress_for_platform'))


class TestVideoEditor(unittest.TestCase):
    """测试视频编辑器"""
    
    def setUp(self):
        """测试前准备"""
        self.editor = VideoEditor()
    
    def test_merge_empty_list(self):
        """测试合并空列表"""
        with self.assertRaises(FFmpegError):
            self.editor.merge_videos([], 'output.mp4')


class TestFrameExtractor(unittest.TestCase):
    """测试帧提取器"""
    
    def setUp(self):
        """测试前准备"""
        self.test_dir = tempfile.mkdtemp()
        self.extractor = FrameExtractor()
    
    def tearDown(self):
        """测试后清理"""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_extract_nonexistent(self):
        """测试提取不存在的视频"""
        with self.assertRaises(FFmpegError):
            self.extractor.extract_frame(
                'nonexistent.mp4',
                os.path.join(self.test_dir, 'frame.jpg')
            )


class TestMetadataManager(unittest.TestCase):
    """测试元数据管理器"""
    
    def setUp(self):
        """测试前准备"""
        self.manager = MetadataManager()
    
    def test_get_metadata_nonexistent(self):
        """测试获取不存在的元数据"""
        with self.assertRaises(FFmpegError):
            self.manager.get_metadata('nonexistent.mp4')
    
    def test_format_duration(self):
        """测试时长格式化"""
        # 测试私有方法
        self.assertEqual(
            self.manager._format_duration(0),
            "00:00"
        )
        self.assertEqual(
            self.manager._format_duration(65),
            "01:05"
        )
        self.assertEqual(
            self.manager._format_duration(3665),
            "01:01:05"
        )
    
    def test_calculate_aspect_ratio(self):
        """测试宽高比计算"""
        self.assertEqual(
            self.manager._calculate_aspect_ratio(1920, 1080),
            "16:9"
        )
        self.assertEqual(
            self.manager._calculate_aspect_ratio(1080, 1080),
            "1:1"
        )


class TestIntegration(unittest.TestCase):
    """集成测试"""
    
    def setUp(self):
        """测试前准备"""
        self.test_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """测试后清理"""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_module_imports(self):
        """测试模块导入"""
        # 测试主模块导入
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
        from src import VideoProcessor, create_processor
        
        # 创建处理器
        processor = create_processor()
        self.assertIsNotNone(processor)
        
        # 检查所有子模块
        self.assertTrue(hasattr(processor, 'converter'))
        self.assertTrue(hasattr(processor, 'editor'))
        self.assertTrue(hasattr(processor, 'compressor'))
        self.assertTrue(hasattr(processor, 'watermarker'))
        self.assertTrue(hasattr(processor, 'frame_extractor'))
        self.assertTrue(hasattr(processor, 'metadata'))
        self.assertTrue(hasattr(processor, 'batch'))


if __name__ == '__main__':
    unittest.main()
