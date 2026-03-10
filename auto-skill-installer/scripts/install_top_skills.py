#!/usr/bin/env python3
"""
自动安装 ClawHub 上最受欢迎的免 API 技能
过滤掉需要 API 密钥的技能
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
import zipfile
import io

# 默认免 API 技能白名单
DEFAULT_WHITELIST = [
    "self-improving-agent",
    "skill-creator", 
    "weather",
    "summarize",
    "agent-browser",
    "github",
    "proactive-agent",
    "sonoscli",
    "obsidian",
    "nano-pdf",
    "humanizer",
    "openai-whisper",
    "youtube-transcript",
    "brave-search",
    "auto-updater",
    "byte-rover",
    "mcporter",
    "openclaw-youtube-transcript",
]

# 已知需要 API 的技能黑名单
DEFAULT_BLACKLIST = [
    "tavily-search",      # 需要 TAVILY_API_KEY
    "gog",                # 需要 Google OAuth
    "notion",             # 需要 NOTION_API_KEY
    "nano-banana-pro",    # 需要 API key
    "api-gateway",        # 需要各种 API 密钥
    "find-skills",        # 需要配合其他工具
    "free-ride",          # 需要 OpenRouter
    "aisa-search",        # 需要 API
]

CLAWHUB_API = "https://wry-manatee-359.convex.site/api/v1"
DEFAULT_OUTPUT = os.path.expanduser("~/.openclaw/extensions")

def load_whitelist(skill_dir):
    """加载白名单配置"""
    config_file = os.path.join(skill_dir, "references", "no_api_skills.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                return config.get("whitelist", DEFAULT_WHITELIST)
        except:
            pass
    return DEFAULT_WHITELIST

def load_blacklist(skill_dir):
    """加载黑名单配置"""
    config_file = os.path.join(skill_dir, "references", "no_api_skills.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                return config.get("blacklist", DEFAULT_BLACKLIST)
        except:
            pass
    return DEFAULT_BLACKLIST

def is_no_api_skill(slug, whitelist, blacklist):
    """检查技能是否在免 API 白名单中"""
    if slug in blacklist:
        return False, "在黑名单中（需要 API 密钥）"
    if slug in whitelist:
        return True, "在白名单中"
    # 默认情况下，未知技能视为需要 API（安全起见）
    return False, "未知技能，默认跳过（可能需 API）"

def download_skill(slug, output_dir):
    """下载并安装单个技能"""
    download_url = f"{CLAWHUB_API}/download?slug={slug}"
    skill_dir = os.path.join(output_dir, slug)
    
    # 检查是否已安装
    if os.path.exists(skill_dir) and os.listdir(skill_dir):
        return "skipped", "已安装"
    
    try:
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": "OpenClaw-Skill-Installer/1.0"}
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            zip_content = response.read()
        
        # 检查是否是有效的 zip
        if not zip_content.startswith(b'PK'):
            return "failed", "下载内容不是有效的 ZIP 文件"
        
        # 解压 ZIP 文件
        os.makedirs(skill_dir, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            zf.extractall(skill_dir)
            
        return "success", "安装成功"
        
    except urllib.error.HTTPError as e:
        if e.code == 429:
            time.sleep(5)
            return download_skill(slug, output_dir)
        return "failed", f"HTTP {e.code}"
    except Exception as e:
        return "failed", str(e)

def main():
    parser = argparse.ArgumentParser(
        description='自动安装 ClawHub 热门免 API 技能',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s                    # 安装前 10 个免 API 技能
  %(prog)s --count 20         # 安装前 20 个
  %(prog)s --dry-run          # 模拟运行
  %(prog)s --include-api      # 包含需要 API 的技能
        """
    )
    parser.add_argument('--count', type=int, default=10, 
                       help='要安装的技能数量（默认 10）')
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT, 
                       help='输出目录')
    parser.add_argument('--dry-run', action='store_true', 
                       help='模拟运行，不实际安装')
    parser.add_argument('--include-api', action='store_true', 
                       help='包含需要 API 的技能（默认排除）')
    
    args = parser.parse_args()
    
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    skill_dir = os.path.dirname(script_dir)
    
    # 加载白名单和黑名单
    whitelist = load_whitelist(skill_dir)
    blacklist = load_blacklist(skill_dir)
    
    # 如果指定了 --include-api，则使用白名单 + 黑名单的所有技能
    if args.include_api:
        target_skills = whitelist + [s for s in blacklist if s not in whitelist]
    else:
        target_skills = whitelist
    
    print("🎯 自动技能安装器（免 API 版本）")
    print("=" * 50)
    print(f"📦 目标技能数: {min(args.count, len(target_skills))}")
    print(f"🔍 白名单技能: {len(whitelist)} 个")
    print(f"🚫 黑名单技能: {len(blacklist)} 个")
    print(f"📁 安装目录: {args.output}")
    print("=" * 50)
    print()
    
    # 确保输出目录存在
    os.makedirs(args.output, exist_ok=True)
    
    # 安装统计
    installed = 0
    skipped = 0
    failed = 0
    filtered = 0
    
    skills_to_install = target_skills[:args.count]
    
    for i, slug in enumerate(skills_to_install, 1):
        print(f"[{i}/{len(skills_to_install)}] {slug}")
        
        # 检查是否在免 API 列表中
        if not args.include_api:
            is_no_api, reason = is_no_api_skill(slug, whitelist, blacklist)
            if not is_no_api:
                print(f"   ⏭️  跳过 - {reason}")
                filtered += 1
                print()
                continue
        
        # 检查是否已安装
        skill_dir_path = os.path.join(args.output, slug)
        if os.path.exists(skill_dir_path) and os.listdir(skill_dir_path):
            print(f"   ⏭️  已安装")
            skipped += 1
            print()
            continue
        
        if args.dry_run:
            print(f"   📝 [模拟] 将安装到 {skill_dir_path}")
            print()
            continue
        
        # 下载安装
        status, msg = download_skill(slug, args.output)
        
        if status == "success":
            print(f"   ✅ {msg}")
            installed += 1
        elif status == "skipped":
            print(f"   ⏭️  {msg}")
            skipped += 1
        else:
            print(f"   ❌ {msg}")
            failed += 1
        
        # 间隔避免速率限制
        if i < len(skills_to_install):
            time.sleep(1)
        print()
    
    # 打印总结
    print("=" * 50)
    print("📊 安装总结")
    print("=" * 50)
    print(f"✅ 新安装: {installed}")
    print(f"⏭️  已存在: {skipped}")
    print(f"🚫 过滤(需API): {filtered}")
    print(f"❌ 失败: {failed}")
    print(f"📁 安装位置: {args.output}")
    print()
    
    if installed > 0:
        print("💡 重启 Gateway 以启用新技能:")
        print("   openclaw gateway restart")
    
    if filtered > 0 and not args.include_api:
        print()
        print("💡 如需安装需要 API 的技能，使用 --include-api 参数")

if __name__ == "__main__":
    main()