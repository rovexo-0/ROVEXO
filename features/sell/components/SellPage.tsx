"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import type { SellListingDraft } from "@/features/sell/types";
import { SellAnalyzingIndicator } from "@/features/sell/components/SellAnalyzingIndicator";
import { SellListingForm, useSellPublishState } from "@/features/sell/components/SellListingForm";
import { SellPageHeader } from "@/features/sell/components/SellPageHeader";
import { SellPhotoSection } from "@/features/sell/components/SellPhotoSection";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import { SellPublishFooter } from "@/features/sell/components/SellPublishFooter";
import { SellPublishedStep } from "@/features/sell/components/steps/SellPublishedStep";
import { useSellForm } from "@/features/sell/hooks/use-sell-wizard";

type SellPageProps = {
  manageInventory?: boolean;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export function SellPage({
  manageInventory = false,
  editListingId,
  initialDraft,
}: SellPageProps) {
  const form = useSellForm({ manageInventory, editListingId, initialDraft });
  const { view, isAnalyzing, analysisError, isPublishing, uploadProgress, draftSavedMessage, saveDraft, publishListing } =
    form;
  const isPublished = view === "published";
  const canPublish = useSellPublishState(form, manageInventory);

  return (
    <BetaAppShell showBottomNav={false}>
      {!isPublished && (
        <SellPageHeader
          onSaveDraft={saveDraft}
          draftSavedMessage={draftSavedMessage}
          editListingId={editListingId}
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
            <SellPhotoSection form={form} uploadProgress={uploadProgress} />

            {isAnalyzing && <SellAnalyzingIndicator />}

            {analysisError && (
              <p className="text-sm font-medium text-danger" role="alert">
                {analysisError}
              </p>
            )}

            <SellListingForm form={form} manageInventory={manageInventory} />
          </>
        )}
      </main>

      {!isPublished && (
        <SellPublishFooter
          disabled={!canPublish}
          loading={isPublishing}
          onPublish={() => void publishListing()}
          editListingId={editListingId}
        />
      )}
      <HelpPageFooter pathname="/sell" />
    </BetaAppShell>
  );
}
