"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { CelebrationAnimation } from "@/components/celebration/CelebrationAnimation";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { useSell } from "@/features/sell/context/SellProvider";

const linkButtonClassName = (variant: keyof typeof buttonVariants) =>
  cn(
    "inline-flex w-full items-center justify-center",
    buttonVariants[variant],
    buttonSizes.lg,
    "min-h-ds-7 rounded-ds-lg text-base",
  );

export function SellPublishedStep() {
  const { draft, publishedSlug, resetForAnotherListing } = useSell();
  const [shareOpen, setShareOpen] = useState(false);
  const coverPhoto = draft.photos[0]?.previewUrl ?? draft.photos[0]?.url;

  return (
    <>
      <CelebrationAnimation active />

      <section
        className="relative z-[1] flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
        aria-labelledby="listing-published-heading"
      >
        <PublishedCheckmark />

        <h2 id="listing-published-heading" className="mt-ds-4 text-2xl font-bold text-text-primary">
          🎉 Congratulations!
        </h2>

        <p className="mt-ds-2 max-w-sm text-base text-text-primary">
          Your listing has been published successfully.
        </p>

        {coverPhoto ? (
          <div className="relative mt-ds-5 h-40 w-40 overflow-hidden rounded-ds-2xl border border-border shadow-lg">
            <Image src={coverPhoto} alt="" fill className="object-cover" sizes="160px" />
          </div>
        ) : null}

        <div
          className="mt-ds-6 w-full max-w-sm border-t border-border pt-ds-6"
          role="group"
          aria-label="Listing actions"
        >
          <div className="flex flex-col gap-ds-3">
            {publishedSlug ? (
              <Link href={`/listing/${publishedSlug}`} className={linkButtonClassName("primary")}>
                View Listing
              </Link>
            ) : null}

            <Link href="/seller/listings" className={linkButtonClassName("secondary")}>
              My Listings
            </Link>

            <button
              type="button"
              className={linkButtonClassName("secondary")}
              onClick={resetForAnotherListing}
            >
              Sell Another Item
            </button>

            <Link href="/" className={linkButtonClassName("ghost")}>
              Back Home
            </Link>
          </div>

          {publishedSlug ? (
            <>
              <p className="mt-ds-5 text-xs font-medium uppercase tracking-wide text-text-secondary">
                Optional actions
              </p>

              <div className="mt-ds-3 flex flex-col gap-ds-2">
                <button
                  type="button"
                  className={linkButtonClassName("ghost")}
                  onClick={() => setShareOpen(true)}
                >
                  Share Listing
                </button>

                <Link
                  href={`/seller/listings?promote=${publishedSlug}`}
                  className={linkButtonClassName("ghost")}
                >
                  Promote Listing
                </Link>
              </div>

              <ShareListingSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                title={draft.title || "ROVEXO listing"}
                slug={publishedSlug}
              />
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
