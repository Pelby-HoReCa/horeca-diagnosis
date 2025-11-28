/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'https://horeca-backend-6zl1.onrender.com',
  },
}

module.exports = nextConfig

