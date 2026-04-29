import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { basename, join, relative, sep } from 'node:path';

const root = process.cwd();
const moneyPlatformsDist = join(root, 'sites', 'money-platforms', 'dist');
const moneyPlatformsBlogContent = join(root, 'sites', 'money-platforms', 'src', 'content', 'blog');

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(file));
    } else {
      files.push(file);
    }
  }

  return files;
}

function normalizeDistPath(file) {
  return `/${relative(moneyPlatformsDist, file).split(sep).join('/')}`;
}

function collectBuiltPaths(files) {
  const existing = new Set();

  for (const file of files) {
    const path = normalizeDistPath(file);
    existing.add(path);

    if (path.endsWith('/index.html')) {
      const route = path.slice(0, -'index.html'.length) || '/';
      existing.add(route);
      existing.add(route.replace(/\/$/, '') || '/');
    }
  }

  return existing;
}

function collectSourcePostSlugs() {
  return readdirSync(moneyPlatformsBlogContent, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => /\.mdx?$/.test(entry.name))
    .map((entry) => basename(entry.name).replace(/\.mdx?$/, ''));
}

function extractLocPaths(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, loc]) => decodeURI(new URL(loc).pathname));
}

test('money-platforms built pages do not link to missing internal routes', () => {
  assert.ok(
    existsSync(moneyPlatformsDist),
    'Run pnpm --filter @astro-money-farm/money-platforms build before this test'
  );

  const files = walk(moneyPlatformsDist);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const existing = collectBuiltPaths(files);
  const missing = [];
  const attrPattern = /\b(?:href|src|action)=["']([^"']+)["']/g;

  for (const htmlFile of htmlFiles) {
    const source = readFileSync(htmlFile, 'utf8');
    const from = normalizeDistPath(htmlFile);

    for (const [, rawTarget] of source.matchAll(attrPattern)) {
      if (
        !rawTarget.startsWith('/') ||
        rawTarget.startsWith('//') ||
        rawTarget.startsWith('/#')
      ) {
        continue;
      }

      const target = decodeURI(rawTarget.split('#')[0].split('?')[0]);
      if (!target || target === '/') continue;

      const candidates = [target, `${target}/`, `${target}/index.html`];
      if (!candidates.some((candidate) => existing.has(candidate))) {
        missing.push(`${from} -> ${target}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test('money-platforms blog archive paginates rendered post cards', () => {
  assert.ok(
    existsSync(moneyPlatformsDist),
    'Run pnpm --filter @astro-money-farm/money-platforms build before this test'
  );

  const sourcePostCount = collectSourcePostSlugs().length;
  const blogIndex = readFileSync(join(moneyPlatformsDist, 'blog', 'index.html'), 'utf8');
  const renderedCardCount = blogIndex.match(/<article\b[^>]*\bclass=["'][^"']*\bblog-card\b[^"']*["'][^>]*>/g)?.length ?? 0;

  assert.ok(
    sourcePostCount > 24,
    `Expected fixture to include more than 24 source posts, found ${sourcePostCount}`
  );
  assert.equal(
    renderedCardCount,
    Math.min(24, sourcePostCount),
    `Expected blog index to render the first page of source posts, found ${renderedCardCount}`
  );
  assert.match(blogIndex, /href=["']\/blog\/page\/2\/["']/);
});

test('money-platforms emits split static sitemaps', () => {
  assert.ok(
    existsSync(moneyPlatformsDist),
    'Run pnpm --filter @astro-money-farm/money-platforms build before this test'
  );

  for (const sitemapFile of ['sitemap-index.xml', 'sitemap.xml', 'sitemap-pages.xml']) {
    assert.ok(
      existsSync(join(moneyPlatformsDist, sitemapFile)),
      `Expected ${sitemapFile} to exist`
    );
  }

  const indexLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap-index.xml'), 'utf8'));
  const compatibilityLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap.xml'), 'utf8'));
  const postShardPaths = indexLocs.filter((loc) => /^\/sitemap-posts-\d+\.xml$/.test(loc));
  const archiveShardPaths = indexLocs.filter((loc) => /^\/sitemap-archives-\d+\.xml$/.test(loc));

  assert.deepEqual(
    [...compatibilityLocs].sort(),
    [...indexLocs].sort(),
    'sitemap.xml should expose the same loc set as sitemap-index.xml'
  );
  assert.ok(indexLocs.includes('/sitemap-pages.xml'), 'sitemap-index.xml should reference sitemap-pages.xml');
  assert.ok(postShardPaths.length > 0, 'sitemap-index.xml should reference at least one post sitemap shard');
  assert.ok(archiveShardPaths.length > 0, 'sitemap-index.xml should reference at least one archive sitemap shard');

  for (const sitemapPath of indexLocs) {
    assert.ok(
      existsSync(join(moneyPlatformsDist, basename(sitemapPath))),
      `Expected referenced sitemap shard ${sitemapPath} to exist`
    );
  }

  const pageLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap-pages.xml'), 'utf8'));
  for (const pagePath of ['/', '/blog/', '/about/', '/friends/', '/search/']) {
    assert.ok(pageLocs.includes(pagePath), `sitemap-pages.xml should include ${pagePath}`);
  }

  const sourcePostPaths = collectSourcePostSlugs().map((slug) => `/blog/${slug}`);
  const sourcePostPathSet = new Set(sourcePostPaths);
  const allPostLocs = [];

  for (const postShardPath of postShardPaths) {
    const postLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, basename(postShardPath)), 'utf8'));

    assert.ok(postLocs.length > 0, `${postShardPath} should contain post URLs`);
    assert.ok(postLocs.length <= 500, `${postShardPath} should not exceed 500 URLs`);
    assert.ok(
      postLocs.every((loc) => loc.startsWith('/blog/')),
      `${postShardPath} should only contain blog URLs`
    );
    assert.ok(
      postLocs.every((loc) => !loc.startsWith('/blog/category/') && !loc.startsWith('/blog/tag/') && !loc.startsWith('/blog/page/')),
      `${postShardPath} should not contain archive URLs`
    );
    assert.ok(
      postLocs.every((loc) => sourcePostPathSet.has(loc)),
      `${postShardPath} should only contain source post URLs`
    );

    allPostLocs.push(...postLocs);
  }

  const allPostLocSet = new Set(allPostLocs);
  assert.deepEqual(
    sourcePostPaths.filter((postPath) => !allPostLocSet.has(postPath)),
    [],
    'Post sitemap shards should include every source post URL'
  );

  for (const archiveShardPath of archiveShardPaths) {
    const archiveLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, basename(archiveShardPath)), 'utf8'));

    assert.ok(archiveLocs.length > 0, `${archiveShardPath} should contain archive URLs`);
    assert.ok(archiveLocs.length <= 500, `${archiveShardPath} should not exceed 500 URLs`);
    assert.ok(
      archiveLocs.every((loc) => loc === '/blog/' || loc.startsWith('/blog/category/') || loc.startsWith('/blog/tag/') || loc.startsWith('/blog/page/')),
      `${archiveShardPath} should only contain archive URLs`
    );
    assert.ok(
      sourcePostPaths.every((postPath) => !archiveLocs.includes(postPath)),
      `${archiveShardPath} should not contain article slug URLs`
    );
  }
});

test('search page hydrates q query parameter on load', () => {
  const searchPage = readFileSync(join(root, 'packages', 'core', 'pages', 'SearchPage.astro'), 'utf8');

  assert.match(searchPage, /URLSearchParams\(window\.location\.search\)/);
  assert.match(searchPage, /\.get\(['"]q['"]\)/);
});

test('email subscribe does not render a placeholder submit target', () => {
  const component = readFileSync(join(root, 'packages', 'core', 'components', 'EmailSubscribe.astro'), 'utf8');

  assert.doesNotMatch(component, /action=["']#["']/);
});

test('shared core does not embed site-specific business categories', () => {
  const coreFiles = walk(join(root, 'packages', 'core'))
    .filter((file) => /\.(astro|ts|json)$/.test(file));
  const bannedTerms = [
    '变现学堂',
    '变现相关',
    'AI变现',
    '副业',
    '法国创业',
    'Intermittent Fasting',
    'Keto Diet',
    'Low Carb'
  ];
  const matches = [];

  for (const file of coreFiles) {
    const source = readFileSync(file, 'utf8');
    for (const term of bannedTerms) {
      if (source.includes(term)) {
        matches.push(`${relative(root, file)} contains ${term}`);
      }
    }
  }

  assert.deepEqual(matches, []);
});
