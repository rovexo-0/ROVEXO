"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { ReviewStatusBadge } from "@/features/seller/review-center/components/ReviewStatusBadge";
import type { SellerReviewCase } from "@/lib/moderation/review-center";

export function SellerReviewCenterPage() {
  const [cases, setCases] = useState<SellerReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/seller/review-center");
        if (!response.ok) throw new Error("Failed");
        const payload = (await response.json()) as { cases: SellerReviewCase[] };
        setCases(payload.cases);
      } catch {
        setError("Unable to load review cases.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AccountCanonicalShell
      title="Review Center"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="flex w-full flex-col gap-ds-3 px-ds-4 pb-ds-5">
        <p className="text-sm text-text-secondary">
          Listings under moderation review. Hidden from public search until resolved.
        </p>

        {loading ? (
          <p className="text-sm text-text-secondary">Loading review cases…</p>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {!loading && !error && cases.length === 0 ? (
          <div className="rounded-ds-lg border border-border px-ds-4 py-ds-5 text-center">
            <p className="text-sm font-medium text-text-primary">No listings under review</p>
            <p className="mt-ds-2 text-sm text-text-secondary">
              When a listing is reported, it will appear here with next steps.
            </p>
            <Link
              href="/seller/listings"
              className="mt-ds-4 inline-flex rounded-ds-full bg-primary px-ds-4 py-ds-2 text-sm font-medium text-white"
            >
              Back to listings
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-ds-2">
          {cases.map((reviewCase) => (
            <Link
              key={reviewCase.id}
              href={`/seller/review-center/${reviewCase.id}`}
              className="ac-canonical__row"
            >
              <ProductRowImage
                src={reviewCase.productImageUrl}
                alt={reviewCase.productTitle}
                containerClassName="h-14 w-14 shrink-0 rounded-ds-md"
                sizes="56px"
              />
              <span className="ac-canonical__row-copy min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-ds-2">
                  <ReviewStatusBadge status={reviewCase.status} label={reviewCase.statusLabel} />
                  <span className="text-xs text-text-muted">{reviewCase.estimatedReviewTime}</span>
                </span>
                <span className="ac-canonical__row-title mt-ds-1 truncate">
                  {reviewCase.productTitle}
                </span>
                <span className="ac-canonical__row-subtitle">{reviewCase.reasonLabel}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
