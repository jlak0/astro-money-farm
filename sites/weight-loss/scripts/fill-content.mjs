#!/usr/bin/env node
/**
 * 填充示例内容脚本
 * 
 * 用法：
 *   node scripts/fill-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(rootDir = path.join(__dirname, '..'));
const blogDir = path.join(rootDir, 'src/content/blog');

// 确保目录存在
if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir, { recursive: true });
}

const articles = [
  {
    slug: 'ai-side-hustle-2024',
    title: 'AI时代副业指南：普通人如何用ChatGPT月入过万',
    description: '详细介绍普通人如何利用AI工具开展副业，从注册到变现的完整流程，包含5个真实案例和具体操作步骤。',
    category: 'AI变现',
    tags: ['AI变现', 'ChatGPT', '副业', '月入过万'],
    readingTime: '10分钟',
    content: `## 前言

AI浪潮来袭，有人担心失业，有人却在偷偷赚钱。作为普通人，我们该怎么抓住这波红利？

## 为什么是AI副业？

1. **门槛低**：不需要编程基础
2. **见效快**：当天就能开始接单
3. **可持续**：复利效应明显

## 5个真实变现案例

### 案例1：小红书AI账号

**操作步骤：**
1. 注册 ChatGPT Plus（20美元/月）
2. 用 AI 生成文案 + 配图
3. 发布到小红书/抖音
4. 接入广告或带货链接

**月收益：3000-8000元**

### 案例2：闲鱼AI代写

帮别人写文案、写简历、写报告。AI能提效10倍，同样的时间能做更多单。

### 案例3：公众号AI内容号

用 AI 批量生成文章，挂广告分成。关键是选对细分领域。

### 案例4：AI套图变现

用 Midjourney/DALL-E 生成图片，卖给设计需求方或做定制头像。

### 案例5：AI培训

当你学会 AI 工具后，可以教别人怎么用。录课或做付费社群。

## 入门第一步

注册 OpenAI 账号是关键。具体流程参考往期文章。

## 总结

AI 副业不是神话，但也不是躺赚。**行动力 + 正确方法 = 变现**。`
  },
  {
    slug: 'france-startup-visa',
    title: '法国科技创业签证申请攻略（2024完整版）',
    description: '手把手教你申请法国科技创业签证（French Tech Visa），从材料准备到面试技巧，无法语要求。',
    category: '法国创业',
    tags: ['法国创业', '创业签证', '海外创业', '欧洲'],
    readingTime: '15分钟',
    content: `## 什么是法国科技创业签证？

法国科技创业签证（French Tech Visa）是法国政府为吸引海外创业者推出的快速通道，**无语言要求、无学历要求、无年龄要求**。

## 申请条件

1. 项目创新性：你的项目要有创新点
2. 资金证明：最低3万欧元
3. 办公场地：法国孵化器或coworking

## 申请流程

### 第一步：准备BP（商业计划书）

重点突出：
- 市场规模
- 创新点
- 团队实力
- 财务预测

### 第二步：对接孵化器

推荐几个靠谱的：
- Station F（全球最大创业园区）
- Lafayette Plug and Play
- Agoranov

### 第三步：在线提交申请

通过 France Visas 网站提交。

### 第四步：面试

准备好用英语介绍你的项目。

## 常见问题

**Q: 需要法语吗？**
A: 不需要，英语可以全程搞定。

**Q: 费用多少？**
A: 官方费用约50欧元，但孵化器可能收费。

**Q: 审批周期？**
A: 通常2-3个月。

## 真实案例

我认识一个深圳的程序员，2023年成功获批，现在在巴黎做AI+医疗项目。

---

有问题欢迎留言咨询。`
  },
  {
    slug: 'passive-income-2024',
    title: '2024年被动收入完全指南：睡后收入实战手册',
    description: '详细介绍10种被动收入来源，从0开始搭建你的睡后收入管道，包括具体操作步骤和风险评估。',
    category: '副业',
    tags: ['被动收入', '财务自由', '赚钱方法', '副业'],
    readingTime: '12分钟',
    content: `## 什么是被动收入？

被动收入 = 不需要主动劳动就能持续获得的收入。但"被动"不等于"零努力"，前期需要投入时间和资金。

## 10种被动收入来源

### 1. 联盟营销（Affiliate Marketing）

推广别人产品赚佣金。

**平台推荐：**
- 亚马逊联盟
- 京东联盟
- 淘宝客

### 2. 数字产品销售

电子书、模板、插件、课程。

**边际成本为零，完美被动收入。**

### 3. 内容变现

博客、YouTube、B站...

**关键：选对细分领域，持续输出。**

### 4. 版权收入

写书、作曲、拍照...

### 5. 出租收入

租房、租设备、租车...

### 6. P2P借贷

把闲置资金借给需要的人，收利息。

**风险较高，谨慎选择。**

### 7. 股权收益

投资初创公司或二级市场。

### 8. 版权费

软件开发授权、字体授权等。

### 9. 自动售货机/娃娃机

线下被动收入，但需要初始投资。

### 10. 软件即服务（SaaS）

搭建工具类产品，按月收费。

## 如何选择？

| 类型 | 初始成本 | 上限 | 适合人群 |
|------|---------|------|---------|
| 数字产品 | 低 | 高 | 有技能的 |
| 联盟营销 | 低 | 中 | 有流量基础的 |
| 内容变现 | 低 | 高 | 有创作热情的 |

## 开始行动

第一步：确定你的技能或资源
第二步：选择1-2种被动收入类型
第三步：学习+实践
第四步：持续优化

**不要想太多，先干起来！**`
  },
  {
    slug: 'seo-complete-guide',
    title: 'SEO完整教程：从0到1让Google爱上你的网站',
    description: '系统讲解SEO技术，从关键词研究到外链建设，包含实操工具推荐和避坑指南，适合站群运营者。',
    category: '干货',
    tags: ['SEO', '干货', '博客', '流量'],
    readingTime: '18分钟',
    content: `## SEO是什么？

SEO = Search Engine Optimization = 搜索引擎优化。目标是让网站在Google/Bing等搜索引擎中获得更高排名，从而获得免费流量。

## SEO的两大核心

1. **技术SEO**：让搜索引擎能抓取和理解你的网站
2. **内容SEO**：提供搜索引擎认可的高质量内容

## 技术SEO清单

### 1. 网站速度

- 使用 Cloudflare CDN
- 优化图片（WebP格式）
- 开启 Gzip 压缩
- 目标：LCP < 2.5秒

### 2. 移动端友好

- 响应式设计
- 移动端优先索引

### 3. HTTPS

- 必须使用 SSL 证书
- Cloudflare 免费证书

### 4. 结构化数据

- 添加 JSON-LD
- 让Google理解页面内容

## 关键词研究

### 工具推荐

- **Google Keyword Planner**：免费，官方工具
- **Ahrefs**：付费，精准全面
- **Ubersuggest**：免费+付费，入门友好

### 选词策略

1. 搜索量：100-1000的词竞争小
2. 商业价值：选有变现潜力的词
3. 长尾词：竞争小，容易排名

## 内容优化

### 标题优化
\`\`\`
包含关键词 + 吸引点击 + 控制在60字符内
\`\`\`

### 描述优化
\`\`\`
150字符内，包含关键词，有行动号召
\`\`\`

## 外链建设

### 白帽外链
- 客座博客
- 资源页面
- PR投稿

### 站群互链
同一站群内的站点互相链接，传递权重。

## 工具推荐

| 工具 | 用途 | 费用 |
|------|------|------|
| Google Search Console | 数据监控 | 免费 |
| Screaming Frog | 技术审计 | 免费/付费 |
| Ahrefs | 全方位SEO | 付费 |
| PageSpeed Insights | 速度检测 | 免费 |

## 避坑指南

1. ❌ 购买垃圾外链
2. ❌ 关键词堆砌
3. ❌ 采集复制内容
4. ✅ 坚持原创优质内容
5. ✅ 自然的链接增长`
  }
];

// 生成文章
for (const article of articles) {
  const filePath = path.join(blogDir, `${article.slug}.md`);
  
  // 跳过已存在的文章
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  跳过已存在: ${article.slug}.md`);
    continue;
  }

  const frontmatter = `---
title: "${article.title}"
description: "${article.description}"
publishDate: ${new Date().toISOString().split('T')[0]}
category: "${article.category}"
tags: [${article.tags.map(t => `"${t}"`).join(', ')}]
readingTime: "${article.readingTime}"
---

${article.content}
`;

  fs.writeFileSync(filePath, frontmatter);
  console.log(`✅ 创建: ${article.slug}.md`);
}

console.log(`\n🎉 完成！共 ${articles.length} 篇示例文章。`);
console.log('运行 npm run build 重新生成站点。');
