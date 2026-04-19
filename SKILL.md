# Astro Money Farm - 内容创作规范

## Frontmatter 必填字段

每个博客文章必须包含以下字段：

```yaml
---
title: "文章标题"           # 标题，必填
description: "描述"          # 描述，必填
publishDate: 2026-04-19     # 发布日期，必填，格式 YYYY-MM-DD
tags: ["标签1", "标签2"]    # 标签数组，必填
category: "干货"            # 分类，必填，可选值见下方
author: "站长"              # 作者，默认"站长"
featured: false             # 是否精选，默认 false
---
```

## Category 可选值

```typescript
category: z.enum([
  'AI变现',
  '副业', 
  '干货',
  '法国创业'
])
```

## 常见错误

### ❌ 错误示例

```yaml
---
title: 文章标题
pubDate: 2026-04-19        # 错误：应该是 publishDate
tags: [标签1, 标签2]        # 错误：标签需要加引号
category: 其他              # 错误：不在允许的枚举值中
---
```

### ✅ 正确示例

```yaml
---
title: "文章标题"
description: "文章描述"
publishDate: 2026-04-19
tags: ["标签1", "标签2"]
category: "干货"
author: "站长"
featured: false
---
```

## 创建文章

使用项目提供的脚本自动生成正确格式：

```bash
./scripts/create-post.sh <站点名> <标题> [标签] [分类]

# 示例
./scripts/create-post.sh test-site "我的文章" "AI,变现" "干货"
```

## 手动创建文章

如果手动创建，确保 frontmatter 格式完全正确。

## Schema 验证

Astro 会在运行时检查 frontmatter。如果看到 `frontmatter does not match collection schema` 错误，检查：

1. 字段名是否正确（特别是 `publishDate` 不是 `pubDate`）
2. `category` 是否在允许的枚举值中
3. `tags` 是否为字符串数组格式 `["标签1", "标签2"]`
4. `publishDate` 是否为有效的 ISO 日期格式
