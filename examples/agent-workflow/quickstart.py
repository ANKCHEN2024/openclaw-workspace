#!/usr/bin/env python3
"""
快速启动脚本

用法：
    python quickstart.py --topic "AI 数字孪生平台"
"""

import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from workflows.product_video import ProductVideoWorkflow
from config import config

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="🎬 Agent 工作流快速启动",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python quickstart.py --topic "AI 数字孪生平台"
    python quickstart.py --topic "产品介绍" --parallel
        """
    )
    
    parser.add_argument(
        "--topic",
        required=True,
        help="视频主题"
    )
    parser.add_argument(
        "--style",
        default="product_intro",
        choices=["product_intro", "tutorial", "promo"],
        help="视频风格"
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="使用并行模式"
    )
    parser.add_argument(
        "--output-dir",
        default="./outputs",
        help="输出目录"
    )
    
    args = parser.parse_args()
    
    print("\n" + "🎬 " * 20)
    print(f"主题：{args.topic}")
    print(f"风格：{args.style}")
    print(f"模式：{'并行' if args.parallel else '串行'}")
    print("🎬 " * 20 + "\n")
    
    # 创建工作流
    workflow = ProductVideoWorkflow(config)
    
    # 执行
    try:
        if args.parallel:
            results = workflow.run_parallel(args.topic, args.style)
        else:
            results = workflow.run(args.topic, args.style)
        
        print("\n" + "✅ " * 20)
        print("工作流执行成功！")
        print(f"输出目录：{args.output-dir}")
        print("✅ " * 20)
        
        return 0
    
    except Exception as e:
        print(f"\n❌ 执行失败：{e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
