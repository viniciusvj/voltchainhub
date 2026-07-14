/** @type {import('next').NextConfig} */

// Production is voltchainhub.org (served from the consolidado at the domain
// root); the app lives at voltchainhub.org/app/, so basePath is /app.
// Static export goes into ../docs/app. Set NEXT_PUBLIC_BASE_PATH='' for local
// dev at the root, or '/voltchainhub/app' for the raw github.io mirror.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/app';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
