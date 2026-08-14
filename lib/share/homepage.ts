import { PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";

/** Canonical Homepage share payload — Web Share API + compact fallback channels. */
export const HOMEPAGE_SHARE = {
  title: "ROVEXO",
  text: "Buy • Sell • Grow",
  /** Production homepage only — never localhost / session / query params. */
  url: `${PRODUCTION_ORIGIN}/`,
} as const;

/**
 * Homepage Rich Social Preview v2 — Owner 1:1 reference asset + OG/Twitter metadata.
 * SSOT for `/` openGraph / twitter cards. Does not alter Share Nodes UI.
 */
export const HOMEPAGE_SOCIAL_PREVIEW_V2 = {
  version: "2.0",
  title: "ROVEXO — Buy • Sell • Grow",
  description: "Buy, sell and discover great products on ROVEXO.",
  type: "website" as const,
  url: `${PRODUCTION_ORIGIN}/`,
  imagePath: "/og/rovexo-homepage-social-v2.jpg",
  imageAbsoluteUrl: `${PRODUCTION_ORIGIN}/og/rovexo-homepage-social-v2.jpg`,
  imageWidth: 1200,
  imageHeight: 630,
  imageAlt: "ROVEXO — Buy • Sell • Grow",
  twitterCard: "summary_large_image" as const,
} as const;

export function getHomepageFacebookShareUrl(url: string = HOMEPAGE_SHARE.url): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getHomepageWhatsAppShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.text,
): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

export function getHomepageXShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.title,
): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/** @deprecated Prefer getHomepageXShareUrl — retained for older imports. */
export function getHomepageMessengerShareUrl(url: string = HOMEPAGE_SHARE.url): string {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}`;
}

/** @deprecated Compact menu no longer includes Telegram. */
export function getHomepageTelegramShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.title,
): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/** @deprecated Compact menu no longer includes Email. */
export function getHomepageEmailShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  title: string = HOMEPAGE_SHARE.title,
  text: string = HOMEPAGE_SHARE.text,
): string {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function isCanonicalHomepageShareUrl(url: string): boolean {
  if (!url || url.includes("localhost") || url.includes("127.0.0.1")) return false;
  if (url.includes("?") || url.includes("#")) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.origin === PRODUCTION_ORIGIN || parsed.origin === "https://rovexo.co.uk") &&
      (parsed.pathname === "/" || parsed.pathname === "")
    );
  } catch {
    return false;
  }
}
