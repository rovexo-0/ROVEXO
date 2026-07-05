"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import type { SellListingDraft } from "@/features/sell/types";
import { getListingValidationErrors } from "@/features/sell/types";
import { FieldError } from "@/features/sell/components/FieldError";
import { ListingForm } from "@/features/sell/components/ListingForm";
import { ItemConditionSelector } from "@/features/sell/components/ItemConditionSelector";
import { OptionalCard } from "@/features/sell/components/OptionalCard";
import { PhotoUploader } from "@/features/sell/components/PhotoUploader";
import { StickyPublishButton } from "@/features/sell/components/StickyPublishButton";
import { SellPublishedStep } from "@/features/sell/components/steps/SellPublishedStep";
import { SellProfilerRoot } from "@/features/sell/components/SellProfilerRoot";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";

type SellPageProps = {
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export function SellPage({ editListingId, initialDraft }: SellPageProps) {
  return (
    <BetaAppShell showBottomNav={false} className="sell-page-v1">
      <SellProvider editListingId={editListingId} initialDraft={initialDraft}>
        <SellProfilerRoot>
          <SellPageInner />
        </SellProfilerRoot>
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
      <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4">
        <PhotoUploader />
        <PhotoValidationError />
        <ListingForm />
        <ItemConditionSelector />
        <OptionalCard />

        {formError ? (
          <p className="rounded-ds-md border border-destructive/30 bg-destructive/10 px-ds-3 py-ds-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <StickyPublishButton position="sticky" />
      </main>
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
