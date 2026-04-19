#!/bin/bash
# Usage: ./scripts/create-post.sh <site> <title> [tags] [category]

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/create-post.sh <site> <title> [tags] [category]"
  exit 1
fi

SITE=$1
TITLE=$2
TAGS=${3:-"教程"}
CATEGORY=${4:-"干货"}
DATE=$(date +%Y-%m-%d)

# Use node to generate proper slug (handles Chinese)
SLUG=$(node -e "
  const title = '$TITLE';
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .substring(0, 50) || Date.now();
  console.log(slug);
")

FILENAME="sites/$SITE/src/content/blog/${DATE}-${SLUG}.md"

# Format tags
QUOTED_TAGS=$(node -e "console.log('[\"' + '$TAGS'.split(',').join('\", \"') + '\"]')")

cat > "$FILENAME" << EOF
---
title: "$TITLE"
description: "$TITLE详细指南"
publishDate: $DATE
tags: $QUOTED_TAGS
category: "$CATEGORY"
author: "站长"
featured: false
---

# $TITLE

## 前言

本文介绍$TITLE的核心内容。

## 正文

在这里撰写你的文章内容...

## 总结

以上就是关于$TITLE的全部内容。
EOF

echo "Created: $FILENAME"
