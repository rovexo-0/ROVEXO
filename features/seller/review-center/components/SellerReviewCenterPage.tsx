"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { SellerReviewCase } from "@/lib/moderation/review-center";

type SellerReviewCenterPageProps = {
  backHref?: string;
  backLabel?: string;
};

export function SellerReviewCenterPage({
  backHref = "/seller",
  backLabel = "Selling",
}: SellerReviewCenterPageProps = {}) {
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
      backHref={backHref}
      backLabel={backLabel}
      showHeaderTitle
      showBottomNav={false}
      intro="Listings under moderation review."
    >
      <div className="ac-canonical">
        {loading ? <p className="cds-section__intro">Loading review cases…</p> : null}

        {error ? <p className="cds-field__error">{error}</p> : null}

        {!loading && !error && cases.length === 0 ? (
          <CanonicalInfoBlock variant="description">
            <p className="font-medium text-text-primary">No listings under review</p>
            <p className="mt-ds-1">Reported listings appear here with next steps.</p>
            <CanonicalButtonLink href="/seller/listings" variant="secondary" className="mt-ds-3">
              Back to listings
            </CanonicalButtonLink>
          </CanonicalInfoBlock>
        ) : null}

        {cases.length > 0 ? (
          <CanonicalSection title="Cases">
            <CanonicalCard variant="list">
              {cases.map((reviewCase) => (
                <CanonicalMenuRow
                  key={reviewCase.id}
                  href={`/seller/review-center/${reviewCase.id}`}
                  title={reviewCase.productTitle}
                  description={reviewCase.reasonLabel}
                  value={reviewCase.statusLabel}
                  icon={
                    <ProductRowImage
                      src={reviewCase.productImageUrl}
                      alt={reviewCase.productTitle}
                      containerClassName="h-10 w-10 shrink-0 rounded-ds-md"
                      sizes="40px"
                    />
                  }
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}
