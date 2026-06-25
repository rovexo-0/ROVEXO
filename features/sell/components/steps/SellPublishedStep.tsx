"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
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
    <section
      className="flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      aria-labelledby="listing-published-heading"
    >
      {coverPhoto ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-ds-2xl border border-border shadow-lg">
          <Image src={coverPhoto} alt="" fill className="object-cover" sizes="160px" />
        </div>
      ) : null}

      <PublishedCheckmark className={coverPhoto ? "mt-ds-5" : undefined} />

      <h2 id="listing-published-heading" className="mt-ds-5 text-2xl font-bold text-text-primary">
        Listing published successfully
      </h2>
      <p className="mt-ds-2 max-w-sm text-sm text-text-secondary">
        {draft.title || "Your listing"} is live on ROVEXO.
      </p>

      <div className="mt-ds-8 flex w-full max-w-sm flex-col gap-ds-3">
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

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
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
                Featured Listing
              </Button>
            </Link>
            <Link href={`/seller/listings?bump=${publishedSlug}`} className="block w-full">
              <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
                Bump Listing
              </Button>
            </Link>
          </>
        ) : null}

        {publishedSlug ? (
          <ShareListingSheet
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            title={draft.title || "ROVEXO listing"}
            slug={publishedSlug}
          />
        ) : null}

        <Link href="/seller/dashboard" className="block w-full">
          <Button variant="ghost" fullWidth size="lg" className="min-h-ds-7 text-base">
            Seller Dashboard
          </Button>
        </Link>
      </div>
    </section>
  );
}
