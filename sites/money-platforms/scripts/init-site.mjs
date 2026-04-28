#!/usr/bin/env node
/**
 * 站点初始化脚本 - 一键配置新站点
 * 
 * 用法：
 *   node scripts/init-site.mjs --name "AI变现" --domain "ai-earn.com" --desc "AI副业赚钱"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// 解析命令行参数
const args = process.argv.slice(2);
const getArg = (name, defaultVal = '') => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] || defaultVal : defaultVal;
};

const siteName = getArg('name', '我的站点');
const siteDomain = getArg('domain', 'example.com');
const siteDesc = getArg('desc', '分享实用干货');
const siteEmail = getArg('email', `contact@${siteDomain}`);

// 颜色输出
const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`),
};

log.info(`初始化站点: ${siteName} (${siteDomain})`);
console.log('');

// 1. 更新 site.json
log.info('更新 site.json...');
const siteConfigPath = path.join(rootDir, 'src/config/site.json');
const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));

siteConfig.site.name = siteName;
siteConfig.site.description = siteDesc;
siteConfig.site.url = `https://${siteDomain}`;
siteConfig.social.email = siteEmail;
siteConfig.footer.copyright = `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2) + '\n');
log.success('site.json 已更新');

// 2. 更新 astro.config.mjs
log.info('更新 astro.config.mjs...');
const astroConfigPath = path.join(rootDir, 'astro.config.mjs');
let astroConfig = fs.readFileSync(astroConfigPath, 'utf8');

// 替换 site 值
astroConfig = astroConfig.replace(
  /site:\s*['"](.*?)['"]/,
  `site: 'https://${siteDomain}'`
);

fs.writeFileSync(astroConfigPath, astroConfig);
log.success('astro.config.mjs 已更新');

// 3. 更新 robots.txt
log.info('更新 robots.txt...');
const robotsPath = path.join(rootDir, 'src/pages/robots.txt.ts');
let robots = fs.readFileSync(robotsPath, 'utf8');
robots = robots.replace(/https:\/\/your-domain\.com/g, `https://${siteDomain}`);
fs.writeFileSync(robotsPath, robots);
log.success('robots.txt 已更新');

// 4. 生成 favicon.svg（使用首字母）
log.info('生成 favicon.svg...');
const firstChar = siteName.charAt(0).toUpperCase();
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#10b981"/>
  <text x="16" y="23" font-size="18" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui">${firstChar}</text>
</svg>`;
fs.writeFileSync(path.join(rootDir, 'public/favicon.svg'), faviconSvg);
log.success(`favicon.svg 已生成 (首字母: ${firstChar})`);

// 5. 生成 og-default.svg
log.info('生成 og-default.svg...');
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect x="60" y="60" width="1080" height="510" rx="16" fill="#1e293b"/>
  <text x="600" y="280" font-size="120" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui, sans-serif">${siteName}</text>
  <text x="600" y="370" font-size="36" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif">${siteDesc}</text>
  <text x="600" y="480" font-size="28" text-anchor="middle" fill="#10b981" font-family="system-ui, sans-serif">${siteDomain}</text>
</svg>`;
fs.writeFileSync(path.join(rootDir, 'public/og-default.svg'), ogSvg);
log.success('og-default.svg 已生成');

// 6. 创建 .env 文件
log.info('创建 .env...');
const envContent = `# 站点配置
PUBLIC_SITE_URL=https://${siteDomain}
PUBLIC_SITE_NAME=${siteName}

# Cloudflare Analytics (可选)
# CF_ANALYTICS_TOKEN=

# Umami Analytics (可选)
# PUBLIC_UMAMI_URL=https://umami.example.com
# PUBLIC_UMAMI_ID=xxxxx

# Google Analytics (可选)
# PUBLIC_GA_ID=G-XXXXXXXXXX
`;
fs.writeFileSync(path.join(rootDir, '.env'), envContent);
log.success('.env 已创建');

// 7. 更新 Header 的站点名称
log.info('更新 Header...');
const headerPath = path.join(rootDir, 'src/components/Header.astro');
let header = fs.readFileSync(headerPath, 'utf8');
header = header.replace(/<span>变现学堂<\/span>/, `<span>${siteName}</span>`);
fs.writeFileSync(headerPath, header);
log.success('Header 已更新');

console.log('');
console.log('═══════════════════════════════════════');
log.success('🎉 站点初始化完成！');
console.log('═══════════════════════════════════════');
console.log('');
console.log('📋 下一步：');
console.log(`   1. cd ${rootDir}`);
  console.log('   2. pnpm install');
console.log('   3. pnpm dev    # 本地预览');
  console.log('   4. pnpm build  # 构建部署');
console.log('');
console.log(`🌐 站点信息：`);
console.log(`   名称: ${siteName}`);
console.log(`   域名: https://${siteDomain}`);
console.log(`   描述: ${siteDesc}`);
console.log('');
