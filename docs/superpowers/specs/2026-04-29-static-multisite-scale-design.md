# Static Multisite Scale Design

## Goal

Support many independent Astro sites in this monorepo, with each site deployed separately to Cloudflare Pages as a fully static build, while keeping single-site performance healthy at 1000+ articles.

## Current Context

The repository already uses a pnpm workspace and Turborepo layout:

- `sites/<site>` contains each deployable Astro site.
- `packages/core` contains shared layouts, pages, components, config utilities, and route helpers.
- Site pages are thin wrappers that import shared page components and static path helpers from `@astro-money-farm/core`.
- `scripts/deploy-site.sh <site>` builds one site and deploys that site's `dist/` to Cloudflare Pages.

The current implementation works for small sites but does not scale cleanly because `/blog` renders all posts and all tags on one page, category and tag pages are not paginated, and sitemap output is a single file. With 1000+ articles this creates large HTML pages, too many links per page, and sitemap growth that should be managed explicitly.

## Requirements

- Build output must remain fully static.
- Each `sites/<site>` project must remain independently buildable and deployable to its own Cloudflare Pages project.
- Shared behavior should live in `packages/core`; site wrappers should stay minimal.
- Blog listing pages must not render all posts at once.
- Category and tag archive pages must support pagination.
- Sitemaps must be split into predictable static files and referenced by a sitemap index.
- Search should remain static and client-side, with a compact metadata-only index by default.
- The design must work for at least 1000 articles per site without requiring SSR, databases, or Pages Functions.

## Architecture

Keep the current monorepo structure and strengthen the contract between site wrappers and `packages/core`.

`packages/core` owns scalable blog primitives:

- pagination utilities
- paginated static path generation
- shared archive page components
- sitemap partition helpers
- compact search index route helpers

Each `sites/<site>` project owns only site-specific routing files, content, config, and deployment metadata. Route files call core helpers and pass props into core page components.

All generated routes are static. Astro builds every article page, archive page, sitemap shard, search index, robots file, and normal content page during `astro build`.

## Routing

Use these canonical routes:

- Blog index page 1: `/blog/`
- Blog index page 2+: `/blog/page/2/`
- Category page 1: `/blog/category/<category>/`
- Category page 2+: `/blog/category/<category>/page/2/`
- Tag page 1: `/blog/tag/<tag>/`
- Tag page 2+: `/blog/tag/<tag>/page/2/`
- Article page: `/blog/<slug>/`

The page 1 route remains the canonical first page for each archive. Page 2+ routes include pagination metadata and navigation links back to page 1.

Default pagination size:

- `postsPerPage = 24`

This keeps archive HTML small while giving users enough entries per page.

## Archive Pages

`BlogListPage`, `BlogCategoryPage`, and `BlogTagPage` should receive already-paginated props instead of independently rendering every matching post.

The page props should include:

- `posts`: posts for the current page only
- `pagination.currentPage`
- `pagination.totalPages`
- `pagination.totalItems`
- `pagination.basePath`
- `pagination.prevUrl`
- `pagination.nextUrl`

The `/blog` index may show category filters and a limited popular tag list. It must not print every tag when a site has hundreds of tags.

Default visible tag limit:

- `visibleTagsLimit = 80`

If no popularity metadata exists, tag popularity is derived from post counts.

## Static Path Generation

Core should expose helpers that site wrappers can reuse:

- `getBlogIndexStaticPaths(options)`
- `getBlogCategoryStaticPaths(options)`
- `getBlogTagStaticPaths(options)`
- `getBlogPostStaticPaths()`

The index helper returns paths for `/blog/page/[page]` only for page 2 and later. The `/blog/` route uses page 1 directly.

Category and tag helpers return page 1 and page 2+ paths. The site wrappers decide which route file they are used from, but the slicing and pagination metadata are created by core.

## Sitemap

Use a sitemap index with multiple static sitemap files:

- `/sitemap-index.xml`
- `/sitemap-pages.xml`
- `/sitemap-posts-1.xml`
- `/sitemap-posts-2.xml`
- `/sitemap-archives-1.xml`

Default URL shard size:

- `sitemapUrlsPerFile = 500`

`sitemap-pages.xml` contains stable non-article pages such as home, blog root, about, friends, and search when present.

Post sitemap shards contain article URLs only.

Archive sitemap shards contain paginated blog, category, and tag URLs. This keeps post URLs separate from archive churn.

`robots.txt` should reference `/sitemap-index.xml`.

## Search

Keep search fully static and client-side.

`/search-index.json` should remain metadata-only:

- slug
- title
- description
- category
- tags
- url
- publishDate

The index must not include full markdown body content by default. For 1000 articles, this remains small enough for an on-demand search page fetch.

Search index sharding is outside the initial implementation scope because a metadata-only index is acceptable for the 1000+ article target.

## Deployment

Each site remains independently deployed:

- `pnpm --filter <site-package> build`
- `wrangler pages deploy sites/<site>/dist --project-name=<pages-project>`

`scripts/deploy-site.sh` should continue to support single-site deploys. The Pages project name should be explicit and configurable per site when needed, while defaulting to the site directory name for backward compatibility.

## Performance Expectations

For a 1000 article site:

- `/blog/` renders 24 post cards, not 1000.
- Category and tag pages render one page of cards at a time.
- HTML size for archive pages stays bounded by pagination size.
- Sitemap files stay under the configured shard size.
- Search index fetch occurs only on the search page.
- No database or runtime server is required.

## Testing

Add automated tests around core behavior rather than relying on manual inspection:

- pagination helper slices items correctly
- generated page metadata has correct prev and next URLs
- category and tag static path helpers create page 1 and page 2+ routes
- sitemap shard helper splits URLs at the configured limit
- site functionality test asserts `/blog` does not contain all generated posts when fixture count exceeds one page
- route tests assert expected paginated files exist after build

Existing smoke tests should continue to pass for the current small sites.

## Non-Goals

- No SSR.
- No Cloudflare Pages Functions.
- No database.
- No full-text search engine.
- No global multi-site deploy orchestrator beyond improving the existing single-site deploy path.
- No redesign of the visual UI beyond pagination controls needed for navigation.

## Open Decisions Locked For Implementation

- `postsPerPage` defaults to `24`.
- `visibleTagsLimit` defaults to `80`.
- `sitemapUrlsPerFile` defaults to `500`.
- Page 1 archive routes do not include `/page/1/`.
- Full article body content is excluded from search index JSON.
