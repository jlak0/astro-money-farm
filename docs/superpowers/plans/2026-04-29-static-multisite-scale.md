# Static Multisite Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each Astro site remain fully static and independently deployable while scaling archive pages, sitemaps, and search metadata for 1000+ articles per site.

**Architecture:** Add pure pagination and sitemap helpers in `packages/core`, then make shared page components consume paginated props instead of rendering all posts. Keep site route files thin by adding static wrapper routes for page 2+ archives and sitemap shards in every site template/current site.

**Tech Stack:** Astro 4, pnpm workspaces, Node test runner, Cloudflare Pages static deploys.

---

## File Structure

- Create `packages/core/utils/pagination.ts`
  - Pure helpers for item pagination, archive URL generation, tag counts, and sitemap URL sharding.
- Modify `packages/core/utils/index.ts`
  - Re-export pagination helpers.
- Create `packages/core/components/Pagination.astro`
  - Shared pagination navigation UI for all archive pages.
- Modify `packages/core/components/index.ts`
  - Export `Pagination`.
- Modify `packages/core/pages/static-paths.ts`
  - Add paginated static path helpers while keeping existing helper names compatible.
- Modify `packages/core/pages/BlogListPage.astro`
  - Accept page props and render only current page posts.
- Modify `packages/core/pages/BlogCategoryPage.astro`
  - Accept paginated props and render only current category page.
- Modify `packages/core/pages/BlogTagPage.astro`
  - Accept paginated props and render only current tag page.
- Modify `packages/core/routes/index.ts`
  - Replace single sitemap implementation with sitemap index, pages sitemap, post shards, archive shards, and reusable static path helpers.
- Modify current site route files under:
  - `sites/money-platforms/src/pages`
  - `sites/weight-loss/src/pages`
  - `sites/template/src/pages`
- Create new route files in each site:
  - `src/pages/blog/page/[page].astro`
  - `src/pages/blog/category/[category]/page/[page].astro`
  - `src/pages/blog/tag/[tag]/page/[page].astro`
  - `src/pages/sitemap-pages.xml.ts`
  - `src/pages/sitemap-posts-[page].xml.ts`
  - `src/pages/sitemap-archives-[page].xml.ts`
- Create `scripts/pagination-utils.test.mjs`
  - Unit tests for pure helper behavior.
- Modify `scripts/site-functionality.test.mjs`
  - Add built-output assertions for paginated archives and sitemap shards.
- Modify `scripts/assert-site-pages.mjs`
  - Keep route thinness checks compatible with new files.
- Modify `package.json`
  - Add `test:pagination-utils`.
- Modify `scripts/deploy-site.sh`
  - Allow explicit Pages project names from a command argument or env var while preserving default behavior.

---

### Task 1: Add Pure Pagination Helpers

**Files:**
- Create: `packages/core/utils/pagination.ts`
- Modify: `packages/core/utils/index.ts`
- Create: `scripts/pagination-utils.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing helper tests**

Create `scripts/pagination-utils.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

const {
  DEFAULT_PAGINATION,
  buildPageUrl,
  countTags,
  paginateItems,
  shardItems
} = await import('../packages/core/utils/pagination.ts');

test('paginateItems slices items and builds page metadata', () => {
  const items = Array.from({ length: 55 }, (_, index) => `post-${index + 1}`);
  const page = paginateItems(items, {
    currentPage: 2,
    pageSize: 24,
    basePath: '/blog'
  });

  assert.deepEqual(page.items, items.slice(24, 48));
  assert.equal(page.pagination.currentPage, 2);
  assert.equal(page.pagination.totalPages, 3);
  assert.equal(page.pagination.totalItems, 55);
  assert.equal(page.pagination.basePath, '/blog');
  assert.equal(page.pagination.prevUrl, '/blog/');
  assert.equal(page.pagination.nextUrl, '/blog/page/3/');
});

test('buildPageUrl keeps page one canonical', () => {
  assert.equal(buildPageUrl('/blog', 1), '/blog/');
  assert.equal(buildPageUrl('/blog', 2), '/blog/page/2/');
  assert.equal(buildPageUrl('/blog/category/AI', 1), '/blog/category/AI/');
  assert.equal(buildPageUrl('/blog/category/AI', 3), '/blog/category/AI/page/3/');
});

test('countTags returns most frequent tags first with stable tie sorting', () => {
  const posts = [
    { data: { tags: ['beta', 'alpha'] } },
    { data: { tags: ['beta'] } },
    { data: { tags: ['alpha', 'gamma'] } }
  ];

  assert.deepEqual(countTags(posts, 2), [
    { tag: 'alpha', count: 2 },
    { tag: 'beta', count: 2 }
  ]);
});

