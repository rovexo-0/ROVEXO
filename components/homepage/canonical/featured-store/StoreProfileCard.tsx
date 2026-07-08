"use client";

import { Avatar } from "@/components/ui/Avatar";
import { memo } from "react";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { resolveStoreBadge } from "@/lib/homepage/store-badges";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

type StoreProfileCardProps = {
  section: ShowcaseSellerSection;
  active?: boolean;
  priority?: boolean;
};

function formatRatingLine(section: ShowcaseSellerSection): string {
  const rating = section.rating > 0 ? section.rating.toFixed(1) : "—";
  const reviews =
    section.reviewCount > 0 ? ` (${section.reviewCount.toLocaleString("en-GB")})` : "";
  return `${rating}${reviews}`;
}

export const StoreProfileCard = memo(function StoreProfileCard({
  section,
  active = false,
}: StoreProfileCardProps) {
  const badge = resolveStoreBadge(section);
  const followers = section.followerCount ?? section.listings[0]?.views ?? 0;

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
        {badge ? (
          <span className={css.profileBadge} data-tone={badge.tone}>
            {badge.label}
          </span>
        ) : null}
      </span>
      <span className={css.profileName}>{section.sellerName}</span>
      <span className={css.profileMeta}>
        <span aria-hidden>★</span> {formatRatingLine(section)}
      </span>
      {followers > 0 ? (
        <span className={css.profileFollowers}>
          {followers.toLocaleString("en-GB")} followers
        </span>
      ) : null}
      {section.sellerVerified ? (
        <span className={css.profileVerified}>
          <span aria-hidden>✓</span> Verified
        </span>
      ) : null}
    </div>
  );
});
