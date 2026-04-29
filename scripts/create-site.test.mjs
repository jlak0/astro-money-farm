import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test('create-site copies template files without generated artifacts', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'create-site-'));

  try {
    const scriptsDir = join(fixtureRoot, 'scripts');
    const templateDir = join(fixtureRoot, 'sites', 'template');
    mkdirSync(scriptsDir, { recursive: true });
    mkdirSync(join(templateDir, 'src', 'config'), { recursive: true });

    const scriptPath = join(scriptsDir, 'create-site.sh');
    cpSync(join(repoRoot, 'scripts', 'create-site.sh'), scriptPath);
    chmodSync(scriptPath, 0o755);

    writeFileSync(join(templateDir, 'package.json'), JSON.stringify({
      name: '@astro-money-farm/site-template',
      version: '1.0.0'
    }, null, 2));
    writeFileSync(join(templateDir, 'src', 'config', 'site.json'), '{}');
    writeFileSync(join(templateDir, '.env.example'), 'PUBLIC_SITE_URL=https://example.com\n');

    for (const dir of ['node_modules', 'dist', '.astro', '.turbo']) {
      mkdirSync(join(templateDir, dir), { recursive: true });
      writeFileSync(join(templateDir, dir, 'artifact.txt'), dir);
    }

    execFileSync('bash', [scriptPath, 'demo-site'], {
      cwd: fixtureRoot,
      encoding: 'utf8'
    });

    const targetDir = join(fixtureRoot, 'sites', 'demo-site');
    assert.equal(existsSync(join(targetDir, 'src', 'config', 'site.json')), true);
    assert.equal(existsSync(join(targetDir, '.env.example')), true);

    for (const dir of ['node_modules', 'dist', '.astro', '.turbo']) {
      assert.equal(existsSync(join(targetDir, dir)), false, `${dir} should not be copied`);
    }

    const packageJson = readFileSync(join(targetDir, 'package.json'), 'utf8');
    assert.match(packageJson, /@astro-money-farm\/site-demo-site/);
    assert.doesNotMatch(packageJson, /site-template/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('deploy-site accepts explicit pages project name', () => {
  const source = readFileSync(join(repoRoot, 'scripts', 'deploy-site.sh'), 'utf8');

  assert.match(source, /PAGES_PROJECT=\$\{3:-\$\{PAGES_PROJECT_NAME:-\$SITE_NAME\}\}/);
  assert.match(source, /--project-name="\$PAGES_PROJECT"/);
});
