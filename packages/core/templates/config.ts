// 内容模板配置
export const CONTENT_TEMPLATES = {
  seoGuide: {
    title: 'SEO优化指南',
    tags: ['SEO', '优化', '流量'],
    author: '站点'
  },
  tutorial: {
    title: '教程',
    tags: ['教程', '指南'],
    author: '站点'
  }
} as const;

export type ContentTemplate = keyof typeof CONTENT_TEMPLATES;
