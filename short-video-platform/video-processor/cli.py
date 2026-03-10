#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频处理命令行工具

使用方法:
    python cli.py convert input.avi output.mp4
    python cli.py compress input.mp4 --crf 25
    python cli.py trim input.mp4 output.mp4 --start 10 --end 30
    python cli.py watermark input.mp4 logo.png output.mp4
    python cli.py thumbnail input.mp4 output.jpg
    python cli.py info input.mp4
    python cli.py batch ./input ./output --action convert
"""

import argparse
import sys
import os

# 添加 src 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src import VideoProcessor, FFmpegError


def cmd_info(args):
    """显示视频信息"""
    processor = VideoProcessor()
    try:
        info = processor.get_info(args.input)
        
        print("\n📊 视频信息")
        print("=" * 50)
        print(f"文件：{info['file']['filename']}")
        print(f"大小：{info['file']['size_mb']:.2f} MB")
        print(f"时长：{info['file']['duration_formatted']}")
        print(f"格式：{info['file']['format']}")
        print(f"\n视频流:")
        print(f"  分辨率：{info['video']['resolution']}")
        print(f"  编码：{info['video']['codec']}")
        print(f"  帧率：{info['video']['fps']} fps")
        print(f"  宽高比：{info['video']['aspect_ratio']}")
        
        if info.get('audio'):
            print(f"\n音频流:")
            print(f"  编码：{info['audio']['codec']}")
            print(f"  采样率：{info['audio']['sample_rate']} Hz")
            print(f"  声道数：{info['audio']['channels']}")
        
        if info.get('tags'):
            print(f"\n标签:")
            for key, value in info['tags'].items():
                print(f"  {key}: {value}")
        
        print()
        
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_convert(args):
    """转换视频格式"""
    processor = VideoProcessor()
    try:
        print(f"🔄 转换：{args.input} -> {args.output}")
        output = processor.convert(
            args.input,
            args.output,
            quality=args.quality
        )
        print(f"✅ 转换完成：{output}")
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_compress(args):
    """压缩视频"""
    processor = VideoProcessor()
    try:
        print(f"📦 压缩：{args.input}")
        
        if args.platform:
            result = processor.compressor.compress_for_platform(
                args.input,
                args.output or args.input.replace('.mp4', '_compressed.mp4'),
                platform=args.platform
            )
        else:
            result = processor.compress(
                args.input,
                args.output or args.input.replace('.mp4', '_compressed.mp4'),
                crf=args.crf,
                preset=args.preset
            )
        
        print(f"✅ 压缩完成")
        print(f"   原始大小：{result['original_size'] / 1024 / 1024:.2f} MB")
        print(f"   输出大小：{result['output_size'] / 1024 / 1024:.2f} MB")
        print(f"   压缩率：{result['compression_ratio']:.1f}%")
        
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_trim(args):
    """裁剪视频"""
    processor = VideoProcessor()
    try:
        print(f"✂️  裁剪：{args.input} ({args.start}s - {args.end}s)")
        output = processor.trim(
            args.input,
            args.output,
            start=args.start,
            end=args.end
        )
        print(f"✅ 裁剪完成：{output}")
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_merge(args):
    """合并视频"""
    processor = VideoProcessor()
    try:
        print(f"🔗 合并：{len(args.inputs)} 个文件 -> {args.output}")
        output = processor.merge(args.inputs, args.output)
        print(f"✅ 合并完成：{output}")
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_watermark(args):
    """添加水印"""
    processor = VideoProcessor()
    try:
        print(f"💧 添加水印：{args.input}")
        
        if args.text:
            output = processor.watermarker.add_text_watermark(
                args.input,
                args.output,
                text=args.text,
                position=args.position,
                fontsize=args.fontsize,
                fontcolor=args.color
            )
        else:
            output = processor.add_watermark(
                args.input,
                args.output,
                args.watermark,
                position=args.position,
                width=args.width,
                opacity=args.opacity
            )
        
        print(f"✅ 水印添加完成：{output}")
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_thumbnail(args):
    """生成缩略图"""
    processor = VideoProcessor()
    try:
        print(f"🖼️  生成缩略图：{args.input}")
        output = processor.create_thumbnail(
            args.input,
            args.output,
            size=(args.width, args.height)
        )
        print(f"✅ 缩略图生成完成：{output}")
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_extract(args):
    """提取帧"""
    processor = VideoProcessor()
    try:
        print(f"📸 提取帧：{args.input}")
        
        if args.all:
            frames = processor.frame_extractor.extract_all_frames(
                args.input,
                args.output_dir or './frames'
            )
            print(f"✅ 提取 {len(frames)} 帧")
        elif args.keyframes:
            frames = processor.frame_extractor.extract_keyframes(
                args.input,
                args.output_dir or './keyframes'
            )
            print(f"✅ 提取 {len(frames)} 个关键帧")
        else:
            output = processor.extract_frame(
                args.input,
                args.output or 'frame.jpg',
                timestamp=args.timestamp
            )
            print(f"✅ 帧提取完成：{output}")
            
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def cmd_batch(args):
    """批量处理"""
    processor = VideoProcessor()
    try:
        print(f"📁 批量处理：{args.input_dir} -> {args.output_dir}")
        
        if args.action == 'convert':
            results = processor.batch.batch_convert(
                args.input_dir,
                args.output_dir,
                output_format=args.format,
                recursive=not args.no_recursive
            )
        elif args.action == 'compress':
            results = processor.batch.batch_compress(
                args.input_dir,
                args.output_dir,
                crf=args.crf,
                recursive=not args.no_recursive
            )
        elif args.action == 'thumbnail':
            results = processor.batch.batch_thumbnail(
                args.input_dir,
                args.output_dir,
                recursive=not args.no_recursive
            )
        
        print("\n" + processor.batch.generate_report(results))
        
    except FFmpegError as e:
        print(f"❌ 错误：{e}")
        sys.exit(1)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='视频处理命令行工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  %(prog)s info video.mp4
  %(prog)s convert input.avi output.mp4 --quality high
  %(prog)s compress video.mp4 --crf 25
  %(prog)s compress video.mp4 --platform tiktok
  %(prog)s trim video.mp4 output.mp4 --start 10 --end 30
  %(prog)s watermark video.mp4 logo.png output.mp4
  %(prog)s watermark video.mp4 --text "© 2024" output.mp4
  %(prog)s thumbnail video.mp4 thumb.jpg
  %(prog)s batch ./input ./output --action compress
        '''
    )
    
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    # info 命令
    info_parser = subparsers.add_parser('info', help='显示视频信息')
    info_parser.add_argument('input', help='输入视频文件')
    info_parser.set_defaults(func=cmd_info)
    
    # convert 命令
    convert_parser = subparsers.add_parser('convert', help='转换视频格式')
    convert_parser.add_argument('input', help='输入视频文件')
    convert_parser.add_argument('output', help='输出视频文件')
    convert_parser.add_argument('--quality', '-q', 
                               choices=['low', 'medium', 'high', 'ultra'],
                               default='medium', help='质量级别')
    convert_parser.set_defaults(func=cmd_convert)
    
    # compress 命令
    compress_parser = subparsers.add_parser('compress', help='压缩视频')
    compress_parser.add_argument('input', help='输入视频文件')
    compress_parser.add_argument('--output', '-o', help='输出文件')
    compress_parser.add_argument('--crf', type=int, default=23, 
                                help='质量因子 (0-51, 默认 23)')
    compress_parser.add_argument('--preset', '-p',
                                choices=['ultrafast', 'fast', 'medium', 'slow', 'veryslow'],
                                default='medium', help='编码速度预设')
    compress_parser.add_argument('--platform',
                                choices=['tiktok', 'youtube', 'instagram', 'wechat'],
                                help='目标平台（自动使用推荐参数）')
    compress_parser.set_defaults(func=cmd_compress)
    
    # trim 命令
    trim_parser = subparsers.add_parser('trim', help='裁剪视频')
    trim_parser.add_argument('input', help='输入视频文件')
    trim_parser.add_argument('output', help='输出视频文件')
    trim_parser.add_argument('--start', '-s', type=float, required=True,
                            help='开始时间（秒）')
    trim_parser.add_argument('--end', '-e', type=float, required=True,
                            help='结束时间（秒）')
    trim_parser.set_defaults(func=cmd_trim)
    
    # merge 命令
    merge_parser = subparsers.add_parser('merge', help='合并视频')
    merge_parser.add_argument('inputs', nargs='+', help='输入视频文件列表')
    merge_parser.add_argument('--output', '-o', required=True,
                             help='输出视频文件')
    merge_parser.set_defaults(func=cmd_merge)
    
    # watermark 命令
    watermark_parser = subparsers.add_parser('watermark', help='添加水印')
    watermark_parser.add_argument('input', help='输入视频文件')
    watermark_parser.add_argument('watermark', nargs='?', help='水印图片文件')
    watermark_parser.add_argument('output', help='输出视频文件')
    watermark_parser.add_argument('--text', '-t', help='文字水印内容')
    watermark_parser.add_argument('--position', '-pos',
                                 choices=['top-left', 'top-right', 'bottom-left', 
                                         'bottom-right', 'center', 'top-center', 'bottom-center'],
                                 default='bottom-right', help='水印位置')
    watermark_parser.add_argument('--width', '-w', type=int, default=100,
                                 help='水印宽度（图片水印）')
    watermark_parser.add_argument('--opacity', '-op', type=float, default=0.7,
                                 help='不透明度 (0.0-1.0)')
    watermark_parser.add_argument('--fontsize', '-fs', type=int, default=24,
                                 help='字体大小（文字水印）')
    watermark_parser.add_argument('--color', '-c', default='white',
                                 help='字体颜色（文字水印）')
    watermark_parser.set_defaults(func=cmd_watermark)
    
    # thumbnail 命令
    thumb_parser = subparsers.add_parser('thumbnail', help='生成缩略图')
    thumb_parser.add_argument('input', help='输入视频文件')
    thumb_parser.add_argument('output', help='输出图片文件')
    thumb_parser.add_argument('--width', '-w', type=int, default=320,
                             help='缩略图宽度')
    thumb_parser.add_argument('--height', '-H', type=int, default=180,
                             help='缩略图高度')
    thumb_parser.set_defaults(func=cmd_thumbnail)
    
    # extract 命令
    extract_parser = subparsers.add_parser('extract', help='提取帧')
    extract_parser.add_argument('input', help='输入视频文件')
    extract_parser.add_argument('--output', '-o', help='输出图片文件')
    extract_parser.add_argument('--output-dir', '-d', help='输出目录')
    extract_parser.add_argument('--timestamp', '-t', type=float, default=0,
                               help='时间点（秒）')
    extract_parser.add_argument('--all', '-a', action='store_true',
                               help='提取所有帧')
    extract_parser.add_argument('--keyframes', '-k', action='store_true',
                               help='提取关键帧')
    extract_parser.set_defaults(func=cmd_extract)
    
    # batch 命令
    batch_parser = subparsers.add_parser('batch', help='批量处理')
    batch_parser.add_argument('input_dir', help='输入目录')
    batch_parser.add_argument('output_dir', help='输出目录')
    batch_parser.add_argument('--action', '-a',
                             choices=['convert', 'compress', 'thumbnail'],
                             required=True, help='处理动作')
    batch_parser.add_argument('--format', '-f', default='mp4',
                             help='输出格式（convert 动作）')
    batch_parser.add_argument('--crf', type=int, default=23,
                             help='CRF 值（compress 动作）')
    batch_parser.add_argument('--no-recursive', '-n', action='store_true',
                             help='不递归搜索子目录')
    batch_parser.set_defaults(func=cmd_batch)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        sys.exit(1)
    
    args.func(args)


if __name__ == '__main__':
    main()
