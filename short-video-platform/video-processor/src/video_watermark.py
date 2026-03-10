#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频水印模块
支持添加图片水印和文字水印
"""

import os
from typing import Optional, Tuple, Dict, Any
from pathlib import Path
from .ffmpeg_wrapper import FFmpegWrapper, FFmpegError


class VideoWatermarker:
    """视频水印添加器"""
    
    # 水印位置预设
    POSITIONS = {
        'top-left': (10, 10),
        'top-right': 'W-w-10:10',
        'bottom-left': (10, 'H-h-10'),
        'bottom-right': ('W-w-10', 'H-h-10'),
        'center': ('(W-w)/2', '(H-h)/2'),
        'top-center': ('(W-w)/2', '10'),
        'bottom-center': ('(W-w)/2', 'H-h-10'),
    }
    
    def __init__(self, ffmpeg_wrapper: Optional[FFmpegWrapper] = None):
        """
        初始化视频水印添加器
        
        Args:
            ffmpeg_wrapper: FFmpeg 包装器实例
        """
        self.ffmpeg = ffmpeg_wrapper or FFmpegWrapper()
    
    def add_image_watermark(
        self,
        input_path: str,
        output_path: str,
        watermark_path: str,
        position: str = 'bottom-right',
        x: Optional[int] = None,
        y: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        opacity: float = 1.0,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        overwrite: bool = True
    ) -> str:
        """
        添加图片水印
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            watermark_path: 水印图片路径
            position: 预设位置（top-left, top-right, bottom-left, bottom-right, center 等）
            x: X 坐标（覆盖 position）
            y: Y 坐标（覆盖 position）
            width: 水印宽度（可选，保持宽高比）
            height: 水印高度（可选，保持宽高比）
            opacity: 不透明度（0.0-1.0）
            start_time: 开始显示时间（秒）
            end_time: 结束显示时间（秒）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        if not os.path.exists(watermark_path):
            raise FFmpegError(f"水印文件不存在：{watermark_path}")
        
        # 确定位置
        pos_x, pos_y = self._get_position(position, x, y)
        
        # 构建水印滤镜
        filter_parts = []
        
        # 水印输入
        filter_parts.append(f'[1:v]')
        
        # 调整大小
        if width or height:
            size = f'{width or -1}:{height or -1}'
            filter_parts.append(f'scale={size}[wm]')
        else:
            filter_parts.append('[wm]')
        
        # 设置不透明度
        if opacity < 1.0:
            filter_parts.append(f'[wm]format=auto,format=rgba,lut=a=val*{opacity}[wmo]')
        
        # 叠加到视频
        overlay_filter = f'[0:v][wmo{"o" if opacity < 1.0 else ""}]overlay={pos_x}:{pos_y}'
        
        # 时间范围
        if start_time is not None or end_time is not None:
            enable_expr = []
            if start_time is not None:
                enable_expr.append(f'gte(t\,{start_time})')
            if end_time is not None:
                enable_expr.append(f'lte(t\,{end_time})')
            overlay_filter += f':enable=\'{"+".join(enable_expr)}\''
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-i', watermark_path])
        args.extend(['-filter_complex', ','.join(filter_parts[:-1]) + ';' + overlay_filter])
        args.extend(['-c:a', 'copy'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def add_text_watermark(
        self,
        input_path: str,
        output_path: str,
        text: str,
        position: str = 'bottom-right',
        x: Optional[int] = None,
        y: Optional[int] = None,
        fontsize: int = 24,
        fontcolor: str = 'white',
        font: Optional[str] = None,
        box: bool = False,
        boxcolor: str = 'black@0.5',
        opacity: float = 1.0,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        overwrite: bool = True
    ) -> str:
        """
        添加文字水印
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            text: 水印文字
            position: 预设位置
            x: X 坐标（覆盖 position）
            y: Y 坐标（覆盖 position）
            fontsize: 字体大小
            fontcolor: 字体颜色
            font: 字体文件路径（可选）
            box: 是否显示背景框
            boxcolor: 背景框颜色
            opacity: 不透明度（0.0-1.0）
            start_time: 开始显示时间（秒）
            end_time: 结束显示时间（秒）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        # 确定位置
        pos_x, pos_y = self._get_position(position, x, y)
        
        # 构建 drawtext 滤镜
        drawtext_opts = [
            f"text='{text}'",
            f"fontsize={fontsize}",
            f"fontcolor={fontcolor}",
            f"x={pos_x}",
            f"y={pos_y}"
        ]
        
        if font:
            if os.path.exists(font):
                drawtext_opts.append(f"fontfile='{os.path.abspath(font)}'")
            else:
                drawtext_opts.append(f"font='{font}'")
        
        if box:
            drawtext_opts.append(f"box=1")
            drawtext_opts.append(f"boxcolor={boxcolor}")
        
        if opacity < 1.0:
            drawtext_opts.append(f"alpha={opacity}")
        
        if start_time is not None:
            drawtext_opts.append(f"start={start_time}")
        if end_time is not None:
            drawtext_opts.append(f"end={end_time}")
        
        filter_str = f"drawtext={':'.join(drawtext_opts)}"
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-vf', filter_str])
        args.extend(['-c:a', 'copy'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def add_animated_watermark(
        self,
        input_path: str,
        output_path: str,
        watermark_path: str,
        position: str = 'bottom-right',
        duration: float = 3.0,
        interval: float = 5.0,
        fade_in: float = 0.5,
        fade_out: float = 0.5,
        overwrite: bool = True
    ) -> str:
        """
        添加动态水印（周期性显示）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            watermark_path: 水印图片路径（支持 GIF）
            position: 预设位置
            duration: 每次显示持续时间（秒）
            interval: 显示间隔（秒）
            fade_in: 淡入时间（秒）
            fade_out: 淡出时间（秒）
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        if not os.path.exists(input_path):
            raise FFmpegError(f"输入文件不存在：{input_path}")
        
        if not os.path.exists(watermark_path):
            raise FFmpegError(f"水印文件不存在：{watermark_path}")
        
        pos_x, pos_y = self._get_position(position)
        
        # 构建动态显示表达式
        # 使用 mod 函数实现周期性显示
        enable_expr = f"between(mod(t\,{interval}),0,{duration})"
        
        # 淡入淡出
        alpha_expr = f"if(lt(mod(t\,{interval}),{fade_in}),mod(t\,{interval})/{fade_in},"
        alpha_expr += f"if(gt(mod(t\,{interval}),{duration}-{fade_out}),({interval}-mod(t\,{interval}))/{fade_out},1))"
        
        filter_str = (
            f"[1:v]format=auto,format=rgba,"
            f"colorchannelmixer=aa={alpha_expr}[wm];"
            f"[0:v][wm]overlay={pos_x}:{pos_y}:enable='{enable_expr}'"
        )
        
        args = ['-y'] if overwrite else ['-n']
        args.extend(['-i', input_path])
        args.extend(['-i', watermark_path])
        args.extend(['-filter_complex', filter_str])
        args.extend(['-c:a', 'copy'])
        args.append(output_path)
        
        self.ffmpeg.run_command(args)
        
        return output_path
    
    def _get_position(self, position: str, x: Optional[int] = None, y: Optional[int] = None) -> Tuple:
        """
        获取水印位置
        
        Args:
            position: 预设位置名称
            x: X 坐标
            y: Y 坐标
            
        Returns:
            (x, y) 元组
        """
        if x is not None and y is not None:
            return (x, y)
        
        pos = self.POSITIONS.get(position, self.POSITIONS['bottom-right'])
        
        if isinstance(pos[0], int) and x is not None:
            pos = (x, pos[1])
        if isinstance(pos[1], int) and y is not None:
            pos = (pos[0], y)
        
        return pos
    
    def add_logo(
        self,
        input_path: str,
        output_path: str,
        logo_path: str,
        size: int = 100,
        margin: int = 10,
        position: str = 'bottom-right',
        overwrite: bool = True
    ) -> str:
        """
        添加 Logo（便捷方法）
        
        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            logo_path: Logo 图片路径
            size: Logo 大小（像素）
            margin: 边距（像素）
            position: 位置
            overwrite: 是否覆盖已存在的文件
            
        Returns:
            输出文件路径
        """
        return self.add_image_watermark(
            input_path, output_path, logo_path,
            position=position,
            width=size,
            height=size,
            x=margin if position.startswith('left') else None,
            y=margin if position.startswith('top') else None,
            opacity=0.8,
            overwrite=overwrite
        )


# 使用示例
if __name__ == '__main__':
    watermarker = VideoWatermarker()
    
    # 添加图片水印
    try:
        output = watermarker.add_image_watermark(
            'input.mp4',
            'output.mp4',
            'logo.png',
            position='bottom-right',
            width=100,
            opacity=0.7
        )
        print(f"水印添加完成：{output}")
    except FFmpegError as e:
        print(f"错误：{e}")
    
    # 添加文字水印
    # output = watermarker.add_text_watermark(
    #     'input.mp4', 'output.mp4',
    #     text='© 2024 My Company',
    #     position='bottom-center',
    #     fontsize=30,
    #     fontcolor='white'
    # )
