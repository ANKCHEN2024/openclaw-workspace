#!/bin/bash
# 飞书消息测试脚本

# 获取飞书应用配置
FEISHU_APP_ID=$(cat ~/.openclaw/config.json 2>/dev/null | grep -o '"appId"[^,]*' | cut -d'"' -f4)
FEISHU_APP_SECRET=$(cat ~/.openclaw/config.json 2>/dev/null | grep -o '"appSecret"[^,]*' | cut -d'"' -f4)

echo "飞书 App ID: $FEISHU_APP_ID"
echo "飞书 App Secret: ${FEISHU_APP_SECRET:0:10}..."

# 提示用户检查
echo ""
echo "请检查："
echo "1. 飞书开放平台 → 应用管理 → 权限管理 → im:message 已启用"
echo "2. 飞书开放平台 → 应用管理 → 版本管理 → 已发布"
echo "3. 在飞书中搜索机器人名称，先发送一条消息给机器人"
