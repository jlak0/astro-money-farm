import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const moneyPlatformsDist = join(root, 'sites', 'money-platforms', 'dist');

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
