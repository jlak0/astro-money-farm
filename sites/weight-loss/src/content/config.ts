import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    modifiedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['Intermittent Fasting', 'Keto Diet', 'Low Carb', 'Tips']),
    author: z.string().default('Weight Loss Expert'),
    ogImage: z.string().optional(),
    featured: z.boolean().default(false),
    readingTime: z.string().optional(),
  }),
});

export const collections = { blog };
