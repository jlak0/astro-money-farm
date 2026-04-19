import siteConfig from '../config';
import fs from 'fs';
import path from 'path';

function getSiteUrl() {
  // Try astro.config.mjs first
  try {
    const configPath = path.join(process.cwd(), 'astro.config.mjs');
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/site:\s*['"]([^'"]+)['"]/);
    if (match && match[1] && !match[1].includes('your-domain')) {
      return match[1].replace(/\/$/, '');
    }
  } catch {}

  // Fall back to site.config.json
  const url = siteConfig.site?.url || '';
  if (url && !url.includes('your-domain')) {
    return url.replace(/\/$/, '');
  }

  return 'http://localhost:4321';
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap-index.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
