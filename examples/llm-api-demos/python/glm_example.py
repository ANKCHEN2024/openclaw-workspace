#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GLM (智谱 AI) API 调用示例
文档：https://open.bigmodel.cn/dev/api
"""

import os
import requests
import json
import time
import hashlib
import hmac

# 从环境变量获取 API Key
API_KEY = os.getenv("ZHIPU_API_KEY", "your-api-key-here")
BASE_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

def generate_token(api_key, expiration_seconds=3600):
    """
    生成智谱 AI 的访问令牌（需要签名）
    
    Args:
        api_key: API Key 格式为 "id.secret"
        expiration_seconds: 令牌过期时间（秒）
    
    Returns:
        访问令牌
    """
    id, secret = api_key.split(".")
    timestamp = int(time.time() * 1000)
    exp = timestamp + expiration_seconds * 1000
    
    # 构建 payload
    payload = {
        "api_key": id,
        "exp": exp,
        "timestamp": timestamp
    }
    
    # 生成签名
    payload_str = json.dumps(payload, separators=(',', ':'))
    signature = hmac.new(
        secret.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload_str}.{signature}"

def call_glm(messages, model="glm-4", temperature=0.7):
    """
    调用 GLM API
    
    Args:
        messages: 对话消息列表
        model: 模型名称 (glm-4, glm-4-air, glm-4-airx, glm-4-flash)
        temperature: 温度参数 (0-2)
    
    Returns:
        API 响应内容
    """
    # 生成访问令牌
    token = generate_token(API_KEY)
    
    headers = {
        "Authorization": f"Bearer {token}",
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
    
    result = call_glm(messages, model="glm-4")
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
    
    result = call_glm(messages, model="glm-4")
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
    
    result = call_glm(messages, model="glm-4")
    content = result["choices"][0]["message"]["content"]
    
    print(f"生成的代码:\n{content}")
    print()

def main():
    """主函数"""
    print("\n🚀 GLM API 调用示例\n")
    
    try:
        test_text_generation()
        test_conversation()
        test_code_generation()
        print("✅ 所有测试完成!")
    except Exception as e:
        print(f"❌ 错误：{e}")
        print("请确保设置了 ZHIPU_API_KEY 环境变量（格式：id.secret）")

if __name__ == "__main__":
    main()
