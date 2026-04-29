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

test('shardItems returns a single empty shard for empty lists', () => {
  assert.deepEqual(shardItems([], 2), [{ page: 1, items: [] }]);
});

test('default constants match approved scale design', () => {
  assert.equal(DEFAULT_PAGINATION.postsPerPage, 24);
  assert.equal(DEFAULT_PAGINATION.visibleTagsLimit, 80);
  assert.equal(DEFAULT_PAGINATION.sitemapUrlsPerFile, 500);
});
