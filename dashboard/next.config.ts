import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages URL will be https://<username>.github.io/dashboard/
  // So, basePath and assetPrefix should be /dashboard
  assetPrefix: '/dashboard/',
  basePath: '/dashboard',
  reactStrictMode: true,
  images: {
    unoptimized: true,    // Required for next export with next/image
  }
  /* config options here */
};

export default nextConfig;
