#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频处理模块使用示例
演示各个功能的用法
"""

import os
import sys

# 添加 src 到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src import VideoProcessor, FFmpegError


def example_basic_info():
    """示例 1: 获取视频信息"""
    print("\n" + "="*60)
    print("示例 1: 获取视频信息")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 获取视频详细信息
        info = processor.get_info('example_video.mp4')
        
        print(f"文件名：{info['file']['filename']}")
        print(f"文件大小：{info['file']['size_mb']:.2f} MB")
        print(f"时长：{info['file']['duration_formatted']}")
        print(f"分辨率：{info['video']['resolution']}")
        print(f"帧率：{info['video']['fps']} fps")
        print(f"编码：{info['video']['codec']}")
        print(f"宽高比：{info['video']['aspect_ratio']}")
        
    except FFmpegError as e:
        print(f"错误：{e}")
    except FileNotFoundError:
        print("提示：请替换 'example_video.mp4' 为实际视频文件路径")


def example_convert_format():
    """示例 2: 格式转换"""
    print("\n" + "="*60)
    print("示例 2: 格式转换")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 转换为 MP4（高质量）
        output = processor.convert(
            'input.avi',
            'output.mp4',
            quality='high'
        )
        print(f"转换完成：{output}")
        
        # 转换为 GIF
        output = processor.converter.convert_to_gif(
            'input.mp4',
            'output.gif',
            fps=10,
            width=320
        )
        print(f"GIF 转换完成：{output}")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_compress():
    """示例 3: 视频压缩"""
    print("\n" + "="*60)
    print("示例 3: 视频压缩")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 使用 CRF 压缩
        result = processor.compress(
            'input.mp4',
            'compressed.mp4',
            crf=25,
            preset='medium'
        )
        print(f"压缩完成!")
        print(f"原始大小：{result['original_size'] / 1024 / 1024:.2f} MB")
        print(f"输出大小：{result['output_size'] / 1024 / 1024:.2f} MB")
        print(f"压缩率：{result['compression_ratio']:.1f}%")
        
        # 为特定平台压缩
        result = processor.compressor.compress_for_platform(
            'input.mp4',
            'tiktok.mp4',
            platform='tiktok'
        )
        print(f"\nTikTok 优化完成，压缩率：{result['compression_ratio']:.1f}%")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_edit():
    """示例 4: 视频编辑"""
    print("\n" + "="*60)
    print("示例 4: 视频编辑")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 裁剪视频（时间）
        output = processor.trim(
            'input.mp4',
            'trimmed.mp4',
            start=10,  # 从第 10 秒开始
            end=30     # 到第 30 秒结束
        )
        print(f"裁剪完成：{output}")
        
        # 合并多个视频
        videos = ['part1.mp4', 'part2.mp4', 'part3.mp4']
        output = processor.merge(videos, 'merged.mp4')
        print(f"合并完成：{output}")
        
        # 分割视频
        segments = processor.editor.split(
            'long_video.mp4',
            './segments',
            segment_duration=30  # 每段 30 秒
        )
        print(f"分割完成，生成 {len(segments)} 个片段")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_watermark():
    """示例 5: 添加水印"""
    print("\n" + "="*60)
    print("示例 5: 添加水印")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 添加图片水印
        output = processor.add_watermark(
            'input.mp4',
            'watermarked.mp4',
            'logo.png',
            position='bottom-right',
            width=100,
            opacity=0.7
        )
        print(f"图片水印添加完成：{output}")
        
        # 添加文字水印
        output = processor.watermarker.add_text_watermark(
            'input.mp4',
            'text_watermark.mp4',
            text='© 2024 My Company',
            position='bottom-center',
            fontsize=30,
            fontcolor='white',
            box=True
        )
        print(f"文字水印添加完成：{output}")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_frames():
    """示例 6: 帧提取"""
    print("\n" + "="*60)
    print("示例 6: 帧提取")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 提取单帧
        output = processor.extract_frame(
            'video.mp4',
            'frame.jpg',
            timestamp=5.0  # 第 5 秒
        )
        print(f"帧提取完成：{output}")
        
        # 创建缩略图
        output = processor.create_thumbnail(
            'video.mp4',
            'thumbnail.jpg',
            size=(320, 180)
        )
        print(f"缩略图创建完成：{output}")
        
        # 按间隔提取多帧
        frames = processor.frame_extractor.extract_frames(
            'video.mp4',
            './frames',
            interval=2.0  # 每 2 秒一帧
        )
        print(f"提取 {len(frames)} 帧")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_batch():
    """示例 7: 批量处理"""
    print("\n" + "="*60)
    print("示例 7: 批量处理")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 批量转换
        results = processor.batch.batch_convert(
            './input_videos',
            './converted',
            output_format='mp4'
        )
        print(processor.batch.generate_report(results))
        
        # 批量压缩
        results = processor.batch.batch_compress(
            './videos',
            './compressed',
            crf=25
        )
        print(processor.batch.generate_report(results))
        
        # 批量生成缩略图
        results = processor.batch.batch_thumbnail(
            './videos',
            './thumbnails'
        )
        print(processor.batch.generate_report(results))
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_metadata():
    """示例 8: 元数据管理"""
    print("\n" + "="*60)
    print("示例 8: 元数据管理")
    print("="*60)
    
    processor = VideoProcessor()
    
    try:
        # 获取元数据
        meta = processor.get_info('video.mp4')
        print(f"视频信息：{meta['file']['duration_formatted']}")
        
        # 添加标签
        output = processor.metadata.add_tags(
            'input.mp4',
            'output.mp4',
            title='我的视频',
            artist='作者名',
            year='2024',
            comment='视频描述'
        )
        print(f"标签添加完成：{output}")
        
        # 导出元数据
        output = processor.metadata.export_metadata(
            'video.mp4',
            'metadata.json',
            format='json'
        )
        print(f"元数据导出完成：{output}")
        
    except FFmpegError as e:
        print(f"错误：{e}")


def example_complete_workflow():
    """示例 9: 完整工作流程"""
    print("\n" + "="*60)
    print("示例 9: 完整工作流程")
    print("="*60)
    print("场景：处理原始视频，发布到 TikTok")
    
    processor = VideoProcessor()
    
    try:
        # 1. 获取原始视频信息
        print("\n1. 分析原始视频...")
        info = processor.get_info('raw_video.mov')
        print(f"   原始大小：{info['file']['size_mb']:.2f} MB")
        print(f"   分辨率：{info['video']['resolution']}")
        
        # 2. 裁剪精彩片段
        print("\n2. 裁剪视频...")
        trimmed = processor.trim(
            'raw_video.mov',
            'trimmed.mp4',
            start=0,
            end=60  # TikTok 限制 60 秒
        )
        
        # 3. 添加水印
        print("\n3. 添加水印...")
        watermarked = processor.add_watermark(
            trimmed,
            'watermarked.mp4',
            'logo.png',
            position='top-right',
            width=80,
            opacity=0.8
        )
        
        # 4. 为 TikTok 优化
        print("\n4. 压缩优化...")
        result = processor.compressor.compress_for_platform(
            watermarked,
            'final_tiktok.mp4',
            platform='tiktok'
        )
        print(f"   最终大小：{result['output_size'] / 1024 / 1024:.2f} MB")
        print(f"   压缩率：{result['compression_ratio']:.1f}%")
        
        # 5. 生成封面
        print("\n5. 生成封面...")
        thumbnail = processor.create_thumbnail(
            'final_tiktok.mp4',
            'cover.jpg',
            size=(720, 1280)
        )
        
        print("\n✓ 处理完成!")
        print(f"   输出视频：final_tiktok.mp4")
        print(f"   封面图片：cover.jpg")
        
    except FFmpegError as e:
        print(f"错误：{e}")


if __name__ == '__main__':
    print("视频处理模块使用示例")
    print("注意：请根据实际情况修改文件路径")
    
    # 运行所有示例（注释掉不需要的）
    # example_basic_info()
    # example_convert_format()
    # example_compress()
    # example_edit()
    # example_watermark()
    # example_frames()
    # example_batch()
    # example_metadata()
    example_complete_workflow()
