"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  isRovexoCategoryPremiumKey,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { getSearchCategoryHeroPath } from "@/lib/search/search-category-heroes-v1";
import { resolveCategoryIconType } from "@/lib/home/category-icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type SearchCategoryBrowseCardProps = {
  name: string;
  slug: string;
  itemCount: number;
  href?: string;
  /** Prefer rail icon key when slug ≠ icon (e.g. kids → kids-fashion). */
  iconKey?: string;
};

function formatItemCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "item" : "items"}`;
}

function resolvePremiumKey(iconKey: string | undefined, slug: string): RovexoCategoryPremiumKey {
  if (iconKey && isRovexoCategoryPremiumKey(iconKey)) return iconKey;
  const fromSlug = resolveCategoryIconType(slug);
  if (isRovexoCategoryPremiumKey(fromSlug)) return fromSlug;
  return "electronics";
}

/**
 * Blood XXXI — Search category tile (UI only).
 * Image → Name → Count. No purple badges.
 */
export function SearchCategoryBrowseCard({
  name,
  slug,
  itemCount,
  href,
  iconKey,
}: SearchCategoryBrowseCardProps) {
  const premiumKey = resolvePremiumKey(iconKey, slug);
  const artSrc = getSearchCategoryHeroPath(premiumKey);

  return (
    <Link
      href={href ?? `/category/${encodeURIComponent(slug)}`}
      className={cn("srch-land__cat", focusRing)}
      aria-label={`${name}, ${formatItemCount(itemCount)}`}
    >
      <span className="srch-land__cat-art" aria-hidden>
        <SafeImage
          src={artSrc}
          alt=""
          width={512}
          height={512}
          className="srch-land__cat-img"
          sizes="(max-width: 640px) 33vw, 180px"
          unoptimized
        />
      </span>
      <span className="srch-land__cat-meta">
        <span className="srch-land__cat-name">{name}</span>
        <span className="srch-land__cat-count">{formatItemCount(itemCount)}</span>
      </span>
    </Link>
  );
}
