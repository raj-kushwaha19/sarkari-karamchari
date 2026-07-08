/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async rewrites() {
    // Development: localhost:5000 | Production: Railway URL (set BACKEND_URL in Vercel env vars)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
