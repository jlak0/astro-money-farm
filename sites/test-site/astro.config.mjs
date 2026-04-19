import { defineConfig } from 'astro/config';

const siteUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://your-domain.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  build: {
    assets: '_assets'
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
