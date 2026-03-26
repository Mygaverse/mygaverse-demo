import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
  ],
  images: {
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
