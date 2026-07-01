"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import type { SellListingDraft } from "@/features/sell/types";
import { getListingValidationErrors } from "@/features/sell/types";
import { FieldError } from "@/features/sell/components/FieldError";
import { ListingForm } from "@/features/sell/components/ListingForm";
import { OptionalCard } from "@/features/sell/components/OptionalCard";
import { PhotoUploader } from "@/features/sell/components/PhotoUploader";
import { StickyPublishButton } from "@/features/sell/components/StickyPublishButton";
import { SellPublishedStep } from "@/features/sell/components/steps/SellPublishedStep";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";

type SellPageProps = {
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export function SellPage({ editListingId, initialDraft }: SellPageProps) {
  return (
    <BetaAppShell showBottomNav={false} className="sell-page-v1">
      <SellProvider editListingId={editListingId} initialDraft={initialDraft}>
        <SellPageInner />
      </SellProvider>
    </BetaAppShell>
  );
}

function SellPageInner() {
  const { view, formError } = useSell();
  const isPublished = view === "published";

  if (isPublished) {
    return (
      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          "min-h-[100dvh] justify-center px-ds-4 py-ds-6 pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <SellPublishedStep />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <PhotoUploader />
        <PhotoValidationError />
        <ListingForm />
        <OptionalCard />
      </main>

      {formError ? (
        <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[109] px-ds-4">
          <p className="mx-auto max-w-2xl rounded-ds-md border border-destructive/30 bg-destructive/10 px-ds-3 py-ds-2 text-sm text-destructive">
            {formError}
          </p>
        </div>
      ) : null}

      <StickyPublishButton />
    </>
  );
}

function PhotoValidationError() {
  const { draft } = useSell();
  const photoError = getListingValidationErrors(draft, {
    mode: "quick",
    showErrors: false,
  }).photos;

  return <FieldError message={photoError} />;
}
