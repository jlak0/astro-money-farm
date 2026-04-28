#!/bin/bash
#
# 站群模板 - 一键部署脚本 (Linux/Mac)
#
# 使用方式: bash scripts/deploy.sh
#

set -e

echo "========================================"
echo "  🚀 站群博客 - 开始构建部署"
echo "========================================"
echo ""

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    pnpm install
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🔨 正在构建..."
pnpm build

echo ""
echo "✅ 构建完成！"
echo ""
echo "========================================"
echo "  📤 部署到 Cloudflare Pages"
echo "========================================"
echo ""
echo "方式一：Wrangler CLI"
echo "  npx wrangler pages deploy dist"
echo ""
echo "方式二：连接 GitHub"
echo "  1. 推送代码到 GitHub"
echo "  2. Cloudflare Pages → 新建项目 → 连接 GitHub"
echo "  3. 设置构建命令: pnpm build"
echo "  4. 设置输出目录: dist"
echo ""
echo "========================================"
