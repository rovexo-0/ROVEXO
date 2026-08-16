import type { MetadataRoute } from "next";
import {
  CANONICAL_RX_PWA_SIZES,
  ROVEXO_PWA_BACKGROUND_COLOR,
  ROVEXO_PWA_DISPLAY,
  ROVEXO_PWA_THEME_COLOR,
  withWhitePearlFaviconCacheBust,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

/** Level III source remains CANONICAL_RX_APP_ICON on disk — not an install-manifest icon. */
import { ROVEXO_APP_VERSION, ROVEXO_RELEASE_CODE } from "@/lib/app/version";
import { ROVEXO_PWA_ID } from "@/lib/pwa/pwa-update-engine-v1";

const INSTALL_ICON_SIZES = CANONICAL_RX_PWA_SIZES.filter(
  (size) => size === 192 || size === 512,
);

export default function manifest(): MetadataRoute.Manifest {
  const v = withWhitePearlFaviconCacheBust;

  const icons: MetadataRoute.Manifest["icons"] = [
    ...INSTALL_ICON_SIZES.map((size) => ({
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
  ];

  return {
    name: "ROVEXO",
    short_name: "ROVEXO",
    description: `Buy and sell on the modern UK marketplace with purchase protection. (${ROVEXO_RELEASE_CODE} ${ROVEXO_APP_VERSION})`,
    id: ROVEXO_PWA_ID,
    start_url: "/",
    scope: "/",
    display: ROVEXO_PWA_DISPLAY,
    background_color: ROVEXO_PWA_BACKGROUND_COLOR,
    theme_color: ROVEXO_PWA_THEME_COLOR,
    lang: "en-GB",
    dir: "ltr",
    categories: ["shopping", "marketplace"],
    icons,
    screenshots: [
      {
        src: "/brand/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      } as NonNullable<MetadataRoute.Manifest["screenshots"]>[number],
    ],
    shortcuts: [
      { name: "Search", url: "/search", description: "Search listings" },
      { name: "Sell", url: "/sell", description: "Create a listing" },
      { name: "Messages", url: "/inbox", description: "View conversations" },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
