"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { useCallback, useEffect, useRef, useState } from "react";
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
  listingsHref?: string;
  listingsLabel?: string;
  caseHrefBase?: string;
  surface?: "business";
};

export function SellerReviewCenterPage({
  backHref = "/seller",
  backLabel = "Selling",
  listingsHref = "/seller/listings",
  listingsLabel = "Back to listings",
  caseHrefBase = "/seller/review-center",
  surface,
}: SellerReviewCenterPageProps = {}) {
  const [cases, setCases] = useState<SellerReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const endpoint =
    surface === "business"
      ? "/api/seller/review-center?surface=business"
      : "/api/seller/review-center";

  const refreshCases = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      try {
        const response = await fetch(endpoint, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          setError("Unable to load review cases.");
          return;
        }
        const payload = (await response.json()) as { cases?: SellerReviewCase[] };
        setCases(Array.isArray(payload.cases) ? payload.cases : []);
        setError(null);
      } catch {
        setError("Unable to load review cases.");
      } finally {
        setLoading(false);
      }
    })();
    inFlight.current = run.finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [endpoint]);

  useEffect(() => {
    void refreshCases();
  }, [refreshCases]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshCases();
    };
    const onPageShow = () => {
      void refreshCases();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refreshCases]);

  return (
    <AccountCanonicalShell
      title="Review Center"
      backHref={backHref}
      backLabel={backLabel}
      showHeaderTitle
      showBottomNav={false}
      intro="Listings under moderation review."
    >
      <div className="ac-canonical" data-review-center={surface ?? "seller"}>
        {loading ? <p className="cds-section__intro">Loading review cases…</p> : null}

        {error ? <p className="cds-field__error">{error}</p> : null}

        {!loading && !error && cases.length === 0 ? (
          <CanonicalInfoBlock variant="description">
            <p className="font-medium text-text-primary">No listings under review</p>
            <p className="mt-ds-1">Reported listings appear here with next steps.</p>
            <CanonicalButtonLink href={listingsHref} variant="secondary" className="mt-ds-3">
              {listingsLabel}
            </CanonicalButtonLink>
          </CanonicalInfoBlock>
        ) : null}

        {cases.length > 0 ? (
          <CanonicalSection title="Cases">
            <CanonicalCard variant="list">
              {cases.map((reviewCase) => (
                <CanonicalMenuRow
                  key={reviewCase.id}
                  href={`${caseHrefBase}/${reviewCase.id}`}
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
