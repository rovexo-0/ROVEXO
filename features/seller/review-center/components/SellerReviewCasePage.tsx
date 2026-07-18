"use client";

import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
  CanonicalTextarea,
} from "@/src/components/canonical";
import type { SellerReviewCase } from "@/lib/moderation/review-center";

type SellerReviewCasePageProps = {
  caseId: string;
};

function formatTimelineDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SellerReviewCasePage({ caseId }: SellerReviewCasePageProps) {
  const [reviewCase, setReviewCase] = useState<SellerReviewCase | null>(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/seller/review-center/${caseId}`);
        if (!response.ok) throw new Error("Failed");
        const payload = (await response.json()) as { case: SellerReviewCase };
        if (cancelled) return;
        setReviewCase(payload.case);
        setExplanation(payload.case.sellerResponse ?? "");
      } catch {
        if (!cancelled) setError("Unable to load review case.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function submitResponse() {
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/seller/review-center/${caseId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanation }),
      });
      const payload = (await response.json()) as { case?: SellerReviewCase; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to submit response.");
        return;
      }
      setReviewCase(payload.case ?? null);
      setMessage("Explanation submitted for review.");
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  const shellProps = {
    title: reviewCase?.productTitle ?? "Review Case",
    backHref: "/seller/review-center",
    backLabel: "Review Center",
    showHeaderTitle: true as const,
    showBottomNav: false as const,
  };

  if (loading) {
    return (
      <AccountCanonicalShell {...shellProps}>
        <p className="cds-section__intro">Loading review case…</p>
      </AccountCanonicalShell>
    );
  }

  if (error && !reviewCase) {
    return (
      <AccountCanonicalShell {...shellProps}>
        <div className="ac-canonical">
          <p className="cds-field__error">{error}</p>
          <CanonicalMenuRow title="Back to Review Center" href="/seller/review-center" />
        </div>
      </AccountCanonicalShell>
    );
  }

  if (!reviewCase) return null;

  return (
    <AccountCanonicalShell
      title={reviewCase.productTitle}
      backHref="/seller/review-center"
      backLabel="Review Center"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="ac-canonical">
        <CanonicalSection title="Details">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Status" value={reviewCase.statusLabel} showChevron={false} />
            <CanonicalMenuRow title="Reason" value={reviewCase.reasonLabel} showChevron={false} />
            <CanonicalMenuRow
              title="Review time"
              value={reviewCase.estimatedReviewTime}
              showChevron={false}
            />
            <CanonicalMenuRow
              title="Moderator notes"
              description={reviewCase.moderatorNotes || "Pending moderator review."}
              showChevron={false}
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="How to fix">
          <CanonicalCard variant="list">
            {reviewCase.howToFix.map((item) => (
              <CanonicalMenuRow key={item} title={item} showChevron={false} />
            ))}
            {reviewCase.canEditListing ? (
              <CanonicalMenuRow
                title="Update listing"
                href={`/seller/listings/${reviewCase.productId}/edit`}
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>

        {reviewCase.evidence.length > 0 ? (
          <CanonicalSection title="Evidence">
            <CanonicalCard variant="list">
              {reviewCase.evidence.map((item, index) => (
                <CanonicalMenuRow
                  key={`${item.label}-${index}`}
                  title={item.label}
                  description={item.content}
                  showChevron={false}
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        <CanonicalSection title="Timeline">
          <CanonicalCard variant="list">
            {reviewCase.timeline.map((step) => (
              <CanonicalMenuRow
                key={step.id}
                title={step.label}
                description={formatTimelineDate(step.at)}
                value={step.complete ? "Done" : undefined}
                showChevron={false}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        {reviewCase.canRespond ? (
          <CanonicalSection title="Your response">
            <CanonicalCard variant="medium" className="flex flex-col gap-ds-3 p-[var(--cds-row-padding-x)] py-ds-3">
              <p className="cds-menu-row__subtitle">
                Explain corrections for the moderation team.
              </p>
              <CanonicalTextarea
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                rows={5}
                placeholder="Explain any corrections you made or why the listing should be restored."
              />
              {error ? <p className="cds-field__error">{error}</p> : null}
              {message ? <p className="cds-field__hint text-primary">{message}</p> : null}
              <CanonicalButton
                disabled={submitting || explanation.trim().length < 10}
                loading={submitting}
                onClick={() => void submitResponse()}
              >
                Submit explanation
              </CanonicalButton>
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        {reviewCase.decision ? (
          <CanonicalSection title="Decision">
            <CanonicalCard variant="list">
              <CanonicalMenuRow title={reviewCase.decision} showChevron={false} />
            </CanonicalCard>
          </CanonicalSection>
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}
