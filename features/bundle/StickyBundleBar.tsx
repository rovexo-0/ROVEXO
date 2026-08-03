"use client";

import Link from "next/link";
import { formatListingPrice } from "@/lib/listing-card/format";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { bundleItemCount, bundleSubtotal } from "@/lib/bundle/bundle-domain-v1";
import { useActiveBundle } from "@/features/product-detail/AddToBundleSheet";

/**
 * Sticky Bundle Bar — 60px · above bottom nav · after first item only.
 */
export function StickyBundleBar({ hostOnProductPage = false }: { hostOnProductPage?: boolean }) {
  const bundle = useActiveBundle();
  if (!bundle || bundle.items.length === 0) return null;

  const count = bundleItemCount(bundle);
  const total = bundleSubtotal(bundle);
  const seller = bundle.sellerName?.trim() || "Seller";

  return (
    <div
      className={hostOnProductPage ? "pd-v1__bundle-bar-host" : undefined}
      data-sticky-bundle-bar
      data-sticky-bar-height={BUNDLE_ENGINE_V1.viewItemExtension.stickyBarHeightPx}
    >
      <div className="pd-v1__bundle-bar" role="region" aria-label="Active bundle">
        <div className="pd-v1__bundle-bar-inner">
          <div className="pd-v1__bundle-bar-copy">
            <strong>
              {count} {count === 1 ? "item" : "items"} · {formatListingPrice(total)}
            </strong>
            <span>{seller}</span>
          </div>
          <Link href={BUNDLE_ENGINE_V1.ssot.reviewRoute} className="pd-v1__bundle-bar-cta">
            Review
          </Link>
        </div>
      </div>
    </div>
  );
}
