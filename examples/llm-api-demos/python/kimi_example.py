#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kimi (月之暗面) API 调用示例
文档：https://platform.moonshot.cn/docs/api/chat
"""

import os
import requests
import json

# 从环境变量获取 API Key
API_KEY = os.getenv("MOONSHOT_API_KEY", "your-api-key-here")
BASE_URL = "https://api.moonshot.cn/v1/chat/completions"

def call_kimi(messages, model="moonshot-v1-8k", temperature=0.7):
    """
    调用 Kimi API
    
    Args:
        messages: 对话消息列表
        model: 模型名称 (moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k)
        temperature: 温度参数 (0-2)
    
    Returns:
        API 响应内容
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 2048
    }
    
    response = requests.post(BASE_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    return response.json()

def test_text_generation():
    """测试文本生成能力"""
    print("=" * 60)
    print("测试 1: 文本生成能力")
    print("=" * 60)
    
    messages = [
        {"role": "user", "content": "请用 100 字介绍人工智能的发展趋势"}
    ]
    
    result = call_kimi(messages, model="moonshot-v1-8k")
    content = result["choices"][0]["message"]["content"]
    
    print(f"响应：{content}")
    print(f"Token 使用：输入{result['usage']['prompt_tokens']}, 输出{result['usage']['completion_tokens']}")
    print()

def test_conversation():
    """测试多轮对话能力"""
    print("=" * 60)
    print("测试 2: 多轮对话能力")
    print("=" * 60)
    
    messages = [
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "你好，我想学习 Python"},
        {"role": "assistant", "content": "太好了！Python 是一门非常友好的编程语言。你想从哪些方面开始学习呢？"},
        {"role": "user", "content": "推荐一个适合初学者的项目"}
    ]
    
    result = call_kimi(messages, model="moonshot-v1-8k")
    content = result["choices"][0]["message"]["content"]
    
    print(f"响应：{content}")
    print()

def test_code_generation():
    """测试代码生成能力"""
    print("=" * 60)
    print("测试 3: 代码生成能力")
    print("=" * 60)
    
    messages = [
        {"role": "user", "content": "用 Python 写一个快速排序函数，包含详细注释"}
    ]
    
    result = call_kimi(messages, model="moonshot-v1-8k")
    content = result["choices"][0]["message"]["content"]
    
    print(f"生成的代码:\n{content}")
    print()

def test_long_context():
    """测试长文本处理能力（Kimi 优势）"""
    print("=" * 60)
    print("测试 4: 长文本处理能力")
    print("=" * 60)
    
    # 生成一个长文本
    long_text = "这是一篇测试文章。" * 1000
    messages = [
        {"role": "user", "content": f"请总结以下内容：\n\n{long_text}"}
    ]
    
    result = call_kimi(messages, model="moonshot-v1-32k")
    content = result["choices"][0]["message"]["content"]
    
    print(f"总结：{content}")
    print(f"Token 使用：输入{result['usage']['prompt_tokens']}, 输出{result['usage']['completion_tokens']}")
    print()

def main():
    """主函数"""
    print("\n🚀 Kimi API 调用示例\n")
    
    try:
        test_text_generation()
        test_conversation()
        test_code_generation()
        test_long_context()
        print("✅ 所有测试完成!")
    except Exception as e:
        print(f"❌ 错误：{e}")
        print("请确保设置了 MOONSHOT_API_KEY 环境变量")

if __name__ == "__main__":
    main()
