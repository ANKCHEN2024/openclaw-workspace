#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整工作流程示例：短视频处理流水线

演示如何将多个处理步骤组合成完整的工作流
"""

import os
import sys
from pathlib import Path

# 添加 src 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import VideoProcessor, FFmpegError


class VideoProcessingPipeline:
    """视频处理流水线"""
    
    def __init__(self, input_dir: str, output_dir: str):
        """
        初始化流水线
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
        """
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.processor = VideoProcessor()
        
        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'processed'), exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'thumbnails'), exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'metadata'), exist_ok=True)
    
    def process_video(self, video_path: str, config: dict) -> dict:
        """
        处理单个视频
        
        Args:
            video_path: 视频路径
            config: 处理配置
            
        Returns:
            处理结果
        """
        result = {
            'input': video_path,
            'steps': [],
            'success': True,
            'error': None
        }
        
        video_name = Path(video_path).stem
        
        try:
            # 步骤 1: 分析视频
            print(f"\n📊 分析视频：{Path(video_path).name}")
            info = self.processor.get_info(video_path)
            result['steps'].append({
                'name': '分析',
                'status': 'success',
                'info': {
                    'duration': info['file']['duration_formatted'],
                    'resolution': info['video']['resolution'],
                    'size_mb': info['file']['size_mb']
                }
            })
            
            # 步骤 2: 裁剪（如果配置了）
            if config.get('trim'):
                print(f"✂️  裁剪视频：{config['trim']}")
                trimmed_path = os.path.join(
                    self.output_dir, 'processed',
                    f"{video_name}_trimmed.mp4"
                )
                self.processor.trim(
                    video_path, trimmed_path,
                    start=config['trim']['start'],
                    end=config['trim']['end']
                )
                video_path = trimmed_path
                result['steps'].append({
                    'name': '裁剪',
                    'status': 'success',
                    'output': trimmed_path
                })
            
            # 步骤 3: 添加水印（如果配置了）
            if config.get('watermark'):
                print(f"💧 添加水印：{config['watermark']}")
                watermarked_path = os.path.join(
                    self.output_dir, 'processed',
                    f"{video_name}_watermarked.mp4"
                )
                wm_config = config['watermark']
                
                if wm_config.get('type') == 'image':
                    self.processor.add_watermark(
                        video_path, watermarked_path,
                        wm_config['path'],
                        position=wm_config.get('position', 'bottom-right'),
                        width=wm_config.get('width', 100),
                        opacity=wm_config.get('opacity', 0.7)
                    )
                elif wm_config.get('type') == 'text':
                    self.processor.watermarker.add_text_watermark(
                        video_path, watermarked_path,
                        text=wm_config['text'],
                        position=wm_config.get('position', 'bottom-center'),
                        fontsize=wm_config.get('fontsize', 24),
                        fontcolor=wm_config.get('color', 'white')
                    )
                
                video_path = watermarked_path
                result['steps'].append({
                    'name': '水印',
                    'status': 'success',
                    'output': watermarked_path
                })
            
            # 步骤 4: 压缩优化
            print(f"📦 压缩优化：{config.get('platform', 'general')}")
            final_path = os.path.join(
                self.output_dir, 'processed',
                f"{video_name}_final.mp4"
            )
            
            if config.get('platform'):
                result_info = self.processor.compressor.compress_for_platform(
                    video_path, final_path,
                    platform=config['platform']
                )
            else:
                result_info = self.processor.compress(
                    video_path, final_path,
                    crf=config.get('crf', 23),
                    preset=config.get('preset', 'medium')
                )
            
            result['steps'].append({
                'name': '压缩',
                'status': 'success',
                'output': final_path,
                'compression_ratio': result_info['compression_ratio']
            })
            
            # 步骤 5: 生成缩略图
            print(f"🖼️  生成缩略图")
            thumb_path = os.path.join(
                self.output_dir, 'thumbnails',
                f"{video_name}.jpg"
            )
            self.processor.create_thumbnail(
                final_path, thumb_path,
                size=config.get('thumbnail_size', (320, 180))
            )
            result['steps'].append({
                'name': '缩略图',
                'status': 'success',
                'output': thumb_path
            })
            
            # 步骤 6: 导出元数据
            print(f"📝 导出元数据")
            meta_path = os.path.join(
                self.output_dir, 'metadata',
                f"{video_name}.json"
            )
            self.processor.metadata.export_metadata(
                final_path, meta_path, format='json'
            )
            result['steps'].append({
                'name': '元数据',
                'status': 'success',
                'output': meta_path
            })
            
            result['output'] = {
                'video': final_path,
                'thumbnail': thumb_path,
                'metadata': meta_path
            }
            
            print(f"✅ 处理完成：{video_name}")
            
        except FFmpegError as e:
            result['success'] = False
            result['error'] = str(e)
            print(f"❌ 处理失败：{e}")
        
        return result
    
    def process_batch(self, config: dict) -> list:
        """
        批量处理目录中的所有视频
        
        Args:
            config: 处理配置
            
        Returns:
            处理结果列表
        """
        # 查找所有视频文件
        video_files = self.processor.batch.find_videos(
            self.input_dir,
            recursive=config.get('recursive', True)
        )
        
        if not video_files:
            print(f"⚠️  在 {self.input_dir} 中未找到视频文件")
            return []
        
        print(f"📁 找到 {len(video_files)} 个视频文件")
        
        results = []
        for video_file in video_files:
            result = self.process_video(video_file, config)
            results.append(result)
        
        # 生成报告
        self._print_report(results)
        
        return results
    
    def _print_report(self, results: list):
        """打印处理报告"""
        print("\n" + "="*60)
        print("处理报告")
        print("="*60)
        
        total = len(results)
        success = sum(1 for r in results if r['success'])
        failed = total - success
        
        print(f"总文件数：{total}")
        print(f"成功：{success}")
        print(f"失败：{failed}")
        
        if failed > 0:
            print("\n失败文件:")
            for r in results:
                if not r['success']:
                    print(f"  - {Path(r['input']).name}: {r['error']}")


def main():
    """主函数 - 演示完整工作流"""
    
    # 配置处理参数
    config = {
        # 裁剪配置（可选）
        # 'trim': {
        #     'start': 0,
        #     'end': 60  # 保留前 60 秒
        # },
        
        # 水印配置（可选）
        # 'watermark': {
        #     'type': 'image',  # 或 'text'
        #     'path': 'logo.png',
        #     'position': 'bottom-right',
        #     'width': 100,
        #     'opacity': 0.7
        # },
        # 'watermark': {
        #     'type': 'text',
        #     'text': '© 2024 My Company',
        #     'position': 'bottom-center',
        #     'fontsize': 24,
        #     'color': 'white'
        # },
        
        # 压缩配置
        'crf': 23,
        'preset': 'medium',
        
        # 或者指定平台（自动使用推荐参数）
        'platform': 'tiktok',  # tiktok/youtube/instagram/wechat
        
        # 缩略图配置
        'thumbnail_size': (320, 180),
        
        # 其他配置
        'recursive': True
    }
    
    # 创建流水线
    pipeline = VideoProcessingPipeline(
        input_dir='./input',
        output_dir='./output'
    )
    
    # 处理单个视频
    # result = pipeline.process_video('input/video.mp4', config)
    
    # 批量处理
    pipeline.process_batch(config)


if __name__ == '__main__':
    main()
