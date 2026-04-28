import { getSiteUrl } from '../config';

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
