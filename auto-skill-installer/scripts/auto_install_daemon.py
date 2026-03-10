#!/usr/bin/env python3
"""
24 小时自动安装守护进程 - 持续安装模式
定期检查并安装新的免 API 热门技能
"""

import argparse
import json
import os
import sys
import time
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# 默认配置
DEFAULT_INTERVAL = 1  # 改为1小时，更频繁检查
DEFAULT_OUTPUT = os.path.expanduser("~/.openclaw/extensions")
DEFAULT_LOG_FILE = os.path.expanduser("~/.openclaw/logs/auto-skill-installer.log")
PID_FILE = os.path.expanduser("~/.openclaw/auto-skill-installer.pid")

def get_script_dir():
    """获取脚本所在目录"""
    return os.path.dirname(os.path.abspath(__file__))

def get_skill_dir():
    """获取技能根目录"""
    return os.path.dirname(get_script_dir())

def log_message(message, log_file=None):
    """记录日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}"
    print(log_line)
    
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_line + '\n')

def load_install_log(skill_dir):
    """加载安装日志"""
    log_file = os.path.join(skill_dir, "references", "install_log.json")
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"last_check": None, "installed": [], "skipped": [], "total_installed": 0}

def save_install_log(skill_dir, log_data):
    """保存安装日志"""
    log_file = os.path.join(skill_dir, "references", "install_log.json")
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)

def run_install_script(output_dir, count=20):
    """运行安装脚本 - 持续安装模式，安装更多技能"""
    script_path = os.path.join(get_script_dir(), "install_top_skills.py")
    
    try:
        result = subprocess.run(
            [sys.executable, script_path, "--count", str(count), "--output", output_dir],
            capture_output=True,
            text=True,
            timeout=600  # 增加超时时间
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_and_install(output_dir, log_file, skill_dir):
    """检查并安装技能"""
    log_message("🔍 开始检查新技能...", log_file)
    
    # 运行安装脚本 - 每次安装20个
    success, stdout, stderr = run_install_script(output_dir, count=20)
    
    if success:
        log_message("✅ 检查完成", log_file)
        # 解析输出获取安装统计
        if "新安装:" in stdout:
            try:
                import re
                match = re.search(r'新安装:\s*(\d+)', stdout)
                if match:
                    installed_count = int(match.group(1))
                    log_message(f"📦 本次安装: {installed_count} 个技能", log_file)
                    
                    # 更新总安装数
                    install_log = load_install_log(skill_dir)
                    total = install_log.get("total_installed", 0) + installed_count
                    install_log["total_installed"] = total
                    save_install_log(skill_dir, install_log)
                    log_message(f"📊 累计安装: {total} 个技能", log_file)
            except:
                pass
    else:
        log_message(f"❌ 检查失败: {stderr}", log_file)
    
    # 更新安装日志
    install_log = load_install_log(skill_dir)
    install_log["last_check"] = datetime.now().isoformat()
    save_install_log(skill_dir, install_log)
    
    return success

def write_pid_file():
    """写入 PID 文件"""
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))

def remove_pid_file():
    """删除 PID 文件"""
    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)

def is_already_running():
    """检查是否已有实例在运行"""
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            # 检查进程是否存在
            os.kill(pid, 0)
            return True
        except (ValueError, OSError, ProcessLookupError):
            # PID 文件存在但进程不存在
            remove_pid_file()
    return False

def daemon_loop(interval_hours, output_dir, log_file):
    """守护进程主循环 - 持续安装模式"""
    skill_dir = get_skill_dir()
    interval_seconds = interval_hours * 3600
    
    log_message("=" * 60, log_file)
    log_message("🚀 自动技能安装守护进程启动 [持续安装模式]", log_file)
    log_message(f"⏰ 检查间隔: {interval_hours} 小时", log_file)
    log_message(f"📦 每次安装: 20 个技能", log_file)
    log_message(f"📁 安装目录: {output_dir}", log_file)
    log_message(f"📝 日志文件: {log_file}", log_file)
    log_message("=" * 60, log_file)
    
    # 首次立即执行一次
    check_and_install(output_dir, log_file, skill_dir)
    
    iteration = 1
    while True:
        next_run = datetime.now() + timedelta(hours=interval_hours)
        log_message("", log_file)
        log_message(f"🔄 第 {iteration} 轮安装完成", log_file)
        log_message(f"⏳ 下次检查: {next_run.strftime('%Y-%m-%d %H:%M:%S')}", log_file)
        log_message("=" * 60, log_file)
        
        # 等待到下次检查
        time.sleep(interval_seconds)
        
        # 执行检查
        check_and_install(output_dir, log_file, skill_dir)
        iteration += 1

def main():
    parser = argparse.ArgumentParser(
        description='24 小时自动安装免 API 技能守护进程 - 持续安装模式',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s                    # 默认每1小时检查，每次安装20个
  %(prog)s --interval 0.5     # 每30分钟检查一次
  %(prog)s --daemon           # 后台模式运行
  %(prog)s --stop             # 停止守护进程
        """
    )
    parser.add_argument('--interval', type=float, default=DEFAULT_INTERVAL,
                       help=f'检查间隔小时数（默认 {DEFAULT_INTERVAL}，建议0.5-2）')
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT,
                       help='技能安装目录')
    parser.add_argument('--log', type=str, default=DEFAULT_LOG_FILE,
                       help='日志文件路径')
    parser.add_argument('--daemon', action='store_true',
                       help='后台模式运行')
    parser.add_argument('--stop', action='store_true',
                       help='停止守护进程')
    
    args = parser.parse_args()
    
    # 停止命令
    if args.stop:
        if is_already_running():
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 15)  # SIGTERM
                remove_pid_file()
                print(f"✅ 已停止守护进程 (PID: {pid})")
            except:
                print("❌ 停止失败")
        else:
            print("ℹ️  守护进程未在运行")
        return
    
    # 检查是否已在运行
    if is_already_running():
        print("⚠️  守护进程已在运行")
        print(f"   PID 文件: {PID_FILE}")
        return
    
    # 确保目录存在
    os.makedirs(args.output, exist_ok=True)
    os.makedirs(os.path.dirname(args.log), exist_ok=True)
    
    # 后台模式
    if args.daemon:
        try:
            pid = os.fork()
            if pid > 0:
                # 父进程退出
                print(f"✅ 守护进程已启动 (PID: {pid})")
                print(f"📝 日志: {args.log}")
                print(f"⏰ 每 {args.interval} 小时自动安装 20 个技能")
                sys.exit(0)
        except OSError as e:
            print(f"❌ Fork 失败: {e}")
            sys.exit(1)
        
        # 子进程
        os.chdir('/')
        os.setsid()
        os.umask(0)
        
        try:
            pid = os.fork()
            if pid > 0:
                sys.exit(0)
        except OSError as e:
            sys.exit(1)
        
        # 重定向标准输入输出
        sys.stdout.flush()
        sys.stderr.flush()
        si = open('/dev/null', 'r')
        so = open(args.log, 'a+')
        se = open(args.log, 'a+')
        os.dup2(si.fileno(), sys.stdin.fileno())
        os.dup2(so.fileno(), sys.stdout.fileno())
        os.dup2(se.fileno(), sys.stderr.fileno())
    
    # 写入 PID 文件
    write_pid_file()
    
    try:
        # 启动主循环
        daemon_loop(args.interval, args.output, args.log)
    except KeyboardInterrupt:
        log_message("\n🛑 收到中断信号，正在停止...", args.log)
    finally:
        remove_pid_file()
        log_message("👋 守护进程已停止", args.log)

if __name__ == "__main__":
    main()