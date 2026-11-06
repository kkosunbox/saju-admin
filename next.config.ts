import type { NextConfig } from 'next';

// The browser calls this site's /api, and Next forwards it to the 운Pick API, so the API needs no CORS entry for the admin.
// API_ORIGIN is read at build time: http://localhost:8080 (local), https://api-dev.woonpick.com, https://api.woonpick.com.
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
