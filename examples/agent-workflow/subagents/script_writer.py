"""
脚本写作 Subagent

职责：根据主题生成视频脚本和配音音频
"""

import os
import json
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

@dataclass
class ScriptSegment:
    """脚本片段"""
    scene_number: int
    description: str  # 画面描述
    narration: str    # 配音文案
    duration: int     # 时长（秒）
    visual_prompt: str  # AI 绘图提示词

@dataclass
class ScriptResult:
    """脚本生成结果"""
    topic: str
    title: str
    segments: List[ScriptSegment]
    total_duration: int
    full_script: str
    audio_path: Optional[str] = None
    status: str = "complete"

class ScriptWriterSubagent:
    """脚本写作 Subagent"""
    
    def __init__(self, config=None):
        self.config = config
        self.output_dir = config.SCRIPTS_DIR if config else "./outputs/scripts"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run(self, topic: str, style: str = "product_intro") -> ScriptResult:
        """
        执行脚本生成任务
        
        Args:
            topic: 视频主题
            style: 风格 (product_intro/tutorial/promo)
        
        Returns:
            ScriptResult: 生成的脚本
        """
        print(f"[ScriptWriter] 开始生成脚本：{topic}")
        
        # 1. 生成大纲
        outline = self._create_outline(topic, style)
        print(f"[ScriptWriter] 大纲完成：{len(outline)} 个场景")
        
        # 2. 生成详细脚本
        segments = self._write_segments(outline, topic)
        print(f"[ScriptWriter] 详细脚本完成：{len(segments)} 个片段")
        
        # 3. 生成完整脚本
        full_script = self._compile_script(segments)
        
        # 4. 生成配音（模拟）
        audio_path = self._generate_audio(full_script, topic)
        
        # 5. 保存结果
        result = ScriptResult(
            topic=topic,
            title=f"{topic} - {style}",
            segments=segments,
            total_duration=sum(s.duration for s in segments),
            full_script=full_script,
            audio_path=audio_path,
            status="complete"
        )
        
        self._save_result(result, topic)
        print(f"[ScriptWriter] 完成！总时长：{result.total_duration}秒")
        
        return result
    
    def _create_outline(self, topic: str, style: str) -> List[dict]:
        """创建视频大纲"""
        # 实际实现会调用 LLM
        # 这里提供模板示例
        
        if style == "product_intro":
            return [
                {"scene": 1, "type": "hook", "content": "吸引注意力的开场"},
                {"scene": 2, "type": "problem", "content": "痛点描述"},
                {"scene": 3, "type": "solution", "content": "产品介绍"},
                {"scene": 4, "type": "features", "content": "核心功能"},
                {"scene": 5, "type": "benefits", "content": "用户收益"},
                {"scene": 6, "type": "cta", "content": "行动号召"},
            ]
        elif style == "tutorial":
            return [
                {"scene": 1, "type": "intro", "content": "教程介绍"},
                {"scene": 2, "type": "prerequisites", "content": "前置条件"},
                {"scene": 3, "type": "step1", "content": "步骤 1"},
                {"scene": 4, "type": "step2", "content": "步骤 2"},
                {"scene": 5, "type": "step3", "content": "步骤 3"},
                {"scene": 6, "type": "summary", "content": "总结"},
            ]
        else:
            return [
                {"scene": i, "type": "general", "content": f"场景{i}"}
                for i in range(1, 7)
            ]
    
    def _write_segments(self, outline: List[dict], topic: str) -> List[ScriptSegment]:
        """编写详细片段"""
        segments = []
        
        for i, scene in enumerate(outline, 1):
            segment = ScriptSegment(
                scene_number=i,
                description=f"[画面] {scene['content']} - {topic}",
                narration=f"[配音] 这里是关于{topic}的{scene['content']}介绍...",
                duration=10,
                visual_prompt=f"Professional video frame showing {topic}, {scene['content']}, high quality, 4k"
            )
            segments.append(segment)
        
        return segments
    
    def _compile_script(self, segments: List[ScriptSegment]) -> str:
        """编译完整脚本"""
        lines = []
        for seg in segments:
            lines.append(f"=== 场景 {seg.scene_number} ===")
            lines.append(f"画面：{seg.description}")
            lines.append(f"配音：{seg.narration}")
            lines.append(f"时长：{seg.duration}秒")
            lines.append("")
        
        return "\n".join(lines)
    
    def _generate_audio(self, script: str, topic: str) -> str:
        """生成配音音频（模拟）"""
        # 实际实现会调用 TTS API
        audio_path = os.path.join(self.output_dir, f"{topic}_audio.mp3")
        
        # 创建占位文件
        Path(audio_path).touch()
        
        return audio_path
    
    def _save_result(self, result: ScriptResult, topic: str):
        """保存结果"""
        # 保存脚本
        script_path = os.path.join(self.output_dir, f"{topic}_script.txt")
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(result.full_script)
        
        # 保存结构化数据
        json_path = os.path.join(self.output_dir, f"{topic}_script.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "topic": result.topic,
                "title": result.title,
                "total_duration": result.total_duration,
                "segments": [
                    {
                        "scene_number": s.scene_number,
                        "description": s.description,
                        "narration": s.narration,
                        "duration": s.duration,
                        "visual_prompt": s.visual_prompt
                    }
                    for s in result.segments
                ]
            }, f, ensure_ascii=False, indent=2)
        
        print(f"[ScriptWriter] 已保存：{script_path}")


# 命令行入口
if __name__ == "__main__":
    import argparse
    from config import config
    
    parser = argparse.ArgumentParser(description="脚本生成 Subagent")
    parser.add_argument("--topic", required=True, help="视频主题")
    parser.add_argument("--style", default="product_intro", help="脚本风格")
    
    args = parser.parse_args()
    
    agent = ScriptWriterSubagent(config)
    result = agent.run(args.topic, args.style)
    
    print(f"\n✅ 脚本生成完成！")
    print(f"   标题：{result.title}")
    print(f"   时长：{result.total_duration}秒")
    print(f"   场景：{len(result.segments)}个")
