export const DEFAULT_PAGINATION = {
  postsPerPage: 24,
  visibleTagsLimit: 80,
  sitemapUrlsPerFile: 500
} as const;

export interface PaginationOptions {
  currentPage: number;
  pageSize: number;
  basePath: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  prevUrl: string | null;
  nextUrl: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

interface TaggedPost {
  data: {
    tags?: string[];
  };
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Shard<T> {
  page: number;
  items: T[];
}

export function normalizeBasePath(basePath: string) {
  return basePath.replace(/\/+$/, '') || '/';
}

function normalizePositiveSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(size));
}

export function buildPageUrl(basePath: string, page: number) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const prefix = normalizedBasePath === '/' ? '' : normalizedBasePath;

  if (page <= 1) {
    return `${prefix}/`;
  }

  return `${prefix}/page/${page}/`;
}

export function paginateItems<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const pageSize = normalizePositiveSize(options.pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (options.currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    pagination: {
      currentPage: options.currentPage,
      totalPages,
      totalItems,
      pageSize,
      basePath: options.basePath,
      prevUrl:
        options.currentPage > 1
          ? buildPageUrl(options.basePath, options.currentPage - 1)
          : null,
      nextUrl:
        options.currentPage < totalPages
          ? buildPageUrl(options.basePath, options.currentPage + 1)
          : null
    }
  };
}

export function countTags(posts: TaggedPost[], limit = DEFAULT_PAGINATION.visibleTagsLimit) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      const name = tag.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA;
      return tagA.localeCompare(tagB);
    })
    .slice(0, limit)
    .map(([tag, count]): TagCount => ({ tag, count }));
}

export function shardItems<T>(items: T[], shardSize: number): Shard<T>[] {
  if (items.length === 0) {
    return [{ page: 1, items: [] }];
  }

  const size = normalizePositiveSize(shardSize);
  const shards: Shard<T>[] = [];

  for (let index = 0; index < items.length; index += size) {
    shards.push({
      page: shards.length + 1,
      items: items.slice(index, index + size)
    });
  }

  return shards;
}
