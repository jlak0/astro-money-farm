import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read site config from astro.config.mjs directly
function getSiteUrl(): string {
  try {
    const configPath = join(__dirname, '../../astro.config.mjs');
    const configContent = readFileSync(configPath, 'utf-8');
    // Match: site: 'https://example.com' or site: "https://example.com"
    const match = configContent.match(/site:\s*['"]([^'"]+)['"]/);
    if (match) return match[1];
  } catch (e) {
    // ignore
  }
  return 'http://localhost:4321';
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
