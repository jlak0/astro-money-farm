# 📖 站群模板使用指南

> 详细说明如何用这个模板创建和管理100个站群站点

---

## 🎯 核心思路

站群内容的核心是**主题垂直 + 内容差异化**：

```
变现主题（主类别）
├── AI变现
│   ├── ChatGPT副业
│   ├── AI工具推荐
│   └── AI电商应用
├── 副业赚钱
│   ├── 电商副业
│   ├── 内容副业
│   └── 服务副业
├── 海外赚钱
│   ├── 法国创业
│   ├── 北美副业
│   └── 东南亚机会
└── 干货分享
    ├── SEO教程
    ├── 工具测评
    └── 案例复盘
```

---

## 🏗️ 批量建站流程

### 方式一：手动复制（适合 < 10 个站点）

```bash
# 1. Fork 模板仓库
# 2. 克隆你的 fork
git clone https://github.com/你的账号/astro-site-farm.git

# 3. 为每个站点创建分支
git checkout -b site-ai-monetize
node scripts/init-site.mjs --name AI变现站 --domain ai.example.com --desc AI副业赚钱

# 4. 提交推送
git add .
git commit -m "Init site: AI变现站"
git push origin site-ai-monetize
```

### 方式二：GitHub Organization（适合 10-100 个站点）

1. 创建 Organization（如：`my-site-farm`）
2. 在 Organization 下创建多个仓库（如：`site-01-ai`, `site-02-side-hustle`...）
3. 每个仓库独立配置、独立部署

### 方式三：脚本自动化（适合 100+ 个站点）

```bash
#!/bin/bash
# 批量初始化站点脚本

DOMAINS=(
  "ai-monetize.example.com"
  "side-hustle.example.com"
  "france-biz.example.com"
  "seo-tools.example.com"
  "remote-work.example.com"
)

NAMES=(
  "AI变现站"
  "副业赚钱站"
  "法国创业站"
  "SEO工具站"
  "远程工作站"
)

for i in "${!DOMAINS[@]}"; do
  node scripts/init-site.mjs \
    --name "${NAMES[$i]}" \
    --domain "${DOMAINS[$i]}" \
    --desc "${NAMES[$i]}专属内容"
done
```

---

## 📋 配置文件批量管理

### 使用脚本批量生成 site.json

```javascript
// generate-sites.mjs
const sites = [
  { name: 'AI变现站', domain: 'ai.example.com', desc: 'AI副业赚钱指南' },
  { name: '副业赚钱', domain: 'side.example.com', desc: '副业项目实战分享' },
  // ... 添加更多站点
];

for (const site of sites) {
  // 生成 site.json
  // 更新 astro.config.mjs
  // 生成 favicon
}
```

### 站点分类策略

| 站点类型 | 内容方向 | 变现方式 |
|----------|----------|----------|
| AI变现站 | 工具教程、案例分享 | 联盟营销、课程分销 |
| 副业站 | 项目拆解、操作教程 | 广告、付费社群 |
| 创业站 | 海外机会、政策解读 | 付费咨询、服务 |
| 工具站 | 工具推荐、优惠信息 | 联盟佣金、广告 |

---

## 🔄 自动化部署流程

### GitHub Actions 多站点部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: pnpm build
        env:
          SITE_URL: ${{ secrets.SITE_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          wranglerVersion: 3
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 为每个站点配置 GitHub Secrets

在 GitHub 仓库 Settings → Secrets 中添加：

| Secret 名称 | 说明 |
|-------------|------|
| `SITE_URL` | 站点完整 URL（https://ai.example.com） |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |

---

## 📝 内容差异化策略

### 同一主题的多种角度

假设主主题是「AI副业」：

```
站点A：AI变现方法 → 侧重变现模式
站点B：ChatGPT教程 → 侧重工具使用
站点C：AI工具推荐 → 侧重工具测评
站点D：AI副业案例 → 侧重成功案例
站点E：AI内容创作 → 侧重内容生产
```

### 文章模板化生产

每篇文章遵循 SEO 标准结构：

```markdown
---
title: "关键词 + 修饰词 + 年份"
description: "一句话概括文章价值"
publishDate: 2024-xx-xx
tags: ["核心关键词", "长尾关键词1", "长尾关键词2"]
category: "对应分类"
---

## 章节结构（H2）

### 为什么要XXX？（痛点）
### XXX方法1（核心内容）
### XXX方法2（核心内容）
### XXX方法3（核心内容）
### 实战步骤（可操作）
### 常见问题FAQ（长尾关键词）
```

### 自动计算阅读时间

`scripts/fill-content.mjs` 会自动计算每篇文章的阅读时间：

```javascript
function calcReadingTime(content) {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = chineseChars + englishWords;
  const minutes = Math.max(1, Math.ceil(totalWords / 200));
  return `${minutes}分钟`;
}
```

---

## 🎨 Favicon 自动化生成

每个站点的 Favicon 应该不同以便于区分：

```bash
# 为不同站点生成不同颜色的 favicon
node scripts/generate-favicon.mjs --letter "A" --color "#10b981"  # 绿色
node scripts/generate-favicon.mjs --letter "B" --color "#3b82f6"  # 蓝色
node scripts/generate-favicon.mjs --letter "C" --color "#f59e0b"  # 橙色
```

---

## 📊 站群管理建议

### 1. 表格化管理

使用 Notion/Excel 跟踪所有站点：

| 站点名 | 域名 | 状态 | 内容数 | 收录 | 流量 |
|--------|------|------|--------|------|------|
| AI变现站 | ai.xxx.com | 运行中 | 20 | 18 | 500/天 |
| 副业站 | side.xxx.com | 运行中 | 15 | 12 | 300/天 |

### 2. 定期内容更新

- 每周每站更新 1-2 篇
- 优先更新有流量的页面
- 定期检查死链

### 3. SEO 监控

- 每月检查 Google Search Console
- 监控关键词排名变化
- 及时处理抓取错误

---

## 🔧 常用命令参考

```bash
# 初始化新站点
node scripts/init-site.mjs --name 站点名 --domain example.com --desc 描述

# 填充示例内容
node scripts/fill-content.mjs

# 生成/更新 favicon
node scripts/generate-favicon.mjs --letter A --color "#10b981"

# 本地开发
npm run dev

# 构建生产版本
pnpm build

# 预览（带搜索索引）
npm run preview

# 一键部署
bash scripts/deploy.sh        # Linux/Mac
scripts\deploy.bat            # Windows
```

---

## ⚠️ 注意事项

1. **域名解析**：部署前确保域名已解析到 Cloudflare Pages
2. **内容原创**：尽量原创内容，避免大量重复被搜索引擎惩罚
3. **遵守政策**：各平台政策不同，确保合规运营
4. **定期备份**：重要配置和内容定期备份

---

## 💡 变现建议

| 阶段 | 月流量 | 推荐变现方式 |
|------|--------|--------------|
| 起步 | 0-1000 | 联盟营销（佣金产品） |
| 成长 | 1000-5000 | Google AdSense |
| 稳定 | 5000-10000 | 联盟 + AdSense + 软文 |
| 规模化 | 10000+ | 付费社群 + 课程 + 咨询 |

---

有问题？欢迎提交 Issue 或 PR！
