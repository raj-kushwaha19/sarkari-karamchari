/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async rewrites() {
    // Development: localhost:5000 | Production: Render URL (set BACKEND_URL in Vercel env vars)
    const backendUrl = process.env.BACKEND_URL || 'https://sarkari-karamchari.onrender.com';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
