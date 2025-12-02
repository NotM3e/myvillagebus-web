import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // NIE cachuj APK - za duże pliki
        urlPattern: /\.apk$/i,
        handler: 'NetworkOnly',
      },
      {
        // Cachuj obrazy
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dni
          },
        },
      },
    ],
  },
});

// Wykryj środowisko
const isCloudflarePages = process.env.CF_PAGES === '1';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Określ czy potrzebny basePath
const needsBasePath = isProduction && isGitHubActions && !isCloudflarePages;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  images: {
    unoptimized: true,
  },
  
  // Warunkowy basePath
  ...(needsBasePath && {
    basePath: '/myvillagebus-web',
    assetPrefix: '/myvillagebus-web',
  }),
  
  // Kompresja
  compress: true,
  
  // Trailing slash (opcjonalnie)
  trailingSlash: false,
  
  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default withPWA(nextConfig);