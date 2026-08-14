import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/supabase/env";
import {
  CANONICAL_RX_PWA_SIZES,
  CANONICAL_RX_APP_ICON,
  ROVEXO_PWA_BACKGROUND_COLOR,
  ROVEXO_PWA_DISPLAY,
  ROVEXO_PWA_THEME_COLOR,
  withWhitePearlFaviconCacheBust,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import { ROVEXO_APP_VERSION, ROVEXO_RELEASE_CODE } from "@/lib/app/version";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getAppUrl();
  const v = withWhitePearlFaviconCacheBust;

  const icons: MetadataRoute.Manifest["icons"] = [
    ...CANONICAL_RX_PWA_SIZES.map((size) => ({
      src: v(`/icons/icon-${size}.png`),
      sizes: `${size}x${size}`,
      type: "image/png" as const,
      purpose: "any" as const,
    })),
    {
      src: v("/icons/android-chrome-192x192.png"),
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: v("/icons/android-chrome-512x512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: v("/icons/icon-maskable-512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: v("/icons/maskable-icon-512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: v(CANONICAL_RX_APP_ICON),
      sizes: "2048x2048",
      type: "image/png",
      purpose: "any",
    },
  ];

  return {
    name: "ROVEXO",
    short_name: "ROVEXO",
    description: `Buy and sell on the modern UK marketplace with purchase protection. (${ROVEXO_RELEASE_CODE} ${ROVEXO_APP_VERSION})`,
    start_url: "/",
    display: ROVEXO_PWA_DISPLAY,
    background_color: ROVEXO_PWA_BACKGROUND_COLOR,
    theme_color: ROVEXO_PWA_THEME_COLOR,
    orientation: "portrait-primary",
    lang: "en-GB",
    dir: "ltr",
    categories: ["shopping", "marketplace"],
    icons,
    screenshots: [{ src: "/brand/og-image.png", sizes: "1200x630", type: "image/png" }],
    shortcuts: [
      { name: "Search", url: "/search", description: "Search listings" },
      { name: "Sell", url: "/sell", description: "Create a listing" },
      { name: "Messages", url: "/inbox", description: "View conversations" },
    ],
    related_applications: [],
    prefer_related_applications: false,
    scope: "/",
    id: `${baseUrl}/`,
  };
}
