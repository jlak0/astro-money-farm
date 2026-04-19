#!/bin/bash
# 用法: ./scripts/deploy-site.sh <站点目录> [环境]
# 示例: ./scripts/deploy-site.sh test-site production

if [ -z "$1" ]; then
  echo "用法: ./scripts/deploy-site.sh <站点目录> [环境]"
  exit 1
fi

SITE_NAME=$1
ENV=${2:-production}
SITE_DIR="$(dirname "$0")/../sites/$SITE_NAME"

if [ ! -d "$SITE_DIR" ]; then
  echo "错误: 站点 $SITE_NAME 不存在"
  exit 1
fi

echo "=== 部署站点: $SITE_NAME ($ENV) ==="

cd "$SITE_DIR"

# 构建
echo "1. 构建中..."
pnpm build

# 检查 wrangler.toml
if [ -f "wrangler.toml" ]; then
  echo "2. 部署到 Cloudflare Pages..."
  npx wrangler pages deploy dist --project-name="$SITE_NAME"
else
  echo "2. 打包完成，dist/ 目录已准备好"
fi

echo "=== 部署完成 ==="
