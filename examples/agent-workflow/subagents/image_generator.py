"""
图像生成 Subagent

职责：根据脚本生成配套图像/分镜
"""

import os
import json
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

@dataclass
class ImageResult:
    """图像生成结果"""
    scene_number: int
    image_path: str
    prompt_used: str
    status: str = "complete"

@dataclass
class BatchImageResult:
    """批量图像生成结果"""
    images: List[ImageResult]
    total_count: int
    success_count: int
    status: str = "complete"

class ImageGeneratorSubagent:
    """图像生成 Subagent"""
    
    def __init__(self, config=None):
        self.config = config
        self.output_dir = config.IMAGES_DIR if config else "./outputs/images"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run(self, script_result=None, prompts: List[str] = None, topic: str = "demo") -> BatchImageResult:
        """
        执行图像生成任务
        
        Args:
            script_result: 脚本生成结果（包含 visual_prompt）
            prompts: 直接提供提示词列表
            topic: 主题名称
        
        Returns:
            BatchImageResult: 批量图像结果
        """
        print(f"[ImageGenerator] 开始生成图像：{topic}")
        
        # 1. 准备提示词
        if script_result and hasattr(script_result, 'segments'):
            prompts = [seg.visual_prompt for seg in script_result.segments]
            scene_numbers = [seg.scene_number for seg in script_result.segments]
        elif prompts:
            scene_numbers = list(range(1, len(prompts) + 1))
        else:
            # 默认提示词
            prompts = [f"Professional image about {topic}, scene {i}" for i in range(1, 7)]
            scene_numbers = list(range(1, 7))
        
        print(f"[ImageGenerator] 将生成 {len(prompts)} 张图像")
        
        # 2. 批量生成（可并行）
        images = []
        success_count = 0
        
        for i, (prompt, scene_num) in enumerate(zip(prompts, scene_numbers), 1):
            print(f"[ImageGenerator] 生成第 {i}/{len(prompts)} 张...")
            
            try:
                image_result = self._generate_single_image(prompt, scene_num, topic)
                images.append(image_result)
                success_count += 1
            except Exception as e:
                print(f"[ImageGenerator] 第 {i} 张失败：{e}")
                images.append(ImageResult(
                    scene_number=scene_num,
                    image_path="",
                    prompt_used=prompt,
                    status=f"failed: {e}"
                ))
        
        # 3. 汇总结果
        result = BatchImageResult(
            images=images,
            total_count=len(prompts),
            success_count=success_count,
            status="complete" if success_count == len(prompts) else "partial"
        )
        
        # 4. 保存元数据
        self._save_metadata(result, topic)
        
        print(f"[ImageGenerator] 完成！成功：{success_count}/{len(prompts)}")
        
        return result
    
    def _generate_single_image(self, prompt: str, scene_number: int, topic: str) -> ImageResult:
        """生成单张图像"""
        # 实际实现会调用 DALL-E / Midjourney / Stable Diffusion API
        # 这里创建占位文件
        
        image_filename = f"{topic}_scene_{scene_number:03d}.png"
        image_path = os.path.join(self.output_dir, image_filename)
        
        # 创建占位文件
        Path(image_path).touch()
        
        return ImageResult(
            scene_number=scene_number,
            image_path=image_path,
            prompt_used=prompt,
            status="complete"
        )
    
    def _save_metadata(self, result: BatchImageResult, topic: str):
        """保存元数据"""
        metadata_path = os.path.join(self.output_dir, f"{topic}_images.json")
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                "topic": topic,
                "total_count": result.total_count,
                "success_count": result.success_count,
                "images": [
                    {
                        "scene_number": img.scene_number,
                        "image_path": img.image_path,
                        "prompt_used": img.prompt_used,
                        "status": img.status
                    }
                    for img in result.images
                ]
            }, f, ensure_ascii=False, indent=2)
        
        print(f"[ImageGenerator] 元数据已保存：{metadata_path}")


# 命令行入口
if __name__ == "__main__":
    import argparse
    from config import config
    
    parser = argparse.ArgumentParser(description="图像生成 Subagent")
    parser.add_argument("--topic", default="demo", help="主题名称")
    parser.add_argument("--prompts", nargs='*', help="提示词列表")
    
    args = parser.parse_args()
    
    agent = ImageGeneratorSubagent(config)
    result = agent.run(topic=args.topic, prompts=args.prompts)
    
    print(f"\n✅ 图像生成完成！")
    print(f"   成功：{result.success_count}/{result.total_count}")
    print(f"   输出目录：{agent.output_dir}")
