#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量处理模块
支持对多个视频进行批量操作
"""

import os
import glob
from typing import Optional, List, Dict, Any, Callable
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class BatchProcessor:
    """批量视频处理器"""
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None, max_workers: int = 4):
        """
        初始化批量处理器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
            max_workers: 最大并发工作线程数
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
        self.max_workers = max_workers
    
    def find_videos(
        self,
        directory: str,
        extensions: Optional[List[str]] = None,
        recursive: bool = True
    ) -> List[str]:
        """
        在目录中查找视频文件
        
        Args:
            directory: 搜索目录
            extensions: 文件扩展名列表（默认包含常见视频格式）
            recursive: 是否递归搜索子目录
            
        Returns:
            视频文件路径列表
        """
        if extensions is None:
            extensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp']
        
        video_files = []
        
        if recursive:
            for ext in extensions:
                pattern = os.path.join(directory, '**', f'*.{ext}')
                video_files.extend(glob.glob(pattern, recursive=True))
                # 也搜索大写扩展名
                pattern = os.path.join(directory, '**', f'*.{ext.upper()}')
                video_files.extend(glob.glob(pattern, recursive=True))
        else:
            for ext in extensions:
                pattern = os.path.join(directory, f'*.{ext}')
                video_files.extend(glob.glob(pattern))
                pattern = os.path.join(directory, f'*.{ext.upper()}')
                video_files.extend(glob.glob(pattern))
        
        return sorted(list(set(video_files)))
    
    def process(
        self,
        input_files: List[str],
        output_dir: str,
        process_func: Callable[[str, str], Any],
        output_suffix: str = '_processed',
        output_ext: Optional[str] = None,
        skip_existing: bool = False,
        on_success: Optional[Callable[[str, str, Any], None]] = None,
        on_error: Optional[Callable[[str, str, Exception], None]] = None
    ) -> List[Dict[str, Any]]:
        """
        批量处理视频文件
        
        Args:
            input_files: 输入文件路径列表
            output_dir: 输出目录
            process_func: 处理函数，接收 (input_path, output_path) 参数
            output_suffix: 输出文件后缀
            output_ext: 输出文件扩展名（默认与输入相同）
            skip_existing: 跳过已存在的输出文件
            on_success: 成功回调函数，接收 (input_path, output_path, result)
            on_error: 错误回调函数，接收 (input_path, output_path, error)
            
        Returns:
            处理结果列表
        """
        os.makedirs(output_dir, exist_ok=True)
        
        results = []
        
        for input_file in input_files:
            # 生成输出路径
            input_name = Path(input_file).stem
            input_ext = Path(input_file).suffix if output_ext is None else f'.{output_ext}'
            output_path = os.path.join(output_dir, f"{input_name}{output_suffix}{input_ext}")
            
            # 检查是否已存在
            if skip_existing and os.path.exists(output_path):
                results.append({
                    'input': input_file,
                    'output': output_path,
                    'status': 'skipped',
                    'message': '输出文件已存在'
                })
                continue
            
            try:
                result = process_func(input_file, output_path)
                results.append({
                    'input': input_file,
                    'output': output_path,
                    'status': 'success',
                    'result': result
                })
                print(f"✓ 处理成功：{Path(input_file).name}")
                
                if on_success:
                    on_success(input_file, output_path, result)
                    
            except Exception as e:
                results.append({
                    'input': input_file,
                    'output': None,
                    'status': 'failed',
                    'error': str(e)
                })
                print(f"✗ 处理失败：{Path(input_file).name} - {e}")
                
                if on_error:
                    on_error(input_file, output_path, e)
        
        return results
    
    def process_parallel(
        self,
        input_files: List[str],
        output_dir: str,
        process_func: Callable[[str, str], Any],
        output_suffix: str = '_processed',
        output_ext: Optional[str] = None,
        max_workers: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        并行批量处理视频文件
        
        Args:
            input_files: 输入文件路径列表
            output_dir: 输出目录
            process_func: 处理函数
            output_suffix: 输出文件后缀
            output_ext: 输出文件扩展名
            max_workers: 最大并发数（覆盖构造函数设置）
            
        Returns:
            处理结果列表
        """
        os.makedirs(output_dir, exist_ok=True)
        
        if max_workers is None:
            max_workers = self.max_workers
        
        results = []
        
        def process_single(input_file: str) -> Dict[str, Any]:
            """单个文件处理函数"""
            input_name = Path(input_file).stem
            input_ext = Path(input_file).suffix if output_ext is None else f'.{output_ext}'
            output_path = os.path.join(output_dir, f"{input_name}{output_suffix}{input_ext}")
            
            try:
                result = process_func(input_file, output_path)
                return {
                    'input': input_file,
                    'output': output_path,
                    'status': 'success',
                    'result': result
                }
            except Exception as e:
                return {
                    'input': input_file,
                    'output': None,
                    'status': 'failed',
                    'error': str(e)
                }
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {
                executor.submit(process_single, f): f 
                for f in input_files
            }
            
            for future in as_completed(future_to_file):
                result = future.result()
                results.append(result)
                
                if result['status'] == 'success':
                    print(f"✓ 处理成功：{Path(result['input']).name}")
                else:
                    print(f"✗ 处理失败：{Path(result['input']).name} - {result['error']}")
        
        return results
    
    def batch_convert(
        self,
        input_dir: str,
        output_dir: str,
        output_format: str = 'mp4',
        recursive: bool = True,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        批量转换视频格式
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            output_format: 输出格式
            recursive: 是否递归搜索
            **kwargs: 传递给 VideoConverter.convert 的参数
            
        Returns:
            处理结果列表
        """
        from .video_converter import VideoConverter
        
        converter = VideoConverter(self.ffmpeg)
        
        # 查找视频文件
        video_files = self.find_videos(input_dir, recursive=recursive)
        
        if not video_files:
            print(f"在目录 {input_dir} 中未找到视频文件")
            return []
        
        print(f"找到 {len(video_files)} 个视频文件")
        
        def convert_func(input_path: str, output_path: str) -> str:
            return converter.convert(
                input_path, 
                output_path, 
                output_format=output_format,
                **kwargs
            )
        
        return self.process(
            video_files,
            output_dir,
            convert_func,
            output_suffix='',
            output_ext=output_format
        )
    
    def batch_compress(
        self,
        input_dir: str,
        output_dir: str,
        recursive: bool = True,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        批量压缩视频
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            recursive: 是否递归搜索
            **kwargs: 传递给 VideoCompressor.compress 的参数
            
        Returns:
            处理结果列表
        """
        from .video_compressor import VideoCompressor
        
        compressor = VideoCompressor(self.ffmpeg)
        
        video_files = self.find_videos(input_dir, recursive=recursive)
        
        if not video_files:
            print(f"在目录 {input_dir} 中未找到视频文件")
            return []
        
        print(f"找到 {len(video_files)} 个视频文件")
        
        def compress_func(input_path: str, output_path: str) -> Dict[str, Any]:
            return compressor.compress(input_path, output_path, **kwargs)
        
        return self.process(
            video_files,
            output_dir,
            compress_func,
            output_suffix='_compressed'
        )
    
    def batch_thumbnail(
        self,
        input_dir: str,
        output_dir: str,
        recursive: bool = True,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        批量生成缩略图
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            recursive: 是否递归搜索
            **kwargs: 传递给 FrameExtractor.create_thumbnail 的参数
            
        Returns:
            处理结果列表
        """
        from .frame_extractor import FrameExtractor
        
        extractor = FrameExtractor(self.ffmpeg)
        
        video_files = self.find_videos(input_dir, recursive=recursive)
        
        if not video_files:
            print(f"在目录 {input_dir} 中未找到视频文件")
            return []
        
        print(f"找到 {len(video_files)} 个视频文件")
        
        def thumbnail_func(input_path: str, output_path: str) -> str:
            # 修改输出路径为 jpg 格式
            output_path = Path(output_path).with_suffix('.jpg')
            return extractor.create_thumbnail(input_path, str(output_path), **kwargs)
        
        return self.process(
            video_files,
            output_dir,
            thumbnail_func,
            output_suffix='_thumb',
            output_ext='jpg'
        )
    
    def generate_report(self, results: List[Dict[str, Any]]) -> str:
        """
        生成处理报告
        
        Args:
            results: 处理结果列表
            
        Returns:
            报告文本
        """
        total = len(results)
        success = sum(1 for r in results if r['status'] == 'success')
        failed = sum(1 for r in results if r['status'] == 'failed')
        skipped = sum(1 for r in results if r['status'] == 'skipped')
        
        report = []
        report.append("=" * 60)
        report.append("批量处理报告")
        report.append("=" * 60)
        report.append(f"总文件数：{total}")
        report.append(f"成功：{success}")
        report.append(f"失败：{failed}")
        report.append(f"跳过：{skipped}")
        report.append(f"成功率：{success/total*100:.1f}%" if total > 0 else "N/A")
        report.append("")
        
        if failed > 0:
            report.append("失败文件:")
            for r in results:
                if r['status'] == 'failed':
                    report.append(f"  - {Path(r['input']).name}: {r['error']}")
        
        return '\n'.join(report)


# 使用示例
if __name__ == '__main__':
    processor = BatchProcessor()
    
    # 批量转换
    # results = processor.batch_convert('./input', './output', output_format='mp4')
    
    # 批量压缩
    # results = processor.batch_compress('./videos', './compressed', crf=25)
    
    # 生成报告
    # print(processor.generate_report(results))
