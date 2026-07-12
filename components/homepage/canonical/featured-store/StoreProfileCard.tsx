"use client";

import { Avatar } from "@/components/ui/Avatar";
import { memo } from "react";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

type StoreProfileCardProps = {
  section: ShowcaseSellerSection;
  active?: boolean;
  priority?: boolean;
};

function formatRatingLine(section: ShowcaseSellerSection): string {
  if (section.reviewCount <= 0) return "New";
  return section.rating > 0 ? section.rating.toFixed(1) : "New";
}

export const StoreProfileCard = memo(function StoreProfileCard({
  section,
  active = false,
}: StoreProfileCardProps) {
  return (
    <div
      className={css.profileCard}
      data-active={active ? "true" : "false"}
      aria-hidden={active ? undefined : true}
    >
      <span className={css.profileLogoWrap}>
        <span className={css.profileLogo}>
          <Avatar
            src={section.sellerAvatar}
            alt={section.sellerName}
            name={section.sellerName}
            size="lg"
            className="h-full w-full"
          />
        </span>
      </span>
      <span className={css.profileName}>{section.sellerName}</span>
      <span className={css.profileMeta}>
        <span aria-hidden>★</span> {formatRatingLine(section)}
      </span>
    </div>
  );
});
