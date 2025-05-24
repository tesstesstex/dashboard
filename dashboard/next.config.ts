import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages URL will be https://<username>.github.io/finance-dashboard/
  // So, basePath and assetPrefix should be /finance-dashboard
  assetPrefix: '/finance-dashboard/',
  basePath: '/finance-dashboard',
  reactStrictMode: true,
  images: {
    unoptimized: true,    // Required for next export with next/image
  }
  /* config options here */
};

export default nextConfig;
