import type { HeroCampaignId } from "@/lib/home/hero-campaign-library";
import { getHeroCampaignWebpSrc } from "@/lib/home/hero-campaign-library";

/** Shared 8×8 neutral blur for hero photography placeholders */
export const HERO_IMAGE_BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

/** Local hero campaign WebP — no external CDN dependencies */
export function heroCampaignImage(id: HeroCampaignId): string {
  return getHeroCampaignWebpSrc(id);
}

export { getHeroCampaignAvifSrc, getHeroCampaignPngSrc, getHeroCampaignSrcSet } from "@/lib/home/hero-campaign-library";

/** @deprecated Use heroCampaignImage with HeroCampaignId */
export function getHeroCampaignSrc(id: HeroCampaignId): string {
  return heroCampaignImage(id);
}
