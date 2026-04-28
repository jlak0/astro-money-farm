import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const sitesRoot = join(root, 'sites');
const allowedSiteDirs = new Set(['config']);
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

  for (const dir of ['components', 'layouts']) {
    const localDir = join(sitePath, 'src', dir);
    try {
      const localFiles = walk(localDir).filter((file) => file.endsWith('.astro'));
      for (const file of localFiles) {
        failures.push(`Remove duplicated site ${dir} file: ${relative(root, file)}`);
      }
    } catch {
      // Directory does not exist, which is the desired shared-core shape.
    }
  }

  const srcFiles = walk(join(sitePath, 'src')).filter((file) => /\.(astro|ts)$/.test(file));
  for (const file of srcFiles) {
    const rel = relative(root, file);
    if (rel.includes('/src/config/')) continue;

    const source = readFileSync(file, 'utf8');
    const localSharedImport = /from\s+['"](?:\.\.\/)+(?:components|layouts)\//.test(source);
    const aliasSharedImport = /from\s+['"]@(?:components|layouts)\//.test(source);

    if (localSharedImport || aliasSharedImport) {
      failures.push(`Import shared UI from @astro-money-farm/core in ${rel}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Site UI imports are centralized through @astro-money-farm/core.');
