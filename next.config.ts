import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
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
  async redirects() {
    return [
      { source: "/cars", destination: "/browse/cars", permanent: true },
      { source: "/cars/:path*", destination: "/browse/cars/:path*", permanent: true },
      { source: "/phones", destination: "/browse/phones", permanent: true },
      { source: "/phones/:path*", destination: "/browse/phones/:path*", permanent: true },
      { source: "/bedding", destination: "/browse/bedding", permanent: true },
      { source: "/bedding/:path*", destination: "/browse/bedding/:path*", permanent: true },
      { source: "/tools/:path*", destination: "/browse/tools/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
