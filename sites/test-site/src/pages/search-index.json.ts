import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const allPosts = await getCollection('blog');

  const searchIndex = allPosts
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .map(p => ({
      slug: p.slug,
      title: p.data.title,
      description: p.data.description,
      category: p.data.category,
      tags: p.data.tags || [],
      url: `/blog/${p.slug}`,
      publishDate: p.data.publishDate.toISOString(),
    }));

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
