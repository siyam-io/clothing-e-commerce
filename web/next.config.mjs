/** @type {import('next').NextConfig} */
const nextConfig = {

  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'clothing-e-commerce-web.vercel.app', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/**' },
    ],
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.js',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85, 100],         // FIX: suppress Next.js qualities warning
    minimumCacheTTL: 86400,          // 24h image cache (was 60s)
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Product detail pages: CDN-cacheable for 15 min
      {
        source: '/products/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=900, stale-while-revalidate=60' },
        ],
      },
    ];
  },

  reactStrictMode: true,
  compress: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@swc/core-linux-x64-musl-abi-none',
      'node_modules/@esbuild/linux-x64',
      'node_modules/typescript/**/*',
      'node_modules/eslint/**/*',
      'node_modules/prettier/**/*',
      'node_modules/rollup/**/*',
      '**/*.map',
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'swiper', '@tanstack/react-query'],
  },
};

export default nextConfig;