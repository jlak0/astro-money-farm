#!/bin/bash
# Usage: ./scripts/create-post.sh <site> <title> [tags]
# Example: ./scripts/create-post.sh test-site "How to do SEO" "SEO,Tutorial"

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/create-post.sh <site> <title> [tags]"
  exit 1
fi

SITE=$1
TITLE=$2
TAGS=${3:-"Tutorial"}
SLUG=$(echo "$TITLE" | sed 's/ /-/g' | sed 's/[^a-zA-Z0-9-]//g' | tr '[:upper:]' '[:lower:]')
DATE=$(date +%Y-%m-%d)
FILENAME="sites/$SITE/src/content/blog/${DATE}-${SLUG}.md"

cat > "$FILENAME" << 'EOF'
---
title: "{{TITLE}}"
description: "{{TITLE}} detailed guide"
pubDate: {{DATE}}
author: "Money Farm"
tags: [{{TAGS}}]
cover: ""
---

# {{TITLE}}

## Introduction

This article introduces the core concepts of {{TITLE}}.

## Main Content

Write your content here...

## Summary

That's all about {{TITLE}}.
EOF

sed -i "s/{{TITLE}}/$TITLE/g" "$FILENAME"
sed -i "s/{{DATE}}/$DATE/g" "$FILENAME"
sed -i "s/{{TAGS}}/$TAGS/g" "$FILENAME"

echo "Created: $FILENAME"
