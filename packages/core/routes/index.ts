import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export function createRobotsGET(getSiteUrl: () => string): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap-index.xml`;

    return new Response(robotsTxt, {
      headers: { 'Content-Type': 'text/plain' },
    });
  };
}

export function createSitemapIndexGET(getSiteUrl: () => string): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const lastmod = new Date().toISOString().split('T')[0];
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new Response(sitemapIndex, {
      headers: { 'Content-Type': 'application/xml' },
    });
  };
}

export function createSitemapGET(getSiteUrl: () => string): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const posts = await getCollection('blog');
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: siteUrl, lastmod: today, priority: '1.0', changefreq: 'daily' },
      { url: `${siteUrl}/blog`, lastmod: today, priority: '0.9', changefreq: 'daily' },
      { url: `${siteUrl}/about`, lastmod: today, priority: '0.6', changefreq: 'monthly' },
    ];

    const blogPages = posts
      .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
      .map(post => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastmod: (post.data.modifiedDate || post.data.publishDate).toISOString().split('T')[0],
        priority: '0.8',
        changefreq: 'weekly',
      }));

    const categories = [...new Set(posts.map(p => p.data.category))];
    const categoryPages = categories.map(cat => ({
      url: `${siteUrl}/blog/category/${cat}`,
      lastmod: today,
      priority: '0.7',
      changefreq: 'daily',
    }));

    const tags = [...new Set(posts.flatMap(p => p.data.tags || []))];
    const tagPages = tags.map(tag => ({
      url: `${siteUrl}/blog/tag/${tag}`,
      lastmod: today,
      priority: '0.6',
      changefreq: 'weekly',
    }));

    const allPages = [...staticPages, ...blogPages, ...categoryPages, ...tagPages];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  };
}

export function createSearchIndexGET(): APIRoute {
  return async () => {
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
}
