"use client";

import { memo } from "react";

import type { HeroCampaignId } from "@/lib/home/hero-campaign-library";
import {
  getHeroCampaignPngSrc,
  getHeroCampaignSrcSet,
} from "@/lib/home/hero-campaign-library";
import { HERO_IMAGE_BLUR_DATA_URL } from "@/lib/home/hero-images";
import { cn } from "@/lib/cn";

type HeroCampaignPhotoProps = {
  campaignId: HeroCampaignId;
  isActive: boolean;
  priority?: boolean;
};

export const HeroCampaignPhoto = memo(function HeroCampaignPhoto({
  campaignId,
  isActive,
  priority = false,
}: HeroCampaignPhotoProps) {
  const avifSrcSet = getHeroCampaignSrcSet(campaignId, "avif");
  const webpSrcSet = getHeroCampaignSrcSet(campaignId, "webp");
  const pngFallback = getHeroCampaignPngSrc(campaignId);

  return (
    <div
      className="import-rx-hero-banner__photo"
      aria-hidden
      style={{
        backgroundImage: `url(${HERO_IMAGE_BLUR_DATA_URL})`,
        backgroundSize: "cover",
      }}
    >
      <picture className="import-rx-hero-banner__photo-picture">
        <source srcSet={avifSrcSet} sizes="100vw" type="image/avif" />
        <source srcSet={webpSrcSet} sizes="100vw" type="image/webp" />
        <img
          src={pngFallback}
          srcSet={getHeroCampaignSrcSet(campaignId, "png")}
          sizes="100vw"
          alt=""
          decoding="async"
          loading={priority || isActive ? "eager" : "lazy"}
          fetchPriority={priority || isActive ? "high" : "auto"}
          className={cn(
            "import-rx-hero-banner__photo-img",
            isActive && "import-rx-hero-banner__photo-img--active",
          )}
        />
      </picture>
      <div className="import-rx-hero-banner__photo-overlay" />
    </div>
  );
});
