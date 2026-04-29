import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    modifiedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().min(1),
    author: z.string().default('站长'),
    ogImage: z.string().optional(),
    featured: z.boolean().default(false),
    readingTime: z.string().optional(),
  }),
});

export const collections = { blog };
