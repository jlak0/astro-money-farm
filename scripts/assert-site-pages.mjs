import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const sitesRoot = join(root, 'sites');
const failures = [];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else {
      files.push(path);
    }
  }

  return files;
}

for (const site of readdirSync(sitesRoot)) {
  const sitePath = join(sitesRoot, site);
  if (!statSync(sitePath).isDirectory()) continue;

  const pagesRoot = join(sitePath, 'src', 'pages');
  const pageFiles = walk(pagesRoot).filter((file) => /\.(astro|ts)$/.test(file));

  for (const file of pageFiles) {
    const rel = relative(root, file);
    const source = readFileSync(file, 'utf8');
    const nonEmptyLines = source.split('\n').filter((line) => line.trim()).length;

    if (!/@astro-money-farm\/core\/(?:pages|routes)/.test(source)) {
      failures.push(`Delegate site page implementation to core pages/routes: ${rel}`);
    }

    if (/from\s+['"]@astro-money-farm\/core\/components/.test(source)) {
      failures.push(`Do not import shared components directly in thin site page: ${rel}`);
    }

    if (nonEmptyLines > 30) {
      failures.push(`Keep site page entry thin (${nonEmptyLines} non-empty lines): ${rel}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Site page entries delegate to @astro-money-farm/core pages/routes.');
