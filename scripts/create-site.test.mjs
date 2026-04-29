import { execFileSync, spawnSync } from 'node:child_process';
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

function createDeployFixture() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'deploy-site-'));
  const scriptsDir = join(fixtureRoot, 'scripts');
  const siteDir = join(fixtureRoot, 'sites', 'demo');
  const binDir = join(fixtureRoot, 'bin');
  const pnpmLog = join(fixtureRoot, 'pnpm.log');
  const npxLog = join(fixtureRoot, 'npx.log');

  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(siteDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });

  const scriptPath = join(scriptsDir, 'deploy-site.sh');
  cpSync(join(repoRoot, 'scripts', 'deploy-site.sh'), scriptPath);
  chmodSync(scriptPath, 0o755);
  writeFileSync(join(siteDir, 'wrangler.toml'), 'name = "demo"\n');

  const pnpmPath = join(binDir, 'pnpm');
  writeFileSync(pnpmPath, `#!/bin/sh\nprintf '%s\\n' "$@" > "${pnpmLog}"\nexit 0\n`);
  chmodSync(pnpmPath, 0o755);

  const npxPath = join(binDir, 'npx');
  writeFileSync(npxPath, `#!/bin/sh\nprintf '%s\\n' "$@" > "${npxLog}"\nexit 0\n`);
  chmodSync(npxPath, 0o755);

  return { fixtureRoot, scriptPath, binDir, npxLog };
}

function runDeployFixture(scriptPath, binDir, args, extraEnv = {}) {
  const env = { ...process.env };
  delete env.PAGES_PROJECT_NAME;
  Object.assign(env, extraEnv, { PATH: `${binDir}:${process.env.PATH}` });

  return execFileSync('bash', [scriptPath, ...args], {
    env,
    encoding: 'utf8'
  });
}

test('deploy-site uses third arg as pages project name', () => {
  const { fixtureRoot, scriptPath, binDir, npxLog } = createDeployFixture();

  try {
    const output = runDeployFixture(scriptPath, binDir, ['demo', 'production', 'explicit-pages']);

    assert.match(output, /Pages 项目名: explicit-pages/);
    assert.match(readFileSync(npxLog, 'utf8'), /--project-name=explicit-pages/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('deploy-site uses PAGES_PROJECT_NAME when third arg is absent', () => {
  const { fixtureRoot, scriptPath, binDir, npxLog } = createDeployFixture();

  try {
    const output = runDeployFixture(scriptPath, binDir, ['demo'], {
      PAGES_PROJECT_NAME: 'env-pages'
    });

    assert.match(output, /Pages 项目名: env-pages/);
    assert.match(readFileSync(npxLog, 'utf8'), /--project-name=env-pages/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('deploy-site defaults pages project name to site directory', () => {
  const { fixtureRoot, scriptPath, binDir, npxLog } = createDeployFixture();

  try {
    const output = runDeployFixture(scriptPath, binDir, ['demo']);

    assert.match(output, /Pages 项目名: demo/);
    assert.match(readFileSync(npxLog, 'utf8'), /--project-name=demo/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('deploy-site usage exits cleanly without args under nounset', () => {
  const { fixtureRoot, scriptPath } = createDeployFixture();

  try {
    const result = spawnSync('bash', ['-u', scriptPath], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /用法: \.\/scripts\/deploy-site\.sh <站点目录> \[环境\] \[pages项目名\]/);
    assert.doesNotMatch(result.stderr, /unbound variable/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
