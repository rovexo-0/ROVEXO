import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/supabase/env";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getAppUrl();

  return {
    name: "ROVEXO",
    short_name: "ROVEXO",
    description: "Buy and sell on the modern UK marketplace with buyer protection.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    orientation: "portrait-primary",
    lang: "en-GB",
    dir: "ltr",
    categories: ["shopping", "marketplace"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    shortcuts: [
      { name: "Search", url: "/search", description: "Search listings" },
      { name: "Sell", url: "/sell", description: "Create a listing" },
      { name: "Messages", url: "/messages", description: "View conversations" },
    ],
    related_applications: [],
    prefer_related_applications: false,
    scope: "/",
    id: `${baseUrl}/`,
  };
}
