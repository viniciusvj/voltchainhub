/** @type {import('next').NextConfig} */

// Served as part of the GitHub Pages site at
// https://viniciusvj.github.io/voltchainhub/app/ (static export into ../docs/app).
// Set NEXT_PUBLIC_BASE_PATH='' for local dev at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/voltchainhub/app';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
