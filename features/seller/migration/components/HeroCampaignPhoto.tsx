"use client";

import { memo } from "react";

import type { HeroCampaignId } from "@/lib/home/hero-campaign-library";
import { getHeroCampaignAvifSrc } from "@/lib/home/hero-campaign-library";
import { HERO_IMAGE_BLUR_DATA_URL } from "@/lib/home/hero-images";
import { cn } from "@/lib/cn";

type HeroCampaignPhotoProps = {
  campaignId: HeroCampaignId;
  webpSrc: string;
  isActive: boolean;
};

export const HeroCampaignPhoto = memo(function HeroCampaignPhoto({
  campaignId,
  webpSrc,
  isActive,
}: HeroCampaignPhotoProps) {
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
        <source srcSet={getHeroCampaignAvifSrc(campaignId)} type="image/avif" />
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={webpSrc}
          alt=""
          decoding="async"
          fetchPriority={isActive ? "high" : "auto"}
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
