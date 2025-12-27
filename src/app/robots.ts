import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // Wykryj środowisko
  const isCloudflare = process.env.CF_PAGES === '1';
  const baseUrl = isCloudflare ? 'https://wsiobus.pl' : 'https://notm3e.github.io/myvillagebus-web';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}