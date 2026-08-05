/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/blog',
        destination: '/blog/index.html',
      },
      {
        source: '/blog/',
        destination: '/blog/index.html',
      },
    ];
  },
};

export default nextConfig;
