"use client";

/**
 * Store Showcase success — confirmation only.
 */

import Link from "next/link";
import { resolvePromotionSuccessContent } from "@/lib/promotions/success-copy";

export type StoreShowcaseSuccessProps = {
  open: boolean;
  onDone: () => void;
};

export function StoreShowcaseSuccess({ open, onDone }: StoreShowcaseSuccessProps) {
  if (!open) return null;

  const content = resolvePromotionSuccessContent("store_featured");

  return (
    <section
      className="store-showcase-v1__success"
      data-store-showcase-success="v1.0"
      role="status"
    >
      <h2 className="store-showcase-v1__title">{content.title}</h2>
      <p className="store-showcase-v1__tagline">{content.body}</p>
      <p className="store-showcase-v1__meta">Expires in: {content.expiresLabel}</p>
      <div className="store-showcase-v1__actions store-showcase-v1__actions--stack">
        <Link href="/" className="store-showcase-v1__cta" onClick={onDone}>
          Continue Shopping
        </Link>
        <Link href="/seller/listings" className="store-showcase-v1__secondary" onClick={onDone}>
          Go to My Listings
        </Link>
      </div>
    </section>
  );
}
