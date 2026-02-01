import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    root: '.',
  },
  // Server Actionsのボディサイズ制限を引き上げ（画像アップロード用）
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
