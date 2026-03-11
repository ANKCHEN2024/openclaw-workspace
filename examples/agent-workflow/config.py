"""
Agent Workflow 配置文件
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    """全局配置"""
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SPARKI_API_KEY: str = os.getenv("SPARKI_API_KEY", "")
    
    # Subagent 配置
    MAX_SUBAGENTS: int = 5  # 最大并行 subagent 数量
    SUBAGENT_TIMEOUT: int = 600  # subagent 超时时间（秒）
    MAX_RETRIES: int = 3  # 最大重试次数
    
    # 输出目录
    OUTPUT_DIR: str = "./outputs"
    SCRIPTS_DIR: str = "./outputs/scripts"
    IMAGES_DIR: str = "./outputs/images"
    VIDEOS_DIR: str = "./outputs/videos"
    
    # LLM 配置
    LLM_MODEL: str = "qwen-plus"
    LLM_TEMPERATURE: float = 0.7
    
    # 图像生成配置
    IMAGE_MODEL: str = "dall-e-3"
    IMAGE_SIZE: str = "1024x1024"
    
    # 视频配置
    VIDEO_FPS: int = 30
    VIDEO_DURATION: int = 60  # 秒
    
    def __post_init__(self):
        """初始化后检查"""
        import os
        os.makedirs(self.OUTPUT_DIR, exist_ok=True)
        os.makedirs(self.SCRIPTS_DIR, exist_ok=True)
        os.makedirs(self.IMAGES_DIR, exist_ok=True)
        os.makedirs(self.VIDEOS_DIR, exist_ok=True)

# 全局配置实例
config = Config()
