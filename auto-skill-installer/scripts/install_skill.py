#!/usr/bin/env python3
"""
安装单个 ClawHub 技能（自动检查是否需要 API）
支持 slug 格式或完整 URL
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
import zipfile
import io
from pathlib import Path

CLAWHUB_API = "https://wry-manatee-359.convex.site/api/v1"
DEFAULT_OUTPUT = os.path.expanduser("~/.openclaw/extensions")

def get_script_dir():
    """获取脚本所在目录"""
    return os.path.dirname(os.path.abspath(__file__))

def get_skill_dir():
    """获取技能根目录"""
    return os.path.dirname(get_script_dir())

def load_api_check_config():
    """加载 API 检查配置"""
    config_file = os.path.join(get_skill_dir(), "references", "no_api_skills.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except:
            pass
    return {"whitelist": [], "blacklist": [], "description": {}}

def check_api_required(slug):
    """检查技能是否需要 API 密钥"""
    config = load_api_check_config()
    
    if slug in config.get("blacklist", []):
        description = config.get("description", {}).get(slug, "需要 API 密钥")
        return True, description
    
    if slug in config.get("whitelist", []):
        return False, "免 API 技能"
    
    # 未知技能，尝试获取信息
    return None, "未知技能，请手动确认"

def parse_slug(input_str):
    """解析技能标识符"""
    # 如果是 URL，提取 slug
    if input_str.startswith('http'):
        parts = input_str.rstrip('/').split('/')
        if len(parts) >= 2:
            return parts[-1]  # 返回最后一部分作为 slug
    
    # 直接是 slug 格式
    return input_str

def download_skill(slug, output_dir):
    """下载并安装技能"""
    download_url = f"{CLAWHUB_API}/download?slug={slug}"
    skill_dir = os.path.join(output_dir, slug)
    
    print(f"📥 正在下载 {slug}...")
    print(f"   来源: {download_url}")
    
    try:
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": "OpenClaw-Skill-Installer/1.0"}
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            zip_content = response.read()
            print(f"   下载完成: {len(zip_content)} bytes")
        
        # 检查是否是有效的 zip
        if not zip_content.startswith(b'PK'):
            print(f"   ❌ 下载的内容不是有效的 ZIP 文件")
            return False
        
        # 如果目录已存在，先备份
        if os.path.exists(skill_dir):
            backup_dir = f"{skill_dir}.backup"
            print(f"   备份现有版本到 {backup_dir}")
            if os.path.exists(backup_dir):
                import shutil
                shutil.rmtree(backup_dir)
            os.rename(skill_dir, backup_dir)
        
        # 解压 ZIP 文件
        os.makedirs(skill_dir, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            zf.extractall(skill_dir)
        
        # 列出安装的文件
        print(f"\n📁 安装内容:")
        for item in os.listdir(skill_dir):
            item_path = os.path.join(skill_dir, item)
            if os.path.isdir(item_path):
                print(f"   📂 {item}/")
            else:
                size = os.path.getsize(item_path)
                print(f"   📄 {item} ({size} bytes)")
        
        print(f"\n✅ {slug} 安装成功!")
        print(f"   位置: {skill_dir}")
        return True
        
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"❌ 技能未找到: {slug}")
            print(f"   请检查技能名称是否正确")
        elif e.code == 429:
            print(f"⏳ 遇到速率限制，请稍后再试")
        else:
            print(f"❌ 下载失败: HTTP {e.code}")
        return False
    except Exception as e:
        print(f"❌ 安装失败: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='安装单个 ClawHub 技能（自动检查 API）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s weather              # 安装 weather 技能
  %(prog)s tavily-search        # 提示需要 API
  %(prog)s tavily-search --force # 强制安装
  %(prog)s https://clawhub.ai/author/skill-name
        """
    )
    parser.add_argument('skill', help='技能标识符（如: weather）或完整 URL')
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT, 
                       help='输出目录')
    parser.add_argument('--force', action='store_true', 
                       help='强制安装，跳过 API 检查')
    parser.add_argument('--check-only', action='store_true', 
                       help='仅检查是否需要 API，不安装')
    
    args = parser.parse_args()
    
    # 解析技能标识符
    slug = parse_slug(args.skill)
    
    print(f"🎯 准备安装: {slug}\n")
    
    # 检查是否需要 API
    if not args.force:
        requires_api, reason = check_api_required(slug)
        
        if requires_api is True:
            print(f"⚠️  该技能需要 API 密钥")
            print(f"   原因: {reason}")
            print(f"\n💡 如需强制安装，使用 --force 参数")
            print(f"   或添加到白名单: ~/.openclaw/extensions/auto-skill-installer/references/no_api_skills.json")
            if args.check_only:
                sys.exit(0)
            else:
                sys.exit(1)
        elif requires_api is None:
            print(f"⚠️  未知技能，无法确认是否需要 API")
            print(f"   建议先访问 https://clawhub.ai 查看技能详情")
            if args.check_only:
                sys.exit(0)
        else:
            print(f"✅ 免 API 技能 - {reason}")
            if args.check_only:
                print(f"\n可以安全安装!")
                sys.exit(0)
    else:
        print(f"⚡ 强制模式 - 跳过 API 检查\n")
    
    # 确保输出目录存在
    os.makedirs(args.output, exist_ok=True)
    
    # 下载并安装
    if download_skill(slug, args.output):
        print("\n💡 下一步:")
        print("   1. 重启 Gateway: openclaw gateway restart")
        print("   2. 验证安装: openclaw status")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()