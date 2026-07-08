"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { CelebrationAnimation } from "@/components/celebration/CelebrationAnimation";
import { useSell } from "@/features/sell/context/SellProvider";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-12 w-12" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function SellSuccessScreen() {
  const { publishedSlug, resetForAnotherListing } = useSell();

  return (
    <div className="sell-success">
      <CelebrationAnimation active />

      <section className="sell-success__inner" aria-labelledby="sell-live-heading">
        <span className="sell-success__check" aria-hidden>
          <CheckIcon />
        </span>

        <h2 id="sell-live-heading" className="mt-ds-6 text-2xl font-bold text-white">
          Your item is live!
        </h2>
        <p className="mt-ds-2 max-w-xs text-base text-white/85">
          Your listing has been published successfully.
        </p>

        <div className="mt-ds-8 flex w-full max-w-xs flex-col gap-ds-3" role="group" aria-label="Listing actions">
          {publishedSlug ? (
            <Link
              href={`/listing/${publishedSlug}`}
              className={cn(
                "inline-flex min-h-ds-7 w-full items-center justify-center rounded-ds-lg bg-white text-base font-semibold text-primary shadow-ds-medium transition-transform active:scale-[0.99]",
                focusRing,
              )}
            >
              View listing
            </Link>
          ) : null}

          <button
            type="button"
            onClick={resetForAnotherListing}
            className={cn(
              "inline-flex min-h-ds-7 w-full items-center justify-center rounded-ds-lg border border-white/70 bg-transparent text-base font-semibold text-white transition-colors active:bg-white/10",
              focusRing,
            )}
          >
            List another item
          </button>
        </div>
      </section>
    </div>
  );
}
