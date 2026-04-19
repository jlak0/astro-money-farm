#!/usr/bin/env node
/**
 * 站群模板 - Favicon 生成脚本
 * 使用方式: node scripts/generate-favicon.mjs --letter A --color "#10b981"
 *
 * 参数:
 *   --letter  站点名称首字母（默认：取站点名称第一个字）
 *   --color   主题色（默认：#10b981）
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 解析命令行参数
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return defaultVal;
  return args[idx + 1];
};

const letter = getArg('letter', null);
const color = getArg('color', '#10b981');

// 如果没有传入字母，尝试从 site.json 读取
let faviconLetter = letter;
if (!faviconLetter) {
  try {
    const siteConfig = JSON.parse(readFileSync(join(rootDir, 'site.config.json'), 'utf-8'));
    const siteName = siteConfig.site?.name || '站';
    faviconLetter = siteName.charAt(0).toUpperCase();
  } catch {
    faviconLetter = '站';
  }
}

// 1. 生成 favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="${color}"/>
  <text x="16" y="21" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${faviconLetter}</text>
</svg>`;

writeFileSync(join(rootDir, 'public', 'favicon.svg'), faviconSvg);
console.log(`✅ favicon.svg 已生成（字母: ${faviconLetter}, 颜色: ${color}）`);

// 2. 生成 og-default.svg（Open Graph 默认图）
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="280" font-size="160" font-weight="bold" text-anchor="middle" fill="${color}">${faviconLetter}</text>
  <text x="600" y="380" font-size="36" text-anchor="middle" fill="#94a3b8">SEO内容变现博客</text>
</svg>`;

writeFileSync(join(rootDir, 'public', 'og-default.svg'), ogSvg);
console.log(`✅ og-default.svg 已生成`);

console.log(`
🎉 Favicon 生成完成！
`);
