import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel provides image optimization; Next.js installs sharp automatically when needed.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pklotmwxtnnepaitedic.supabase.co",
      },
    ],
  },
};

export default nextConfig;
