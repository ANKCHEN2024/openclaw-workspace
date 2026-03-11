"""
教程视频工作流

演示：技术教程类视频生成
"""

import os
from typing import List, Optional

from subagents.script_writer import ScriptWriterSubagent
from subagents.image_generator import ImageGeneratorSubagent
from subagents.video_editor import VideoEditorSubagent
from config import config

class TutorialVideoWorkflow:
    """教程视频工作流"""
    
    def __init__(self, config=None):
        self.config = config or config
        self.script_agent = ScriptWriterSubagent(self.config)
        self.image_agent = ImageGeneratorSubagent(self.config)
        self.video_agent = VideoEditorSubagent(self.config)
    
    def run(
        self,
        topic: str,
        steps: List[str],
        difficulty: str = "beginner"
    ) -> dict:
        """
        执行教程视频工作流
        
        Args:
            topic: 教程主题
            steps: 步骤列表
            difficulty: 难度级别
        
        Returns:
            dict: 工作流结果
        """
        print("=" * 60)
        print(f"📚 教程视频工作流")
        print(f"   主题：{topic}")
        print(f"   步骤：{len(steps)} 步")
        print(f"   难度：{difficulty}")
        print("=" * 60)
        
        # Step 1: 生成教程脚本
        print("\n[Step 1/3] 生成教程脚本...")
        script_result = self._create_tutorial_script(topic, steps, difficulty)
        print(f"✅ 脚本完成：{len(script_result.segments)} 个场景")
        
        # Step 2: 生成截图/示意图
        print("\n[Step 2/3] 生成教程配图...")
        image_result = self.image_agent.run(
            script_result=script_result,
            topic=f"{topic}_tutorial"
        )
        print(f"✅ 配图完成：{image_result.success_count} 张")
        
        # Step 3: 合成视频
        print("\n[Step 3/3] 合成教程视频...")
        image_paths = [img.image_path for img in image_result.images if img.status == "complete"]
        video_result = self.video_agent.run(
            images=image_paths,
            audio_path=script_result.audio_path,
            topic=f"{topic}_tutorial"
        )
        print(f"✅ 视频完成：{video_result.video_path}")
        
        return {
            "script": script_result,
            "images": image_result,
            "video": video_result,
            "status": "success"
        }
    
    def _create_tutorial_script(
        self,
        topic: str,
        steps: List[str],
        difficulty: str
    ):
        """创建教程脚本"""
        # 根据难度调整语速和详细程度
        if difficulty == "beginner":
            style = "tutorial"
            detail_level = "high"
        elif difficulty == "intermediate":
            style = "tutorial"
            detail_level = "medium"
        else:
            style = "tutorial"
            detail_level = "low"
        
        return self.script_agent.run(topic=topic, style=style)
    
    def run_with_screenshots(
        self,
        topic: str,
        screenshot_paths: List[str],
        narration_script: str
    ) -> dict:
        """
        使用真实截图的工作流
        
        Args:
            topic: 主题
            screenshot_paths: 实际截图路径
            narration_script: 配音脚本
        """
        print("=" * 60)
        print(f"📸 截图教程工作流：{topic}")
        print("=" * 60)
        
        # Step 1: 生成配音
        print("\n[Step 1/2] 生成配音...")
        audio_path = self.script_agent._generate_audio(narration_script, topic)
        print(f"✅ 配音完成：{audio_path}")
        
        # Step 2: 合成视频
        print("\n[Step 2/2] 合成视频...")
        video_result = self.video_agent.run(
            images=screenshot_paths,
            audio_path=audio_path,
            topic=f"{topic}_screenshot"
        )
        print(f"✅ 视频完成：{video_result.video_path}")
        
        return {
            "audio": audio_path,
            "video": video_result,
            "status": "success"
        }


# 命令行入口
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="教程视频工作流")
    parser.add_argument("--topic", required=True, help="教程主题")
    parser.add_argument("--steps", nargs='*', help="步骤列表")
    parser.add_argument("--difficulty", default="beginner", help="难度级别")
    
    args = parser.parse_args()
    
    workflow = TutorialVideoWorkflow(config)
    results = workflow.run(
        topic=args.topic,
        steps=args.steps or ["步骤 1", "步骤 2", "步骤 3"],
        difficulty=args.difficulty
    )
    
    print(f"\n✅ 教程视频生成完成！")
