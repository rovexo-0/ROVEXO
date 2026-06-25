"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { CelebrationAnimation } from "@/components/celebration/CelebrationAnimation";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";

type SellPublishedStepProps = {
  form: SellFormController;
};

export function SellPublishedStep({ form }: SellPublishedStepProps) {
  const { draft, publishedSlug, resetForAnotherListing } = form;
  const [shareOpen, setShareOpen] = useState(false);
  const coverPhoto = draft.photos[0]?.previewUrl ?? draft.photos[0]?.url;

  return (
    <>
      <CelebrationAnimation />

      <section
        className="relative z-[1] flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
        aria-labelledby="listing-published-heading"
      >
        <PublishedCheckmark />

        <h2 id="listing-published-heading" className="mt-ds-4 text-2xl font-bold text-text-primary">
          Listing Published Successfully
        </h2>

        {coverPhoto ? (
          <div className="relative mt-ds-5 h-40 w-40 overflow-hidden rounded-ds-2xl border border-border shadow-lg">
            <Image src={coverPhoto} alt="" fill className="object-cover" sizes="160px" />
          </div>
        ) : null}

        <p className="mt-ds-4 max-w-sm text-sm text-text-secondary">
          Your listing is now live on ROVEXO.
        </p>

        <div
          className="mt-ds-6 w-full max-w-sm border-t border-border pt-ds-6"
          role="group"
          aria-label="Listing actions"
        >
          <div className="flex flex-col gap-ds-3">
            {publishedSlug ? (
              <Link href={`/listing/${publishedSlug}`} className="block w-full">
                <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
                  View Listing
                </Button>
              </Link>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="lg"
              className="min-h-ds-7 rounded-ds-lg text-base"
              onClick={resetForAnotherListing}
            >
              List Another Item
            </Button>
          </div>

          <p className="mt-ds-5 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Optional actions
          </p>

          <div className="mt-ds-3 flex flex-col gap-ds-2">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              size="lg"
              className="min-h-ds-7 text-base"
              onClick={() => setShareOpen(true)}
              disabled={!publishedSlug}
            >
              Share Listing
            </Button>

            {publishedSlug ? (
              <>
                <Link href={`/seller/listings?promote=${publishedSlug}`} className="block w-full">
                  <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
                    Promote Listing
                  </Button>
                </Link>
                <Link href={`/seller/listings?feature=${publishedSlug}`} className="block w-full">
                  <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
                    Feature Listing
                  </Button>
                </Link>
                <Link href={`/seller/listings?bump=${publishedSlug}`} className="block w-full">
                  <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
                    Bump Listing
                  </Button>
                </Link>
              </>
            ) : null}
          </div>

          {publishedSlug ? (
            <ShareListingSheet
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              title={draft.title || "ROVEXO listing"}
              slug={publishedSlug}
            />
          ) : null}

          <Link href="/seller/dashboard" className="mt-ds-4 block w-full">
            <Button variant="ghost" fullWidth size="sm" className="min-h-ds-6 text-sm text-text-secondary">
              Seller Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
