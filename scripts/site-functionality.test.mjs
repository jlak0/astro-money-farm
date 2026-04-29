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

  const sitemapFiles = [
    'sitemap-index.xml',
    'sitemap.xml',
    'sitemap-pages.xml',
    'sitemap-posts-1.xml',
    'sitemap-archives-1.xml'
  ];

  for (const sitemapFile of sitemapFiles) {
    assert.ok(
      existsSync(join(moneyPlatformsDist, sitemapFile)),
      `Expected ${sitemapFile} to exist`
    );
  }

  for (const sitemapFile of ['sitemap-index.xml', 'sitemap.xml']) {
    const locs = extractLocPaths(readFileSync(join(moneyPlatformsDist, sitemapFile), 'utf8'));

    assert.ok(locs.includes('/sitemap-pages.xml'), `${sitemapFile} should reference sitemap-pages.xml`);
    assert.ok(locs.includes('/sitemap-posts-1.xml'), `${sitemapFile} should reference sitemap-posts-1.xml`);
    assert.ok(locs.includes('/sitemap-archives-1.xml'), `${sitemapFile} should reference sitemap-archives-1.xml`);
  }

  const pageLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap-pages.xml'), 'utf8'));
  for (const pagePath of ['/', '/blog/', '/about/', '/friends/', '/search/']) {
    assert.ok(pageLocs.includes(pagePath), `sitemap-pages.xml should include ${pagePath}`);
  }

  const sourcePostPaths = collectSourcePostSlugs().map((slug) => `/blog/${slug}`);
  const postLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap-posts-1.xml'), 'utf8'));
  assert.ok(postLocs.length > 0, 'sitemap-posts-1.xml should contain post URLs');
  assert.ok(postLocs.every((loc) => loc.startsWith('/blog/')), 'sitemap-posts-1.xml should only contain blog URLs');
  assert.ok(
    sourcePostPaths.some((postPath) => postLocs.includes(postPath)),
    'sitemap-posts-1.xml should contain source post URLs'
  );
  assert.ok(
    postLocs.every((loc) => !loc.startsWith('/blog/category/') && !loc.startsWith('/blog/tag/') && !loc.startsWith('/blog/page/')),
    'sitemap-posts-1.xml should not contain archive URLs'
  );
  assert.ok(postLocs.length <= 500, 'sitemap-posts-1.xml should not exceed 500 URLs');

  const archiveLocs = extractLocPaths(readFileSync(join(moneyPlatformsDist, 'sitemap-archives-1.xml'), 'utf8'));
  assert.ok(archiveLocs.includes('/blog/'), 'sitemap-archives-1.xml should include /blog/');
  assert.ok(archiveLocs.some((loc) => loc.startsWith('/blog/category/')), 'sitemap-archives-1.xml should include category URLs');
  assert.ok(archiveLocs.some((loc) => loc.startsWith('/blog/tag/')), 'sitemap-archives-1.xml should include tag URLs');
  assert.ok(
    sourcePostPaths.every((postPath) => !archiveLocs.includes(postPath)),
    'sitemap-archives-1.xml should not contain article slug URLs'
  );
  assert.ok(archiveLocs.length <= 500, 'sitemap-archives-1.xml should not exceed 500 URLs');
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
