/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'minio'],
  },
  env: {
    AI_API_URL: process.env.AI_API_URL || 'http://localhost:8000',
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // NEXTAUTH_URL을 env에서 안 주면 요청 Host 헤더 기반으로 동작하게 허용
  ...(process.env.NEXTAUTH_URL ? {} : { experimental: { trustHostHeader: true } }),
  async rewrites() {
    return [
      {
        source: '/api/ai/:path*',
        destination: `${process.env.AI_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
