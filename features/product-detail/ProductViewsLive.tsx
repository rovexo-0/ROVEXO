"use client";

import { EyeLineIcon } from "@/components/icons/RvxLineIcons";
import { formatProductViewsLabel } from "@/lib/listing-card/format";
import { useLiveProductViews } from "@/lib/views/use-live-product-views";

type ProductViewsLiveProps = {
  slug: string;
  initialViews: number;
};

/** Product page views — DATABASE live value only (View Master Architect L7). */
export function ProductViewsLive({ slug, initialViews }: ProductViewsLiveProps) {
  const views = useLiveProductViews(slug, initialViews);
  const label = formatProductViewsLabel(views);

  return (
    <p className="pd-v1__views" data-view-live={slug} aria-label={label}>
      <EyeLineIcon width={14} height={14} aria-hidden />
      <span>{label}</span>
    </p>
  );
}
