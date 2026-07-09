import { getAppUrl } from "@/lib/supabase/env";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "messenger"
  | "x"
  | "linkedin"
  | "telegram"
  | "discord";

export type SocialPreview = {
  platform: SocialPlatform;
  title: string;
  description: string;
  imageUrl: string;
  shareUrl: string;
};

function encodeShareUrl(url: string): string {
  return encodeURIComponent(url);
}

export function buildDynamicOgImageUrl(input: {
  title: string;
  subtitle?: string;
  path: string;
}): string {
  const params = new URLSearchParams({
    title: input.title.slice(0, 80),
    subtitle: (input.subtitle ?? "ROVEXO UK Marketplace").slice(0, 120),
  });
  return `${getAppUrl()}/api/seo/og?${params.toString()}`;
}

export function buildSocialPreviews(page: Pick<OrganicLandingPage, "title" | "description" | "path">): SocialPreview[] {
  const pageUrl = `${getAppUrl()}${page.path}`;
  const imageUrl = buildDynamicOgImageUrl({
    title: page.title.replace(/ \| ROVEXO$/, ""),
    path: page.path,
  });

  const base = {
    title: page.title,
    description: page.description,
    imageUrl,
    shareUrl: pageUrl,
  };

  const platforms: SocialPlatform[] = [
    "facebook",
    "instagram",
    "whatsapp",
    "messenger",
    "x",
    "linkedin",
    "telegram",
    "discord",
  ];

  return platforms.map((platform) => ({ platform, ...base }));
}

export function platformShareLink(platform: SocialPlatform, url: string, text: string): string {
  const encodedUrl = encodeShareUrl(url);
  const encodedText = encodeShareUrl(text);

  switch (platform) {
    case "facebook":
    case "messenger":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    default:
      return url;
  }
}

export function nativeShareMetadata(page: Pick<OrganicLandingPage, "title" | "description" | "path">) {
  const url = `${getAppUrl()}${page.path}`;
  return {
    title: page.title,
    text: page.description,
    url,
  };
}

export function deepLinkUrl(path: string): string {
  return `${getAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function qrCodeUrl(path: string, size = 256): string {
  const url = deepLinkUrl(path);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeShareUrl(url)}`;
}
