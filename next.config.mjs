import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/sheets\.googleapis\.com.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-sheets-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  
  // 🔥 DODAJ TO:
  turbopack: {},  // Pusty config wycisza warning
  
  // Opcjonalnie - basePath jeśli nie masz custom domain
  // basePath: '/myvillagebus-web',
};

export default pwaConfig(nextConfig);