#!/bin/bash
# 使用方法: ./scripts/create-site.sh my-new-site

if [ -z "$1" ]; then
  echo "用法: ./scripts/create-site.sh <站点名称>"
  exit 1
fi

SITE_NAME=$1
TEMPLATE_DIR="$(dirname "$0")/../sites/template"
TARGET_DIR="$(dirname "$0")/../sites/$SITE_NAME"

if [ -d "$TARGET_DIR" ]; then
  echo "错误: 目录 $TARGET_DIR 已存在"
  exit 1
fi

echo "从模板创建新站点: $SITE_NAME"
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# 更新站点配置
cd "$TARGET_DIR"
sed -i "s/site-template/site-$SITE_NAME/" package.json
sed -i 's|"site-template"|"site-'"$SITE_NAME"'"|' package.json

echo ""
echo "✓ 完成! 请编辑以下文件:"
echo "  - src/config/site.json  (站点信息)"
echo "  - site.config.json      (站点名称、URL)"
echo ""
echo "然后运行:"
echo "  cd ../.. && pnpm install"
echo "  pnpm --filter site-$SITE_NAME dev"
