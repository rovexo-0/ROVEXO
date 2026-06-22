"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import type { SellListingMode } from "@/lib/profile/account";
import { usesQuickListingForm } from "@/lib/profile/account";
import type { SellListingDraft } from "@/features/sell/types";
import { getListingValidationErrors } from "@/features/sell/types";
import { FieldError } from "@/features/sell/components/FieldError";
import { SellAnalyzingIndicator } from "@/features/sell/components/SellAnalyzingIndicator";
import { SellListingForm, useSellPublishState } from "@/features/sell/components/SellListingForm";
import { SellQuickListingForm } from "@/features/sell/components/SellQuickListingForm";
import { SellPageHeader } from "@/features/sell/components/SellPageHeader";
import { SellPhotoSection } from "@/features/sell/components/SellPhotoSection";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import { SellPublishFooter } from "@/features/sell/components/SellPublishFooter";
import { SellPublishedStep } from "@/features/sell/components/steps/SellPublishedStep";
import { useSellForm } from "@/features/sell/hooks/use-sell-wizard";

type SellPageProps = {
  listingMode?: SellListingMode;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export function SellPage({
  listingMode = "advanced",
  editListingId,
  initialDraft,
}: SellPageProps) {
  const quickMode = usesQuickListingForm(listingMode);
  const form = useSellForm({ listingMode, editListingId, initialDraft });
  const {
    view,
    isAnalyzing,
    analysisError,
    isPublishing,
    uploadProgress,
    draftSavedMessage,
    saveDraft,
    publishListing,
  } = form;
  const isPublished = view === "published";
  const canPublish = useSellPublishState(form, { mode: listingMode });

  return (
    <BetaAppShell showBottomNav={false}>
      {!isPublished && (
        <SellPageHeader
          onSaveDraft={saveDraft}
          draftSavedMessage={draftSavedMessage}
          editListingId={editListingId}
          quickMode={quickMode}
        />
      )}

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          isPublished
            ? "min-h-[100dvh] justify-center px-ds-4 py-ds-6 pb-[env(safe-area-inset-bottom)]"
            : "gap-ds-5 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        {isPublished ? (
          <SellPublishedStep form={form} />
        ) : (
          <>
            <SellPhotoSection form={form} uploadProgress={uploadProgress} quickMode={quickMode} />
            <FieldError message={getListingValidationErrors(form.draft, { mode: form.listingMode }).photos} />

            {isAnalyzing && <SellAnalyzingIndicator />}

            {analysisError && (
              <p className="text-sm font-medium text-danger" role="alert">
                {analysisError}
              </p>
            )}

            {quickMode ? (
              <SellQuickListingForm form={form} />
            ) : (
              <SellListingForm form={form} />
            )}
          </>
        )}
      </main>

      {!isPublished && (
        <SellPublishFooter
          disabled={!canPublish}
          loading={isPublishing}
          onPublish={() => void publishListing()}
          editListingId={editListingId}
          quickMode={quickMode}
        />
      )}
      <HelpPageFooter pathname="/sell" />
    </BetaAppShell>
  );
}