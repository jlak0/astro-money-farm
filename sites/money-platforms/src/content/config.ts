import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    modifiedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum([
      'AI变现',
      '副业',
      '干货',
      '法国创业',
      '数字产品',
      '知识付费',
      '课程教育',
      '按需印刷',
      '自由职业',
      '视频内容',
      '图文内容',
      '游戏',
      '图库素材',
      '电商',
      '广告联盟',
      'AI工具',
      '其他'
    ]),
    author: z.string().default('站长'),
    ogImage: z.string().optional(),
    featured: z.boolean().default(false),
    readingTime: z.string().optional(),
  }),
});

export const collections = { blog };
