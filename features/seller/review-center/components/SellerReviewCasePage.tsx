"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PageBack } from "@/components/navigation/PageBack";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ReviewStatusBadge } from "@/features/seller/review-center/components/ReviewStatusBadge";
import { ReviewTimeline } from "@/features/seller/review-center/components/ReviewTimeline";
import type { SellerReviewCase } from "@/lib/moderation/review-center";

type SellerReviewCasePageProps = {
  caseId: string;
};

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
      setMessage("Your explanation was submitted for moderator review.");
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <BetaAppShell showBottomNav={false}>
        <main className="mx-auto w-full max-w-2xl px-5 py-5">
          <p className="text-sm text-text-secondary">Loading review case…</p>
        </main>
      </BetaAppShell>
    );
  }

  if (error && !reviewCase) {
    return (
      <BetaAppShell showBottomNav={false}>
        <main className="mx-auto w-full max-w-2xl px-5 py-5">
          <p className="text-sm text-danger">{error}</p>
          <Link href="/seller/review-center" className="mt-ds-3 inline-block text-sm text-primary">
            Back to Review Center
          </Link>
        </main>
      </BetaAppShell>
    );
  }

  if (!reviewCase) return null;

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto w-full max-w-2xl bg-background px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <DashboardShell>
          <div className="flex items-start justify-between gap-ds-3">
            <div>
              <PageBack variant="text" backHref="/seller/review-center" backLabel="Review Center" className="mb-ds-2" />
              <h1 className="text-2xl font-semibold text-text-primary">{reviewCase.productTitle}</h1>
              <div className="mt-ds-2">
                <ReviewStatusBadge status={reviewCase.status} label={reviewCase.statusLabel} />
              </div>
            </div>
            <ProductRowImage
              src={reviewCase.productImageUrl}
              alt={reviewCase.productTitle}
              containerClassName="h-16 w-16 shrink-0 rounded-ds-lg"
              sizes="64px"
            />
          </div>

          <Card padding="lg" className="rx-glass rx-depth-2">
            <h2 className="text-base font-semibold text-text-primary">Review details</h2>
            <dl className="mt-ds-4 grid gap-ds-3 text-sm">
              <Detail label="Status" value={reviewCase.statusLabel} />
              <Detail label="Reason" value={reviewCase.reasonLabel} />
              <Detail label="Estimated review time" value={reviewCase.estimatedReviewTime} />
              <Detail label="Moderator notes" value={reviewCase.moderatorNotes || "Pending moderator review."} />
            </dl>
          </Card>

          <Card padding="lg" className="rx-glass">
            <h2 className="text-base font-semibold text-text-primary">How to fix</h2>
            <ul className="mt-ds-3 space-y-ds-2 text-sm text-text-secondary">
              {reviewCase.howToFix.map((item) => (
                <li key={item} className="flex gap-ds-2">
                  <span aria-hidden className="text-primary">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {reviewCase.canEditListing ? (
              <Link
                href={`/seller/listings/${reviewCase.productId}/edit`}
                className="mt-ds-4 inline-flex rounded-ds-full border border-border px-ds-4 py-ds-2 text-sm font-medium text-text-primary"
              >
                Update listing
              </Link>
            ) : null}
          </Card>

          <Card padding="lg" className="rx-glass">
            <h2 className="text-base font-semibold text-text-primary">Evidence</h2>
            <div className="mt-ds-3 flex flex-col gap-ds-3">
              {reviewCase.evidence.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-ds-lg bg-surface-muted px-ds-4 py-ds-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{item.label}</p>
                  <p className="mt-ds-1 text-sm text-text-primary">{item.content}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="rx-glass">
            <h2 className="text-base font-semibold text-text-primary">Timeline</h2>
            <div className="mt-ds-4">
              <ReviewTimeline steps={reviewCase.timeline} />
            </div>
          </Card>

          {reviewCase.canRespond ? (
            <Card padding="lg" className="rx-glass rx-depth-2">
              <h2 className="text-base font-semibold text-text-primary">Your response</h2>
              <p className="mt-ds-1 text-sm text-text-secondary">
                Add an explanation for the moderation team. Do not upload documents or invoices.
              </p>
              <textarea
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                rows={5}
                className="rx-input mt-ds-3 min-h-[120px] w-full px-ds-3 py-ds-2 text-sm"
                placeholder="Explain any corrections you made or why the listing should be restored."
              />
              {error ? <p className="mt-ds-2 text-sm text-danger">{error}</p> : null}
              {message ? <p className="mt-ds-2 text-sm text-primary">{message}</p> : null}
              <Button
                className="mt-ds-4"
                disabled={submitting || explanation.trim().length < 10}
                onClick={() => void submitResponse()}
              >
                {submitting ? "Submitting…" : "Submit explanation"}
              </Button>
            </Card>
          ) : null}

          {reviewCase.decision ? (
            <Card padding="lg" className="border-success/30 bg-success/5">
              <h2 className="text-base font-semibold text-text-primary">Decision</h2>
              <p className="mt-ds-2 text-sm text-text-primary">{reviewCase.decision}</p>
            </Card>
          ) : null}
        </DashboardShell>
      </main>
    </BetaAppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-ds-1 text-text-primary">{value}</dd>
    </div>
  );
}
