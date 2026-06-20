"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";

type SellPublishedStepProps = {
  form: SellFormController;
};

export function SellPublishedStep({ form }: SellPublishedStepProps) {
  const { draft, publishedSlug } = form;

  const handleShare = useCallback(async () => {
    if (!publishedSlug || typeof window === "undefined") return;

    const url = `${window.location.origin}/listing/${publishedSlug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator
        .share({
          title: draft.title,
          url,
        })
        .catch(() => undefined);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url).catch(() => undefined);
    }
  }, [draft.title, publishedSlug]);

  return (
    <section
      className="flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      aria-labelledby="listing-published-heading"
    >
      <PublishedCheckmark />

      <h2
        id="listing-published-heading"
        className="mt-ds-6 text-xl font-semibold text-text-primary"
      >
        Your listing is ready.
      </h2>

      <div className="mt-ds-8 flex w-full max-w-sm flex-col gap-ds-3">
        {publishedSlug && (
          <Link href={`/listing/${publishedSlug}`} className="block w-full">
            <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
              View Listing
            </Button>
          </Link>
        )}

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
          onClick={() => void handleShare()}
          disabled={!publishedSlug}
        >
          Share Listing
        </Button>

        <Link href="/account" className="block w-full">
          <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
            Back to Home
          </Button>
        </Link>
      </div>
    </section>
  );
}
