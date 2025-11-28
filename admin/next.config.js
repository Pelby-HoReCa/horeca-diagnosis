/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://horeca-backend-6zl1.onrender.com',
  },
  // Добавляем API URL в window для клиентской части
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          '__API_URL__': JSON.stringify(process.env.NEXT_PUBLIC_API_URL || 'https://horeca-backend-6zl1.onrender.com'),
        })
      );
    }
    return config;
  },
}

module.exports = nextConfig

