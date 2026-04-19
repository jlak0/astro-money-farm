import { getCollection } from 'astro:content';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read site config from astro.config.mjs directly
function getSiteUrl(): string {
  try {
    const configPath = join(__dirname, '../../astro.config.mjs');
    const configContent = readFileSync(configPath, 'utf-8');
    // Match: site: 'https://example.com' or site: "https://example.com"
    const match = configContent.match(/site:\s*['"]([^'"]+)['"]/);
    if (match) return match[1];
  } catch (e) {
    // ignore
  }
  return 'http://localhost:4321';
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getCollection('blog');

  // Static pages
  const staticPages = [
    { url: siteUrl, lastmod: new Date().toISOString().split('T')[0], priority: '1.0', changefreq: 'daily' },
    { url: `${siteUrl}/blog`, lastmod: new Date().toISOString().split('T')[0], priority: '0.9', changefreq: 'daily' },
    { url: `${siteUrl}/about`, lastmod: new Date().toISOString().split('T')[0], priority: '0.6', changefreq: 'monthly' },
  ];

  // Blog posts
  const blogPages = posts
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .map(post => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastmod: (post.data.modifiedDate || post.data.publishDate).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    }));

  // Categories
  const categories = [...new Set(posts.map(p => p.data.category))];
  const categoryPages = categories.map(cat => ({
    url: `${siteUrl}/blog/category/${cat}`,
    lastmod: new Date().toISOString().split('T')[0],
    priority: '0.7',
    changefreq: 'daily',
  }));

  // Tags
  const tags = [...new Set(posts.flatMap(p => p.data.tags || []))];
  const tagPages = tags.map(tag => ({
    url: `${siteUrl}/blog/tag/${tag}`,
    lastmod: new Date().toISOString().split('T')[0],
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
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