test('shardItems splits lists by configured shard size', () => {
  const shards = shardItems(['a', 'b', 'c', 'd', 'e'], 2);

  assert.deepEqual(shards, [
    { page: 1, items: ['a', 'b'] },
    { page: 2, items: ['c', 'd'] },
    { page: 3, items: ['e'] }
  ]);
});

test('default constants match approved scale design', () => {
  assert.equal(DEFAULT_PAGINATION.postsPerPage, 24);
  assert.equal(DEFAULT_PAGINATION.visibleTagsLimit, 80);
  assert.equal(DEFAULT_PAGINATION.sitemapUrlsPerFile, 500);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
node --test scripts/pagination-utils.test.mjs
```

Expected: FAIL because `packages/core/utils/pagination.ts` does not exist.

- [ ] **Step 3: Implement the pure helpers**

Create `packages/core/utils/pagination.ts`:

```ts
export const DEFAULT_PAGINATION = {
  postsPerPage: 24,
  visibleTagsLimit: 80,
  sitemapUrlsPerFile: 500
} as const;

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  basePath: string;
  prevUrl: string | null;
  nextUrl: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationOptions {
  currentPage?: number;
  pageSize?: number;
  basePath: string;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Shard<T> {
  page: number;
  items: T[];
}

export function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export function buildPageUrl(basePath: string, page: number): string {
  const normalized = normalizeBasePath(basePath);
  if (page <= 1) {
    return `${normalized || ''}/`;
  }
  return `${normalized}/page/${page}/`;
}

export function paginateItems<T>(items: T[], options: PaginationOptions): PaginatedResult<T> {
  const pageSize = Math.max(1, options.pageSize || DEFAULT_PAGINATION.postsPerPage);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, options.currentPage || 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const basePath = normalizeBasePath(options.basePath) || '/';

  return {
    items: pageItems,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      basePath,
      prevUrl: currentPage > 1 ? buildPageUrl(basePath, currentPage - 1) : null,
      nextUrl: currentPage < totalPages ? buildPageUrl(basePath, currentPage + 1) : null
    }
  };
}

export function countTags<T extends { data: { tags?: string[] } }>(
  posts: T[],
  limit = DEFAULT_PAGINATION.visibleTagsLimit
): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export function shardItems<T>(items: T[], shardSize: number): Shard<T>[] {
  const safeShardSize = Math.max(1, shardSize);
  const shards: Shard<T>[] = [];

  for (let index = 0; index < items.length; index += safeShardSize) {
    shards.push({
      page: shards.length + 1,
      items: items.slice(index, index + safeShardSize)
    });
  }

  return shards.length > 0 ? shards : [{ page: 1, items: [] }];
}
```

Modify `packages/core/utils/index.ts` by adding this export at the bottom:

```ts
export * from './pagination';
```

Modify root `package.json` scripts:

```json
"test:pagination-utils": "node --test scripts/pagination-utils.test.mjs"
```

- [ ] **Step 4: Run the helper test and verify it passes**

Run:

```bash
node --test scripts/pagination-utils.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json packages/core/utils/index.ts packages/core/utils/pagination.ts scripts/pagination-utils.test.mjs
git commit -m "feat: add pagination utilities"
```

---

### Task 2: Add Paginated Static Path Helpers

**Files:**
- Modify: `packages/core/pages/static-paths.ts`
- Modify: `packages/core/pages/index.ts`

- [ ] **Step 1: Replace static path helpers with paginated variants**

Modify `packages/core/pages/static-paths.ts`:

```ts
import { getCollection } from 'astro:content';
import {
  DEFAULT_PAGINATION,
  countTags,
  paginateItems,
  type PaginationMeta,
  type TagCount
} from '../utils';

export interface ArchivePageProps<T> {
  posts: T[];
  pagination: PaginationMeta;
  categories?: string[];
  visibleTags?: TagCount[];
}

export interface PaginatedStaticPathOptions {
  postsPerPage?: number;
  visibleTagsLimit?: number;
}

function sortPosts<T extends { data: { publishDate: Date } }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

function numberedPages(totalItems: number, pageSize: number): number[] {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

export async function getBlogPostStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export async function getBlogIndexPageProps(options: PaginatedStaticPathOptions = {}) {
  const posts = sortPosts(await getCollection('blog'));
  const postsPerPage = options.postsPerPage || DEFAULT_PAGINATION.postsPerPage;
  const categories = [...new Set(posts.map(p => p.data.category))];
  const visibleTags = countTags(posts, options.visibleTagsLimit || DEFAULT_PAGINATION.visibleTagsLimit);
  const page = paginateItems(posts, {
    currentPage: 1,
    pageSize: postsPerPage,
    basePath: '/blog'
  });

  return {
    posts: page.items,
    pagination: page.pagination,
    categories,
    visibleTags
  };
}

export async function getBlogIndexStaticPaths(options: PaginatedStaticPathOptions = {}) {
  const posts = sortPosts(await getCollection('blog'));
  const postsPerPage = options.postsPerPage || DEFAULT_PAGINATION.postsPerPage;
  const categories = [...new Set(posts.map(p => p.data.category))];
  const visibleTags = countTags(posts, options.visibleTagsLimit || DEFAULT_PAGINATION.visibleTagsLimit);

  return numberedPages(posts.length, postsPerPage)
    .filter(pageNumber => pageNumber > 1)
    .map(pageNumber => {
      const page = paginateItems(posts, {
        currentPage: pageNumber,
        pageSize: postsPerPage,
        basePath: '/blog'
      });

      return {
        params: { page: String(pageNumber) },
        props: {
          posts: page.items,
          pagination: page.pagination,
          categories,
          visibleTags
        }
      };
    });
}

export async function getBlogCategoryStaticPaths(options: PaginatedStaticPathOptions = {}) {
  const posts = await getCollection('blog');
  const postsPerPage = options.postsPerPage || DEFAULT_PAGINATION.postsPerPage;
  const categories = [...new Set(posts.map(p => p.data.category))];

  return categories.flatMap(category => {
    const categoryPosts = sortPosts(posts.filter(p => p.data.category === category));

    return numberedPages(categoryPosts.length, postsPerPage).map(pageNumber => {
      const page = paginateItems(categoryPosts, {
        currentPage: pageNumber,
        pageSize: postsPerPage,
        basePath: `/blog/category/${category}`
      });

      return {
        params: pageNumber === 1
          ? { category }
          : { category, page: String(pageNumber) },
        props: {
          category,
          posts: page.items,
          pagination: page.pagination
        }
      };
    });
  });
}

export async function getBlogTagStaticPaths(options: PaginatedStaticPathOptions = {}) {
  const posts = await getCollection('blog');
  const postsPerPage = options.postsPerPage || DEFAULT_PAGINATION.postsPerPage;
  const allTags = [...new Set(posts.flatMap(p => p.data.tags || []))];

  return allTags.flatMap(tag => {
    const tagPosts = sortPosts(posts.filter(p => p.data.tags?.includes(tag)));

    return numberedPages(tagPosts.length, postsPerPage).map(pageNumber => {
      const page = paginateItems(tagPosts, {
        currentPage: pageNumber,
        pageSize: postsPerPage,
        basePath: `/blog/tag/${tag}`
      });

      return {
        params: pageNumber === 1
          ? { tag }
          : { tag, page: String(pageNumber) },
        props: {
          tag,
          posts: page.items,
          pagination: page.pagination
        }
      };
    });
  });
}
```

Confirm `packages/core/pages/index.ts` still exports all helpers from `./static-paths`; keep the existing export block if present.

- [ ] **Step 2: Run TypeScript/Astro check**

Run:

```bash
pnpm --filter @astro-money-farm/money-platforms check
```

Expected: PASS or fail only because page components do not yet accept new props. If it fails for missing props, continue to Task 3 before committing Task 2.

- [ ] **Step 3: Commit after Task 3 if check depends on page props**

Do not commit this task alone if `astro check` fails. Commit together with Task 3 using the Task 3 commit command.

---

### Task 3: Make Archive Components Render Paginated Props

**Files:**
- Create: `packages/core/components/Pagination.astro`
- Modify: `packages/core/components/index.ts`
- Modify: `packages/core/pages/BlogListPage.astro`
- Modify: `packages/core/pages/BlogCategoryPage.astro`
- Modify: `packages/core/pages/BlogTagPage.astro`

- [ ] **Step 1: Add shared pagination navigation**

Create `packages/core/components/Pagination.astro`:

```astro
---
import type { PaginationMeta } from '../utils';

export interface Props {
  pagination?: PaginationMeta;
}

const { pagination } = Astro.props;
const shouldRender = pagination && pagination.totalPages > 1;
---

{shouldRender && (
  <nav class="pagination" aria-label="分页导航">
    {pagination.prevUrl ? (
      <a class="pagination-link" href={pagination.prevUrl}>上一页</a>
    ) : (
      <span class="pagination-link disabled">上一页</span>
    )}
    <span class="pagination-status">
      第 {pagination.currentPage} / {pagination.totalPages} 页
    </span>
    {pagination.nextUrl ? (
      <a class="pagination-link" href={pagination.nextUrl}>下一页</a>
    ) : (
      <span class="pagination-link disabled">下一页</span>
    )}
  </nav>
)}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .pagination-link {
    min-width: 5rem;
    padding: 0.625rem 1rem;
    text-align: center;
    color: var(--accent-color);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    text-decoration: none;
  }

  .pagination-link:hover {
    border-color: var(--accent-color);
    text-decoration: none;
  }

  .pagination-link.disabled {
    color: var(--text-secondary);
    opacity: 0.55;
    pointer-events: none;
  }

  .pagination-status {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .pagination {
      gap: 0.5rem;
    }

    .pagination-link {
      min-width: 4.5rem;
      padding: 0.55rem 0.75rem;
    }
  }
</style>
```

Modify `packages/core/components/index.ts`:

```ts
export { default as Pagination } from './Pagination.astro';
```

- [ ] **Step 2: Update BlogListPage props and rendering**

Modify `packages/core/pages/BlogListPage.astro` so imports and props use pre-paginated values:

```astro
---
import { AdBanner, BaseLayout, BlogCard, Pagination } from '../components';
import { getBlogIndexPageProps } from './static-paths';
import type { CollectionEntry } from 'astro:content';
import type { PaginationMeta, TagCount } from '../utils';

export interface Props {
  config: any;
  posts?: CollectionEntry<'blog'>[];
  pagination?: PaginationMeta;
  categories?: string[];
  visibleTags?: TagCount[];
}

const {
  config,
  posts: providedPosts,
  pagination: providedPagination,
  categories: providedCategories,
  visibleTags: providedVisibleTags
} = Astro.props;
const lang = config.site?.lang === 'en-US' || config.language === 'en-US' ? 'en-US' : 'zh-CN';
const siteName = config.site?.name || (lang === 'en-US' ? 'Site' : '站点');
const fallback = providedPosts && providedPagination
  ? null
  : await getBlogIndexPageProps();

const posts = providedPosts || fallback?.posts || [];
const pagination = providedPagination || fallback?.pagination;
const categories = providedCategories || fallback?.categories || [];
const visibleTags = providedVisibleTags || fallback?.visibleTags || [];
```

Keep the existing labels. Replace `sortedPosts.length` with `pagination?.totalItems || posts.length`. Replace the tag loop with:

```astro
{visibleTags.length > 0 && (
  <div class="filter-section">
    <h3 class="filter-title">{t.tags}</h3>
    <div class="filter-tags">
      {visibleTags.map(({ tag, count }) => (
        <a href={`/blog/tag/${tag}`} class="filter-tag">#{tag} ({count})</a>
      ))}
    </div>
  </div>
)}
```

Replace the post loop with:

```astro
{posts.map(post => <BlogCard config={config} post={post} />)}
```

Add `<Pagination pagination={pagination} />` after the posts grid and before the inline ad.

- [ ] **Step 3: Update category and tag pages**

Modify `packages/core/pages/BlogCategoryPage.astro` and `packages/core/pages/BlogTagPage.astro`:

```astro
---
import { AdBanner, BaseLayout, BlogCard, Pagination } from '../components';
import type { CollectionEntry } from 'astro:content';
import type { PaginationMeta } from '../utils';

export interface Props {
  config: any;
  category?: string;
  tag?: string;
  posts: CollectionEntry<'blog'>[];
  pagination?: PaginationMeta;
}
```

In each page, use `pagination?.totalItems || posts.length` for count text if the page displays a count. Add this after the posts grid:

```astro
<Pagination pagination={pagination} />
```

Keep existing page titles, breadcrumbs, and CSS unless pagination needs spacing.

- [ ] **Step 4: Run check**

Run:

```bash
pnpm --filter @astro-money-farm/money-platforms check
```

Expected: PASS.

- [ ] **Step 5: Commit Tasks 2 and 3 together**

```bash
git add packages/core/components/Pagination.astro packages/core/components/index.ts packages/core/pages/static-paths.ts packages/core/pages/index.ts packages/core/pages/BlogListPage.astro packages/core/pages/BlogCategoryPage.astro packages/core/pages/BlogTagPage.astro
git commit -m "feat: paginate archive pages"
```

---

### Task 4: Add Thin Paginated Archive Routes To Every Site

**Files:**
- Modify: `sites/money-platforms/src/pages/blog/index.astro`
- Modify: `sites/weight-loss/src/pages/blog/index.astro`
- Modify: `sites/template/src/pages/blog/index.astro`
- Create in each site: `src/pages/blog/page/[page].astro`
- Create in each site: `src/pages/blog/category/[category]/page/[page].astro`
- Create in each site: `src/pages/blog/tag/[tag]/page/[page].astro`

- [ ] **Step 1: Update each `/blog/index.astro` wrapper**

Use this content for `sites/money-platforms/src/pages/blog/index.astro`, `sites/weight-loss/src/pages/blog/index.astro`, and `sites/template/src/pages/blog/index.astro`, adjusting only the relative import path if the file depth differs:

```astro
---
import { BlogListPage, getBlogIndexPageProps } from '@astro-money-farm/core/pages';
import siteConfig from '../../config';

const props = await getBlogIndexPageProps();
---

<BlogListPage config={siteConfig} {...props} />
```

- [ ] **Step 2: Create each blog index page route**

Create `src/pages/blog/page/[page].astro` in each site:

```astro
---
import { BlogListPage, getBlogIndexStaticPaths } from '@astro-money-farm/core/pages';
import siteConfig from '../../../config';

export const getStaticPaths = getBlogIndexStaticPaths;

const { posts, pagination, categories, visibleTags } = Astro.props;
---

<BlogListPage
  config={siteConfig}
  posts={posts}
  pagination={pagination}
  categories={categories}
  visibleTags={visibleTags}
/>
```

- [ ] **Step 3: Update each category page 1 route**

Set `src/pages/blog/category/[category].astro` in each site to:

```astro
---
import { BlogCategoryPage, getBlogCategoryStaticPaths } from '@astro-money-farm/core/pages';
import siteConfig from '../../../config';

export const getStaticPaths = async () => {
  const paths = await getBlogCategoryStaticPaths();
  return paths.filter((path) => !path.params.page);
};

const { category, posts, pagination } = Astro.props;
---

<BlogCategoryPage config={siteConfig} category={category} posts={posts} pagination={pagination} />
```

- [ ] **Step 4: Create each category page 2+ route**

Create `src/pages/blog/category/[category]/page/[page].astro` in each site:

```astro
---
import { BlogCategoryPage, getBlogCategoryStaticPaths } from '@astro-money-farm/core/pages';
import siteConfig from '../../../../../config';

export const getStaticPaths = async () => {
  const paths = await getBlogCategoryStaticPaths();
  return paths.filter((path) => path.params.page);
};

const { category, posts, pagination } = Astro.props;
---

<BlogCategoryPage config={siteConfig} category={category} posts={posts} pagination={pagination} />
```

- [ ] **Step 5: Update each tag page 1 route**

Set `src/pages/blog/tag/[tag].astro` in each site to:

```astro
---
import { BlogTagPage, getBlogTagStaticPaths } from '@astro-money-farm/core/pages';
import siteConfig from '../../../config';

export const getStaticPaths = async () => {
  const paths = await getBlogTagStaticPaths();
  return paths.filter((path) => !path.params.page);
};

const { tag, posts, pagination } = Astro.props;
---

<BlogTagPage config={siteConfig} tag={tag} posts={posts} pagination={pagination} />
```

- [ ] **Step 6: Create each tag page 2+ route**

Create `src/pages/blog/tag/[tag]/page/[page].astro` in each site:

```astro
---
import { BlogTagPage, getBlogTagStaticPaths } from '@astro-money-farm/core/pages';
import siteConfig from '../../../../../config';

export const getStaticPaths = async () => {
  const paths = await getBlogTagStaticPaths();
  return paths.filter((path) => path.params.page);
};

const { tag, posts, pagination } = Astro.props;
---

<BlogTagPage config={siteConfig} tag={tag} posts={posts} pagination={pagination} />
```

- [ ] **Step 7: Run thin-route assertion**

Run:

```bash
node scripts/assert-site-pages.mjs
```

Expected: PASS.

- [ ] **Step 8: Build current sites**

Run:

```bash
pnpm --filter @astro-money-farm/money-platforms build
pnpm --filter @astro-money-farm/weight-loss build
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add sites/money-platforms/src/pages sites/weight-loss/src/pages sites/template/src/pages
git commit -m "feat: add static paginated archive routes"
```

---

### Task 5: Split Static Sitemaps

**Files:**
- Modify: `packages/core/routes/index.ts`
- Modify in each site:
  - `src/pages/sitemap-index.xml.ts`
  - `src/pages/sitemap.xml.ts`
- Create in each site:
  - `src/pages/sitemap-pages.xml.ts`
  - `src/pages/sitemap-posts-[page].xml.ts`
  - `src/pages/sitemap-archives-[page].xml.ts`

- [ ] **Step 1: Add sitemap route helpers**

Modify `packages/core/routes/index.ts` by keeping `createRobotsGET` and `createSearchIndexGET`, then replacing sitemap helpers with:

```ts
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

function xmlResponse(body: string) {
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function sitemapXml(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

async function getPostSitemapUrls(siteUrl: string): Promise<SitemapUrl[]> {
  const posts = await getCollection('blog');

  return posts
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .map(post => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      lastmod: formatDate(post.data.modifiedDate || post.data.publishDate),
      changefreq: 'weekly',
      priority: '0.8',
    }));
}

async function getArchiveSitemapUrls(siteUrl: string): Promise<SitemapUrl[]> {
  const posts = await getCollection('blog');
  const today = formatDate(new Date());
  const postCount = posts.length;
  const blogPages = Math.max(1, Math.ceil(postCount / DEFAULT_PAGINATION.postsPerPage));
  const categories = [...new Set(posts.map(p => p.data.category))];
  const tags = [...new Set(posts.flatMap(p => p.data.tags || []))];
  const urls: SitemapUrl[] = [];

  for (let page = 1; page <= blogPages; page += 1) {
    urls.push({
      loc: `${siteUrl}${buildPageUrl('/blog', page)}`,
      lastmod: today,
      changefreq: 'daily',
      priority: page === 1 ? '0.9' : '0.7',
    });
  }

  for (const category of categories) {
    const count = posts.filter(p => p.data.category === category).length;
    const totalPages = Math.max(1, Math.ceil(count / DEFAULT_PAGINATION.postsPerPage));
    for (let page = 1; page <= totalPages; page += 1) {
      urls.push({
        loc: `${siteUrl}${buildPageUrl(`/blog/category/${category}`, page)}`,
        lastmod: today,
        changefreq: 'daily',
        priority: '0.7',
      });
    }
  }

  for (const tag of tags) {
    const count = posts.filter(p => p.data.tags?.includes(tag)).length;
    const totalPages = Math.max(1, Math.ceil(count / DEFAULT_PAGINATION.postsPerPage));
    for (let page = 1; page <= totalPages; page += 1) {
      urls.push({
        loc: `${siteUrl}${buildPageUrl(`/blog/tag/${tag}`, page)}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.6',
      });
    }
  }

  return urls;
}

export function createSitemapIndexGET(getSiteUrl: () => string, options: SitemapOptions = {}): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = options.urlsPerFile || DEFAULT_PAGINATION.sitemapUrlsPerFile;
    const lastmod = formatDate(new Date());
    const postShards = shardItems(await getPostSitemapUrls(siteUrl), urlsPerFile);
    const archiveShards = shardItems(await getArchiveSitemapUrls(siteUrl), urlsPerFile);
    const sitemapUrls = [
      `${siteUrl}/sitemap-pages.xml`,
      ...postShards.map(shard => `${siteUrl}/sitemap-posts-${shard.page}.xml`),
      ...archiveShards.map(shard => `${siteUrl}/sitemap-archives-${shard.page}.xml`)
    ];

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(loc => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`);
  };
}

export function createPagesSitemapGET(getSiteUrl: () => string): APIRoute {
  return async () => {
    const siteUrl = getSiteUrl();
    const today = formatDate(new Date());

    return xmlResponse(sitemapXml([
      { loc: siteUrl, lastmod: today, priority: '1.0', changefreq: 'daily' },
      { loc: `${siteUrl}/blog/`, lastmod: today, priority: '0.9', changefreq: 'daily' },
      { loc: `${siteUrl}/about/`, lastmod: today, priority: '0.6', changefreq: 'monthly' },
      { loc: `${siteUrl}/friends/`, lastmod: today, priority: '0.5', changefreq: 'monthly' },
      { loc: `${siteUrl}/search/`, lastmod: today, priority: '0.4', changefreq: 'monthly' },
    ]));
  };
}

export async function getPostSitemapStaticPaths(options: SitemapOptions = {}) {
  const siteUrl = 'https://example.com';
  const urlsPerFile = options.urlsPerFile || DEFAULT_PAGINATION.sitemapUrlsPerFile;
  return shardItems(await getPostSitemapUrls(siteUrl), urlsPerFile).map(shard => ({
    params: { page: String(shard.page) },
    props: { page: shard.page }
  }));
}

export function createPostSitemapGET(getSiteUrl: () => string, options: SitemapOptions = {}): APIRoute {
  return async ({ props }) => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = options.urlsPerFile || DEFAULT_PAGINATION.sitemapUrlsPerFile;
    const page = Number(props.page || 1);
    const shard = shardItems(await getPostSitemapUrls(siteUrl), urlsPerFile).find(item => item.page === page);

    return xmlResponse(sitemapXml(shard?.items || []));
  };
}

export async function getArchiveSitemapStaticPaths(options: SitemapOptions = {}) {
  const siteUrl = 'https://example.com';
  const urlsPerFile = options.urlsPerFile || DEFAULT_PAGINATION.sitemapUrlsPerFile;
  return shardItems(await getArchiveSitemapUrls(siteUrl), urlsPerFile).map(shard => ({
    params: { page: String(shard.page) },
    props: { page: shard.page }
  }));
}

export function createArchiveSitemapGET(getSiteUrl: () => string, options: SitemapOptions = {}): APIRoute {
  return async ({ props }) => {
    const siteUrl = getSiteUrl();
    const urlsPerFile = options.urlsPerFile || DEFAULT_PAGINATION.sitemapUrlsPerFile;
    const page = Number(props.page || 1);
    const shard = shardItems(await getArchiveSitemapUrls(siteUrl), urlsPerFile).find(item => item.page === page);

    return xmlResponse(sitemapXml(shard?.items || []));
  };
}

export const createSitemapGET = createPagesSitemapGET;
```

- [ ] **Step 2: Update sitemap route wrappers in every site**

For each of `sites/money-platforms`, `sites/weight-loss`, and `sites/template`, set `src/pages/sitemap-index.xml.ts` to:

```ts
import { createSitemapIndexGET } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const GET = createSitemapIndexGET(getSiteUrl);
```

Set `src/pages/sitemap.xml.ts` to a compatibility alias:

```ts
import { createPagesSitemapGET } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const GET = createPagesSitemapGET(getSiteUrl);
```

Create `src/pages/sitemap-pages.xml.ts`:

```ts
import { createPagesSitemapGET } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const GET = createPagesSitemapGET(getSiteUrl);
```

Create `src/pages/sitemap-posts-[page].xml.ts`:

```ts
import { createPostSitemapGET, getPostSitemapStaticPaths } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const getStaticPaths = getPostSitemapStaticPaths;
export const GET = createPostSitemapGET(getSiteUrl);
```

Create `src/pages/sitemap-archives-[page].xml.ts`:

```ts
import { createArchiveSitemapGET, getArchiveSitemapStaticPaths } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const getStaticPaths = getArchiveSitemapStaticPaths;
export const GET = createArchiveSitemapGET(getSiteUrl);
```

- [ ] **Step 3: Build and inspect sitemap output**

Run:

```bash
pnpm --filter @astro-money-farm/money-platforms build
```

Expected files:

```text
sites/money-platforms/dist/sitemap-index.xml
sites/money-platforms/dist/sitemap-pages.xml
sites/money-platforms/dist/sitemap-posts-1.xml
sites/money-platforms/dist/sitemap-archives-1.xml
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/routes/index.ts sites/money-platforms/src/pages sites/weight-loss/src/pages sites/template/src/pages
git commit -m "feat: split static sitemaps"
```

---

### Task 6: Add Built Output Regression Tests

**Files:**
- Modify: `scripts/site-functionality.test.mjs`
- Modify: `scripts/assert-site-pages.mjs`

- [ ] **Step 1: Add archive and sitemap assertions**

Append these tests to `scripts/site-functionality.test.mjs`:

```js
test('money-platforms blog archive is paginated instead of rendering every post card', () => {
  assert.ok(
    existsSync(moneyPlatformsDist),
    'Run pnpm --filter @astro-money-farm/money-platforms build before this test'
  );

  const blogIndex = readFileSync(join(moneyPlatformsDist, 'blog', 'index.html'), 'utf8');
  const articlePages = readdirSync(join(moneyPlatformsDist, 'blog'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !['category', 'tag', 'page'].includes(entry.name));

  const renderedCards = (blogIndex.match(/class="blog-card"/g) || []).length;

  assert.ok(articlePages.length > 24, 'fixture site should have more than one page of articles');
  assert.ok(renderedCards <= 24, `expected at most 24 rendered cards, found ${renderedCards}`);
  assert.match(blogIndex, /\/blog\/page\/2\//);
});

test('money-platforms build emits split static sitemaps', () => {
  const expected = [
    'sitemap-index.xml',
    'sitemap-pages.xml',
    'sitemap-posts-1.xml',
    'sitemap-archives-1.xml'
  ];

  for (const file of expected) {
    assert.equal(existsSync(join(moneyPlatformsDist, file)), true, `${file} should exist`);
  }

  const sitemapIndex = readFileSync(join(moneyPlatformsDist, 'sitemap-index.xml'), 'utf8');
  assert.match(sitemapIndex, /sitemap-pages\.xml/);
  assert.match(sitemapIndex, /sitemap-posts-1\.xml/);
  assert.match(sitemapIndex, /sitemap-archives-1\.xml/);
});
```

If Astro changes scoped class output so `class="blog-card"` is not exact, replace the card count expression with:

```js
const renderedCards = (blogIndex.match(/blog-card/g) || []).length;
```

- [ ] **Step 2: Keep site-page assertion compatible**

Run:

```bash
node scripts/assert-site-pages.mjs
```

If any new route exceeds 30 non-empty lines, reduce whitespace in that route file. Do not relax the test unless the route cannot stay thin.

- [ ] **Step 3: Run build and site functionality tests**

Run:

```bash
pnpm --filter @astro-money-farm/money-platforms build
node --test scripts/site-functionality.test.mjs
node scripts/assert-site-pages.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/site-functionality.test.mjs scripts/assert-site-pages.mjs
git commit -m "test: assert static pagination output"
```

---

### Task 7: Make Deploy Project Names Explicitly Configurable

**Files:**
- Modify: `scripts/deploy-site.sh`

- [ ] **Step 1: Update deploy script**

Modify `scripts/deploy-site.sh` so the Pages project name can be passed as the third argument or `PAGES_PROJECT_NAME`:

```bash
#!/bin/bash
# 用法: ./scripts/deploy-site.sh <站点目录> [环境] [pages项目名]
# 示例: ./scripts/deploy-site.sh test-site production my-pages-project

if [ -z "$1" ]; then
  echo "用法: ./scripts/deploy-site.sh <站点目录> [环境] [pages项目名]"
  exit 1
fi

SITE_NAME=$1
ENV=${2:-production}
SITE_DIR="$(dirname "$0")/../sites/$SITE_NAME"
PAGES_PROJECT=${3:-${PAGES_PROJECT_NAME:-$SITE_NAME}}

if [ ! -d "$SITE_DIR" ]; then
  echo "错误: 站点 $SITE_NAME 不存在"
  exit 1
fi

echo "=== 部署站点: $SITE_NAME ($ENV) ==="
echo "Pages项目: $PAGES_PROJECT"

cd "$SITE_DIR"

echo "1. 构建中..."
pnpm build

if [ -f "wrangler.toml" ]; then
  echo "2. 部署到 Cloudflare Pages..."
  npx wrangler pages deploy dist --project-name="$PAGES_PROJECT"
else
  echo "2. 打包完成，dist/ 目录已准备好"
fi

echo "=== 部署完成 ==="
```

- [ ] **Step 2: Add a script test**

Append to `scripts/create-site.test.mjs`:

```js
test('deploy-site accepts explicit pages project name', () => {
  const source = readFileSync(join(repoRoot, 'scripts', 'deploy-site.sh'), 'utf8');

  assert.match(source, /PAGES_PROJECT=\$\{3:-\$\{PAGES_PROJECT_NAME:-\$SITE_NAME\}\}/);
  assert.match(source, /--project-name="\$PAGES_PROJECT"/);
});
```

- [ ] **Step 3: Run script tests**

Run:

```bash
node --test scripts/create-site.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/deploy-site.sh scripts/create-site.test.mjs
git commit -m "feat: configure pages project deploy name"
```

---

### Task 8: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full relevant test suite**

Run:

```bash
node --test scripts/pagination-utils.test.mjs
node --test scripts/create-site.test.mjs
node --test scripts/site-functionality.test.mjs
node scripts/assert-site-pages.mjs
node scripts/assert-core-sharing.mjs
pnpm --filter @astro-money-farm/money-platforms build
pnpm --filter @astro-money-farm/weight-loss build
```

Expected: all commands PASS.

- [ ] **Step 2: Inspect generated page counts**

Run:

```bash
find sites/money-platforms/dist/blog/page -type f | sort | head
find sites/money-platforms/dist -maxdepth 1 -name 'sitemap-*.xml' | sort
wc -c sites/money-platforms/dist/blog/index.html sites/money-platforms/dist/search-index.json
```

Expected:

- `/blog/page/2/index.html` exists for `money-platforms`.
- sitemap shard files exist.
- `/blog/index.html` is substantially smaller than the previous all-post archive.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: no uncommitted changes, because each task committed independently.

---

## Self-Review Checklist

- Spec coverage:
  - Fully static output: Tasks 2-5.
  - Independent site deployment: Task 7.
  - Paginated blog/category/tag archives: Tasks 2-4.
  - Sitemap index and shards: Task 5.
  - Compact search index preserved: Task 5 leaves `createSearchIndexGET` metadata-only.
  - Tests for scale behavior: Tasks 1 and 6.
- Placeholder scan: no incomplete implementation markers are intentionally left in this plan.
- Type consistency:
  - `PaginationMeta` is defined in `packages/core/utils/pagination.ts` and imported by archive components.
  - `getBlogIndexPageProps`, `getBlogIndexStaticPaths`, `getBlogCategoryStaticPaths`, and `getBlogTagStaticPaths` are exported through `packages/core/pages/index.ts`.
  - `createPagesSitemapGET`, `createPostSitemapGET`, `createArchiveSitemapGET`, `getPostSitemapStaticPaths`, and `getArchiveSitemapStaticPaths` are exported from `packages/core/routes/index.ts`.
