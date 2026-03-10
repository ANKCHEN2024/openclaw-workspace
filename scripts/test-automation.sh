#!/bin/bash
# test-automation.sh - 测试自动化脚本是否正常工作

echo "🧪 测试自动化脚本..."
echo ""

WORKSPACE="/Users/chenggl/workspace"
cd "$WORKSPACE"

# 测试 1：检查核心文件
echo "测试 1: 检查核心文件..."
for file in WORK_PRINCIPLES.md AGENTS.md SOUL.md IDENTITY.md USER.md; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
    fi
done

# 测试 2：检查目录
echo ""
echo "测试 2: 检查目录..."
for dir in decisions training logs scripts memory; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ (缺失)"
    fi
done

# 测试 3：检查项目文档引用
echo ""
echo "测试 3: 检查项目文档引用..."
for doc in ai-drama-platform/DEVELOPMENT_TASK.md short-video-platform/PROJECT_SUMMARY.md; do
    if [ -f "$doc" ] && grep -q "WORK_PRINCIPLES.md" "$doc" 2>/dev/null; then
        echo "  ✅ $doc (已引用)"
    else
        echo "  ⚠️  $doc (缺少引用)"
    fi
done

# 测试 4：检查 AGENTS.md 必读清单
echo ""
echo "测试 4: 检查 AGENTS.md 必读清单..."
if grep -q "WORK_PRINCIPLES.md" AGENTS.md; then
    echo "  ✅ WORK_PRINCIPLES.md 在必读清单中"
else
    echo "  ❌ WORK_PRINCIPLES.md 不在必读清单中"
fi

if grep -q "IDENTITY.md" AGENTS.md; then
    echo "  ✅ IDENTITY.md 在必读清单中"
else
    echo "  ❌ IDENTITY.md 不在必读清单中"
fi

# 测试 5：检查 HEARTBEAT.md
echo ""
echo "测试 5: 检查 HEARTBEAT.md..."
if [ -s "HEARTBEAT.md" ] && grep -q "文档关联维护" "HEARTBEAT.md" 2>/dev/null; then
    echo "  ✅ HEARTBEAT.md 已配置文档维护任务"
else
    echo "  ⚠️  HEARTBEAT.md 缺少文档维护任务"
fi

# 测试 6：检查 launchd 配置
echo ""
echo "测试 6: 检查 launchd 配置..."
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
for plist in com.openclaw.docs-sync.plist com.openclaw.docs-fix.plist com.openclaw.weekly-report.plist com.openclaw.skill-healthcheck.plist com.openclaw.skill-install.plist; do
    if [ -f "$LAUNCHD_DIR/$plist" ]; then
        echo "  ✅ $plist (已安装)"
    else
        echo "  ⚠️  $plist (未安装)"
    fi
done

# 测试 7：检查技能配置
echo ""
echo "测试 7: 检查技能配置..."
if [ -f "$WORKSPACE/skills/skills-config.json" ]; then
    echo "  ✅ skills-config.json (已配置)"
else
    echo "  ❌ skills-config.json (缺失)"
fi

# 测试 8：检查技能脚本
echo ""
echo "测试 8: 检查技能脚本..."
for script in skill-install.sh skill-activate.sh skill-repair.sh skill-healthcheck.sh; do
    if [ -x "$WORKSPACE/scripts/$script" ]; then
        echo "  ✅ $script (可执行)"
    elif [ -f "$WORKSPACE/scripts/$script" ]; then
        echo "  ⚠️  $script (缺少执行权限)"
    else
        echo "  ❌ $script (缺失)"
    fi
done

echo ""
echo "================================"
echo "🧪 测试完成 - $(date +"%Y-%m-%d %H:%M:%S")"
echo "================================"
echo ""
