# 🚀 Astro 站群内容农场模板

用 **一个源码库**，通过改配置快速复制出 **100+ 个独立站点**，全部部署在 Cloudflare Pages 静态托管，零服务器成本。

---

## ⚡ 快速开始（5步上线新站）

```bash
# 1. 克隆模板
git clone https://github.com/your-org/astro-money-blog.git your-new-site
cd your-new-site

# 2. 安装依赖
pnpm install

# 3. 一键初始化站点配置
node scripts/init-site.mjs \
  --name "你的站点名" \
  --domain "your-domain.com" \
  --desc "站点描述"

# 4. 启动开发
pnpm dev

# 5. 部署到 Cloudflare Pages
pnpm build
# 在 Cloudflare Dashboard 连接 Git 仓库，设置构建命令: pnpm build
```

---

## 📁 目录结构

```
├── src/
│   ├── config/
│   │   ├── site.json      # ⚙️ 站点配置（名称、域名、广告、Analytics）
│   │   ├── links.json     # 🔗 友链配置（友链分组、内链规则）
│   │   └── template.json  # 📋 配置模板（新建站点时复制此文件修改）
│   ├── content/
│   │   └── blog/          # 📝 文章 Markdown 文件
│   ├── components/        # 🧩 Astro 组件
│   ├── layouts/           # 📐 页面布局
│   └── pages/             # 🌐 页面路由
├── scripts/
│   ├── init-site.mjs      # ⚡ 站点初始化脚本（改配置用）
│   └── fill-content.mjs   # 📄 填充示例内容
├── public/
│   ├── og-default.svg     # 🖼️ 默认 OG 图片（会自动用首字母生成）
│   └── robots.txt
├── astro.config.mjs       # ⚙️ Astro 配置
└── package.json
```

---

## ⚙️ 配置说明

### site.json — 站点基础配置

| 字段 | 说明 | 示例 |
|------|------|------|
| `site.name` | 站点名称 | `"变现学堂"` |
| `site.url` | 站点域名 | `"https://example.com"` |
| `ads.enabled` | 是否显示广告 | `true` / `false` |
| `subscribe.enabled` | 是否显示邮箱订阅 | `true` / `false` |
| `analytics.baidu` | 百度统计 ID | `"xxxxx"` |
| `analytics.umami` | Umami 配置 | 见下方 |

### links.json — 友链与内链

| 字段 | 说明 |
|------|------|
| `friendlyLinks.groups` | 友链分组（按主题分类） |
| `internalLinks.autoLink.keywords` | 关键词 → 内链自动转换 |
| `internalLinks.relatedPosts` | 相关文章推荐规则 |
| `exclusions.paths` | 不生成内链的路径 |

### init-site.mjs — 自动化配置

```bash
# 基本用法
node scripts/init-site.mjs --name "AI变现" --domain "ai-earn.com" --desc "AI副业赚钱"

# 完整参数
node scripts/init-site.mjs \
  --name "站点名" \
  --domain "domain.com" \
  --desc "描述" \
  --email "contact@domain.com" \
  --author "作者名"
```

---

## 📦 部署到 Cloudflare Pages

### 方式一：Git 自动部署（推荐）

1. 把模板推送到 GitHub/GitLab 私有仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Workers & Pages → Create application → Pages → Connect to Git
4. 选择仓库，设置：
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
5. 添加环境变量（可选）：
   - `NODE_VERSION`: `18`
6. Deploy!

### 方式二：本地打包上传

```bash
pnpm build
# 把 dist/ 文件夹拖到 Cloudflare Pages 的 Direct Upload
```

### Cloudflare Pages 免费额度

| 项目 | 额度 |
|------|------|
| 构建次数 | 500次/月 |
| 请求 | 无限 |
| 带宽 | 无限 |
| 站点数量 | 无限 |

---

## ✍️ 添加新文章

```bash
# 方法1：直接创建 Markdown 文件
# 在 src/content/blog/ 下创建 .md 文件：

---
title: "AI变现新方法2024"
description: "详细介绍..."
publishDate: 2024-01-15
category: "AI变现"
tags: ["AI变现", "副业", "ChatGPT"]
readingTime: "8分钟"
---

文章内容...
```

**front matter 字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `description` | ✅ | SEO描述（120字内） |
| `publishDate` | ✅ | 发布日期 |
| `category` | ✅ | 主分类 |
| `tags` | ✅ | 标签数组 |
| `readingTime` | ❌ | 阅读时长，自动计算可不填 |

---

## 🔗 添加友链

编辑 `src/config/links.json`：

```json
{
  "friendlyLinks": {
    "groups": [
      {
        "name": "变现相关",
        "sites": [
          {
            "name": "隔壁老王",
            "url": "https://example.com",
            "description": "专注副业赚钱",
            "logo": "https://example.com/logo.png",
            "priority": 1,
            "nofollow": false
          }
        ]
      }
    ]
  }
}
```

---

## 🤖 使用 OpenClaw 编辑内容

安装 OpenClaw 后，可以直接用 AI 助手编辑 Markdown 文章：

```bash
# 启动 OpenClaw
openclaw

# 发送消息给 AI：
# "帮我写一篇关于 AI 生成图片变现的文章，2000字，SEO友好"
# "把这篇文章润色一下，更适合小红书风格"
```

---

## 🛠️ 站群批量管理技巧

### 批量创建新站点

```bash
# 1. 克隆模板 N 次
for i in {1..10}; do
  git clone template-repo "site-$i"
done

# 2. 批量初始化配置
for dir in site-*; do
  node "$dir/scripts/init-site.mjs" \
    --name "站点$i" \
    --domain "site$i.com" \
    --desc "第$i个站点"
done
```

### 批量部署

配合 GitHub Actions 实现 push 后自动部署所有站点。

---

## 📊 SEO 清单

- [x] sitemap.xml + sitemap-index.xml
- [x] robots.txt
- [x] Open Graph 图片
- [x] JSON-LD 结构化数据
- [x] 语义化 HTML
- [x] 静态 category/tag 页面
- [x] 站内相关文章内链
- [x] 站群网络外链
- [x] Google Analytics / Baidu Analytics / Umami 支持
- [ ] Google AdSense 接入（需要网站备案）
- [ ] 百度收录提交

---

## 🎯 变现路径

| 阶段 | 流量需求 | 变现方式 |
|------|---------|---------|
| 初期 | 0-1000/天 | 联盟链接、广告位出售 |
| 成长期 | 1000-1万/天 | Google AdSense、软广 |
| 稳定期 | 1万+/天 | 多广告主、付费专栏 |

---

## 📝 License

MIT — 随意使用，商用无忧。
