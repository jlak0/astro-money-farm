#!/bin/bash
# 使用方法: ./scripts/create-site.sh my-new-site
set -euo pipefail

if [ -z "$1" ]; then
  echo "用法: ./scripts/create-site.sh <站点名称>"
  exit 1
fi

SITE_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../sites/template"
TARGET_DIR="$SCRIPT_DIR/../sites/$SITE_NAME"

if [ -d "$TARGET_DIR" ]; then
  echo "错误: 目录 $TARGET_DIR 已存在"
  exit 1
fi

echo "从模板创建新站点: $SITE_NAME"
mkdir -p "$TARGET_DIR"
find "$TEMPLATE_DIR" -mindepth 1 -maxdepth 1 \
  ! -name 'node_modules' \
  ! -name 'dist' \
  ! -name '.astro' \
  ! -name '.turbo' \
  -exec cp -R {} "$TARGET_DIR"/ \;

# 更新站点配置
cd "$TARGET_DIR"
sed -i "s|site-template|site-$SITE_NAME|g" package.json

echo ""
echo "✓ 完成! 请编辑以下文件:"
echo "  - src/config/site.json  (站点信息)"
echo "  - site.config.json      (站点名称、URL)"
echo ""
echo "然后运行:"
echo "  cd ../.. && pnpm install"
echo "  pnpm --filter @astro-money-farm/site-$SITE_NAME dev"
