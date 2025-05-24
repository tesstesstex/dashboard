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
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/dashboard', // Expose basePath to the client
  }
  /* config options here */
};

export default nextConfig;
