"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
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
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto w-full max-w-2xl bg-background px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <DashboardShell>
          <div>
            <p className="text-sm text-text-secondary">Selling</p>
            <h1 className="mt-ds-1 text-2xl font-semibold text-text-primary">Review Center</h1>
            <p className="mt-ds-2 text-sm text-text-secondary">
              Listings under moderation review. Hidden from public search until resolved.
            </p>
          </div>

          {loading ? (
            <Card padding="lg" className="rx-glass">
              <p className="text-sm text-text-secondary">Loading review cases…</p>
            </Card>
          ) : null}

          {error ? (
            <Card padding="lg" className="border-danger/30 bg-danger/5">
              <p className="text-sm text-danger">{error}</p>
            </Card>
          ) : null}

          {!loading && !error && cases.length === 0 ? (
            <Card padding="lg" className="rx-glass text-center">
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
            </Card>
          ) : null}

          <div className="flex flex-col gap-ds-3">
            {cases.map((reviewCase) => (
              <Link key={reviewCase.id} href={`/seller/review-center/${reviewCase.id}`}>
                <Card padding="none" className="rx-glass rx-depth-2 overflow-hidden transition hover:shadow-md">
                  <div className="flex gap-ds-4 p-ds-4">
                    <ProductRowImage
                      src={reviewCase.productImageUrl}
                      alt={reviewCase.productTitle}
                      containerClassName="h-20 w-20 shrink-0 rounded-ds-lg"
                      sizes="80px"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-ds-2">
                        <ReviewStatusBadge status={reviewCase.status} label={reviewCase.statusLabel} />
                        <span className="text-xs text-text-muted">{reviewCase.estimatedReviewTime}</span>
                      </div>
                      <h2 className="mt-ds-2 truncate text-base font-semibold text-text-primary">
                        {reviewCase.productTitle}
                      </h2>
                      <p className="mt-ds-1 text-sm text-text-secondary">{reviewCase.reasonLabel}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </DashboardShell>
      </main>
    </BetaAppShell>
  );
}
