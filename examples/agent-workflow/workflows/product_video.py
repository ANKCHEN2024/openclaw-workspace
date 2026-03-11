"""
产品介绍视频工作流

演示：写脚本 → 生成图 → 剪视频 的完整流程
"""

import os
import time
from typing import Optional
from pathlib import Path

# 导入 subagents
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from subagents.script_writer import ScriptWriterSubagent
from subagents.image_generator import ImageGeneratorSubagent
from subagents.video_editor import VideoEditorSubagent
from config import config

class ProductVideoWorkflow:
    """产品介绍视频工作流"""
    
    def __init__(self, config=None):
        self.config = config or config
        self.script_agent = ScriptWriterSubagent(self.config)
        self.image_agent = ImageGeneratorSubagent(self.config)
        self.video_agent = VideoEditorSubagent(self.config)
    
    def run(
        self,
        topic: str,
        style: str = "product_intro",
        parallel_images: bool = True
    ) -> dict:
        """
        执行完整工作流
        
        Args:
            topic: 视频主题
            style: 脚本风格
            parallel_images: 是否并行生成图像
        
        Returns:
            dict: 工作流结果
        """
        print("=" * 60)
        print(f"🎬 产品介绍视频工作流")
        print(f"   主题：{topic}")
        print(f"   风格：{style}")
        print("=" * 60)
        
        start_time = time.time()
        results = {}
        
        # Step 1: 生成脚本
        print("\n[Step 1/3] 生成脚本...")
        step1_start = time.time()
        
        script_result = self.script_agent.run(topic=topic, style=style)
        results["script"] = script_result
        
        step1_time = time.time() - step1_start
        print(f"✅ 脚本完成 (耗时：{step1_time:.1f}秒)")
        
        # Step 2: 生成图像
        print("\n[Step 2/3] 生成图像...")
        step2_start = time.time()
        
        image_result = self.image_agent.run(
            script_result=script_result,
            topic=topic
        )
        results["images"] = image_result
        
        step2_time = time.time() - step2_start
        print(f"✅ 图像完成 (耗时：{step2_time:.1f}秒)")
        
        # Step 3: 合成视频
        print("\n[Step 3/3] 合成视频...")
        step3_start = time.time()
        
        image_paths = [img.image_path for img in image_result.images if img.status == "complete"]
        
        video_result = self.video_agent.run(
            images=image_paths,
            audio_path=script_result.audio_path,
            topic=topic
        )
        results["video"] = video_result
        
        step3_time = time.time() - step3_start
        print(f"✅ 视频完成 (耗时：{step3_time:.1f}秒)")
        
        # 汇总
        total_time = time.time() - start_time
        results["total_time"] = total_time
        results["status"] = "success"
        
        print("\n" + "=" * 60)
        print(f"🎉 工作流完成！")
        print(f"   总耗时：{total_time:.1f}秒")
        print(f"   脚本：{len(script_result.segments)} 个场景")
        print(f"   图像：{image_result.success_count}/{image_result.total_count} 张")
        print(f"   视频：{video_result.video_path}")
        print("=" * 60)
        
        return results
    
    def run_parallel(self, topic: str, style: str = "product_intro") -> dict:
        """
        并行版本工作流
        
        脚本和图像可以并行生成（图像生成不依赖脚本完成）
        """
        import concurrent.futures
        
        print("=" * 60)
        print(f"🚀 并行工作流：{topic}")
        print("=" * 60)
        
        start_time = time.time()
        results = {}
        
        # 并行执行 Step 1 和 Step 2
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            # 提交任务
            script_future = executor.submit(
                self.script_agent.run,
                topic=topic,
                style=style
            )
            
            # 图像生成需要等待脚本（获取 visual_prompt）
            # 所以这里演示另一种并行：预定义提示词
            image_future = executor.submit(
                self.image_agent.run,
                prompts=[f"{topic} professional image scene {i}" for i in range(1, 7)],
                topic=topic
            )
            
            # 等待完成
            script_result = script_future.result()
            image_result = image_future.result()
        
        results["script"] = script_result
        results["images"] = image_result
        
        # Step 3: 串行合成视频
        image_paths = [img.image_path for img in image_result.images if img.status == "complete"]
        video_result = self.video_agent.run(
            images=image_paths,
            audio_path=script_result.audio_path,
            topic=topic
        )
        results["video"] = video_result
        
        total_time = time.time() - start_time
        results["total_time"] = total_time
        results["status"] = "success"
        
        print(f"\n🎉 并行工作流完成！总耗时：{total_time:.1f}秒")
        
        return results


# 命令行入口
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="产品介绍视频工作流")
    parser.add_argument("--topic", required=True, help="视频主题")
    parser.add_argument("--style", default="product_intro", help="脚本风格")
    parser.add_argument("--parallel", action="store_true", help="使用并行模式")
    
    args = parser.parse_args()
    
    workflow = ProductVideoWorkflow(config)
    
    if args.parallel:
        results = workflow.run_parallel(args.topic, args.style)
    else:
        results = workflow.run(args.topic, args.style)
    
    print(f"\n✅ 所有任务完成！")
