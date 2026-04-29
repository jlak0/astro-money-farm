import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { DEFAULT_PAGINATION, buildPageUrl, shardItems } from '../utils';

interface SitemapOptions {
  urlsPerFile?: number;
}

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

type BlogPost = Awaited<ReturnType<typeof getCollection<'blog'>>>[number];

let blogPostsPromise: Promise<BlogPost[]> | undefined;
const postShardCache = new Map<number, Promise<Array<{ page: number; items: BlogPost[] }>>>();
const archivePathShardCache = new Map<number, Promise<Array<{ page: number; items: string[] }>>>();

function xmlResponse(body: string) {
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function encodeUrl(url: string) {
  return encodeURI(url).replace(/#/g, '%23');
}

function sitemapXml(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(page => `  <url>
    <loc>${escapeXml(encodeUrl(page.loc))}</loc>
    <lastmod>${escapeXml(page.lastmod)}</lastmod>
    <changefreq>${escapeXml(page.changefreq)}</changefreq>
    <priority>${escapeXml(page.priority)}</priority>
  </url>`).join('\n')}
</urlset>`;
}

function sitemapIndexXml(urls: string[], lastmod: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(loc => `  <sitemap>
    <loc>${escapeXml(encodeUrl(loc))}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

function getUrlsPerFile(options?: SitemapOptions) {
  return options?.urlsPerFile ?? DEFAULT_PAGINATION.sitemapUrlsPerFile;
}

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
}

function getPostSitemapUrls(posts: BlogPost[], siteUrl: string): SitemapUrl[] {
  return posts.map(post => ({
    loc: `${siteUrl}/blog/${post.slug}`,
    lastmod: formatDate(post.data.modifiedDate || post.data.publishDate),
    changefreq: 'weekly',
    priority: '0.8',
  }));
}

function getArchiveSitemapPaths(posts: BlogPost[]) {
  const paths: string[] = [];
  const postCount = posts.length;
  const blogPages = Math.max(1, Math.ceil(postCount / DEFAULT_PAGINATION.postsPerPage));
  const categories = [...new Set(posts.map(p => p.data.category))];
  const tags = [...new Set(posts.flatMap(p => p.data.tags || []))];

  for (let page = 1; page <= blogPages; page += 1) {
    paths.push(buildPageUrl('/blog', page));
  }

  for (const category of categories) {
    const count = posts.filter(p => p.data.category === category).length;
    const totalPages = Math.max(1, Math.ceil(count / DEFAULT_PAGINATION.postsPerPage));
    const basePath = `/blog/category/${category}`;

    for (let page = 1; page <= totalPages; page += 1) {
      paths.push(buildPageUrl(basePath, page));
    }
  }

  for (const tag of tags) {
    const count = posts.filter(p => p.data.tags?.includes(tag)).length;
    const totalPages = Math.max(1, Math.ceil(count / DEFAULT_PAGINATION.postsPerPage));
    const basePath = `/blog/tag/${tag}`;

    for (let page = 1; page <= totalPages; page += 1) {
      paths.push(buildPageUrl(basePath, page));
    }
  }

  return paths;
}

function getArchiveSitemapUrls(paths: string[], siteUrl: string): SitemapUrl[] {
  const today = formatDate(new Date());

  return paths.map(path => ({
    loc: `${siteUrl}${path}`,
    lastmod: today,
    changefreq: path.startsWith('/blog/tag/') ? 'weekly' : 'daily',
    priority:
      path === '/blog/'
        ? '0.9'
        : path.startsWith('/blog/tag/')
          ? '0.6'
          : '0.7',
  }));
}

async function getBlogPosts() {
  blogPostsPromise ||= getCollection('blog');
  return blogPostsPromise;
}

async function getPostSitemapShards(urlsPerFile: number) {
  if (!postShardCache.has(urlsPerFile)) {
    postShardCache.set(
      urlsPerFile,
      getBlogPosts().then(posts => shardItems(sortPosts(posts), urlsPerFile))
    );
  }

  return postShardCache.get(urlsPerFile)!;
}

async function getArchivePathSitemapShards(urlsPerFile: number) {
  if (!archivePathShardCache.has(urlsPerFile)) {
    archivePathShardCache.set(
      urlsPerFile,
      getBlogPosts().then(posts => shardItems(getArchiveSitemapPaths(posts), urlsPerFile))
    );
  }

  return archivePathShardCache.get(urlsPerFile)!;
}

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

export function createSitemapIndexGET(
  getSiteUrl: () => string,
  options: SitemapOptions = {}
): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = getUrlsPerFile(options);
    const lastmod = formatDate(new Date());
    const postShards = await getPostSitemapShards(urlsPerFile);
    const archiveShards = await getArchivePathSitemapShards(urlsPerFile);
    const sitemapUrls = [
      `${siteUrl}/sitemap-pages.xml`,
      ...postShards.map(shard => `${siteUrl}/sitemap-posts-${shard.page}.xml`),
      ...archiveShards.map(shard => `${siteUrl}/sitemap-archives-${shard.page}.xml`)
    ];

    return xmlResponse(sitemapIndexXml(sitemapUrls, lastmod));
  };
}

export function createPagesSitemapGET(getSiteUrl: () => string): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const today = formatDate(new Date());

    return xmlResponse(sitemapXml([
      { loc: `${siteUrl}/`, lastmod: today, priority: '1.0', changefreq: 'daily' },
      { loc: `${siteUrl}/blog/`, lastmod: today, priority: '0.9', changefreq: 'daily' },
      { loc: `${siteUrl}/about/`, lastmod: today, priority: '0.6', changefreq: 'monthly' },
      { loc: `${siteUrl}/friends/`, lastmod: today, priority: '0.5', changefreq: 'monthly' },
      { loc: `${siteUrl}/search/`, lastmod: today, priority: '0.4', changefreq: 'monthly' },
    ]));
  };
}

export async function getPostSitemapStaticPaths(options: SitemapOptions = {}) {
  const urlsPerFile = getUrlsPerFile(options);
  const shards = await getPostSitemapShards(urlsPerFile);

  return shards.map(shard => ({
    params: { page: String(shard.page) },
    props: { page: shard.page }
  }));
}

export function createPostSitemapGET(
  getSiteUrl: () => string,
  options: SitemapOptions = {}
): APIRoute {
  return async ({ props }) => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = getUrlsPerFile(options);
    const page = Number(props.page || 1);
    const postShards = await getPostSitemapShards(urlsPerFile);
    const shard = postShards.find(item => item.page === page);
    const urls = shard ? getPostSitemapUrls(shard.items, siteUrl) : [];

    return xmlResponse(sitemapXml(urls));
  };
}

export async function getArchiveSitemapStaticPaths(options: SitemapOptions = {}) {
  const urlsPerFile = getUrlsPerFile(options);
  const shards = await getArchivePathSitemapShards(urlsPerFile);

  return shards.map(shard => ({
    params: { page: String(shard.page) },
    props: { page: shard.page }
  }));
}

export function createArchiveSitemapGET(
  getSiteUrl: () => string,
  options: SitemapOptions = {}
): APIRoute {
  return async ({ props }) => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = getUrlsPerFile(options);
    const page = Number(props.page || 1);
    const archiveShards = await getArchivePathSitemapShards(urlsPerFile);
    const shard = archiveShards.find(item => item.page === page);
    const urls = shard ? getArchiveSitemapUrls(shard.items, siteUrl) : [];

    return xmlResponse(sitemapXml(urls));
  };
}

export const createSitemapGET = createSitemapIndexGET;

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
