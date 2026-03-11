# Agent Workflow Demo

> 演示：写脚本 → 生成图 → 剪视频 的完整 Agent 协作流程

## 项目结构

```
examples/agent-workflow/
├── README.md              # 本文件
├── main_agent.py          # 主 Agent 协调器
├── subagents/
│   ├── script_writer.py   # 脚本写作 Subagent
│   ├── image_generator.py # 图像生成 Subagent
│   └── video_editor.py    # 视频编辑 Subagent
├── workflows/
│   ├── product_video.py   # 产品介绍视频工作流
│   └── tutorial_video.py  # 教程视频工作流
├── outputs/               # 生成结果目录
│   ├── scripts/
│   ├── images/
│   └── videos/
└── config.py              # 配置文件
```

## 快速开始

### 1. 配置环境

```bash
# 安装依赖
pip install -r requirements.txt

# 配置 API Keys
export OPENAI_API_KEY="your-key"
export SPARKI_API_KEY="your-sparki-key"  # 视频编辑
```

### 2. 运行 Demo

```bash
# 运行完整工作流
python workflows/product_video.py --topic "AI 数字孪生平台"

# 或单独运行某个 subagent
python subagents/script_writer.py --topic "产品介绍"
```

### 3. 查看结果

生成结果保存在 `outputs/` 目录：
- `outputs/scripts/` - 生成的脚本
- `outputs/images/` - 生成的图像
- `outputs/videos/` - 最终视频

---

## 核心概念演示

### Subagent Spawn 模式

```python
# main_agent.py
from subagents import script_writer, image_generator, video_editor

def create_product_video(topic: str):
    # 1. 拆解任务
    tasks = [
        {"agent": "script_writer", "params": {"topic": topic}},
        {"agent": "image_generator", "params": {"script": "..."}},
        {"agent": "video_editor", "params": {"images": [...], "audio": "..."}},
    ]
    
    # 2. 并行执行（前两个任务可并行）
    script_result = script_writer.run(topic=topic)
    images_result = image_generator.run(script=script_result)
    
    # 3. 串行执行（视频编辑依赖前两步）
    video_result = video_editor.run(images=images_result, audio=script_result.audio)
    
    return video_result
```

### Push-based 结果汇报

```python
# subagents/script_writer.py
class ScriptWriterSubagent:
    def run(self, topic: str) -> ScriptResult:
        # 自主执行，不汇报中间状态
        outline = self.create_outline(topic)
        script = self.write_full_script(outline)
        audio = self.generate_audio(script)
        
        # 完成后一次性汇报
        return ScriptResult(
            script=script,
            audio=audio,
            status="complete"
        )
```

---

## 扩展工作流

添加新工作流只需：
1. 在 `subagents/` 创建新的 subagent
2. 在 `workflows/` 定义编排逻辑
3. 在 `main_agent.py` 注册

---

## 性能优化

- **并行度**：独立任务并行执行
- **缓存**：相同输入复用结果
- **超时控制**：避免单任务卡死
- **错误重试**：自动重试失败任务

---

_更多示例参考 `workflows/` 目录_
