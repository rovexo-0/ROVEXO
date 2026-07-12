"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { clearBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { AccountCanonicalHeader } from "@/features/account-canonical";
import { useSellPageBottomClearance } from "@/features/sell/hooks/use-sell-page-bottom-clearance";
import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";
import { useDraftListing } from "@/features/sell/hooks/useDraftListing";
import type { SellListingDraft } from "@/features/sell/types";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";
import { SellPhotoRail } from "@/features/sell/ui/SellPhotoRail";
import { SellTitleBlock } from "@/features/sell/ui/SellTitleBlock";
import { SellDescriptionBlock } from "@/features/sell/ui/SellDescriptionBlock";
import { SellCategoryBlock } from "@/features/sell/ui/SellCategoryBlock";
import { SellProgressiveAttributes } from "@/features/sell/ui/SellProgressiveAttributes";
import { SellConditionBlock } from "@/features/sell/ui/SellConditionBlock";
import { SellParcelBlock } from "@/features/sell/ui/SellParcelBlock";
import { SellPricingBlock } from "@/features/sell/ui/SellPricingBlock";
import { SellPublishBar } from "@/features/sell/ui/SellPublishBar";
import { DraftRecoveryDialog } from "@/components/sell/DraftRecoveryDialog";
import { PublishSuccessDialog } from "@/components/sell/PublishSuccessDialog";
import { PublishingOverlay } from "@/components/sell/PublishingOverlay";
import { sellFieldDomId } from "@/lib/sell/sell-progressive-flow";

/** Canonical sell page version — frozen after validation. */
export const SELL_PAGE_CANONICAL_VERSION = "v1.0-canonical";

type SellScreenProps = {
  editListingId?: string;
  initialDraft?: SellListingDraft;
  /** Resume autosaved local draft (My Account → Draft Listings). Default: fresh session. */
  restoreDraft?: boolean;
};

type SellScreenInnerProps = {
  freshSession: boolean;
  restoreDraft: boolean;
  onRecoveryResolved: () => void;
};

function SellScreenInner({ freshSession, restoreDraft, onRecoveryResolved }: SellScreenInnerProps) {
  const {
    formError,
    publishPhase,
    uploadProgress,
    publishSuccess,
    editListingId,
    restoreLocalDraft,
    discardRecoveryDraft,
    resetForAnotherListing,
  } = useSell();
  const { isStepVisible, scrollToNextStep } = useSellProgressiveFlow();
  const shellRef = useRef<HTMLDivElement>(null);
  const publishBarRef = useRef<HTMLDivElement>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const { recoveryOpen, setRecoveryOpen, checkRecovery } = useDraftListing({
    enabled: freshSession,
    restoreDraft,
  });

  useSellPageBottomClearance(shellRef, publishBarRef);

  useEffect(() => {
    if (!freshSession) return;
    void checkRecovery().then((recoverable) => {
      if (!recoverable) onRecoveryResolved();
    });
  }, [checkRecovery, freshSession, onRecoveryResolved]);

  useEffect(() => {
    if (publishSuccess) setSuccessOpen(true);
  }, [publishSuccess]);

  const handleContinueDraft = useCallback(async () => {
    await restoreLocalDraft();
    setRecoveryOpen(false);
    onRecoveryResolved();
  }, [onRecoveryResolved, restoreLocalDraft, setRecoveryOpen]);

  const handleDiscardDraft = useCallback(async () => {
    await discardRecoveryDraft();
    setRecoveryOpen(false);
    onRecoveryResolved();
  }, [discardRecoveryDraft, onRecoveryResolved, setRecoveryOpen]);

  const handlePhotosAdded = useCallback(() => {
    scrollToNextStep("photos");
  }, [scrollToNextStep]);

  const handleTitleComplete = useCallback(() => {
    scrollToNextStep("title");
  }, [scrollToNextStep]);

  const handleDescriptionComplete = useCallback(() => {
    scrollToNextStep("description");
  }, [scrollToNextStep]);

  const handleCategorySelected = useCallback(() => {
    scrollToNextStep("category");
  }, [scrollToNextStep]);

  const handleParcelSelected = useCallback(() => {
    scrollToNextStep("parcel");
  }, [scrollToNextStep]);

  const handleConditionSelected = useCallback(() => {
    scrollToNextStep("condition");
  }, [scrollToNextStep]);

  useEffect(() => () => clearBodyScrollLock(), []);

  return (
    <div ref={shellRef} className="sell-page-v1-shell">
      <AccountCanonicalHeader fallbackHref="/" />
      <ScrollContainer
        withBottomNav={false}
        className="sell-page-v1-content mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-[max(env(safe-area-inset-left),var(--cds-space-page-x))] py-ds-3"
      >
        <div id={sellFieldDomId("photos")} className="sell-page-field">
          <SellPhotoRail onPhotosAdded={handlePhotosAdded} />
        </div>

        <div id={sellFieldDomId("title")} className="sell-page-field">
          <SellTitleBlock onStepComplete={handleTitleComplete} />
        </div>

        <div id={sellFieldDomId("category")} className="sell-page-field">
          <SellCategoryBlock onCategorySelected={handleCategorySelected} />
        </div>

        {isStepVisible("description") ? (
          <div id={sellFieldDomId("description")} className="sell-page-field">
            <SellDescriptionBlock onStepComplete={handleDescriptionComplete} />
          </div>
        ) : null}

        <SellProgressiveAttributes />

        {isStepVisible("condition") ? (
          <div id={sellFieldDomId("condition")} className="sell-page-field">
            <SellConditionBlock onConditionSelected={handleConditionSelected} />
          </div>
        ) : null}

        {isStepVisible("parcel") ? (
          <div id={sellFieldDomId("parcel")} className="sell-page-field">
            <SellParcelBlock bare onParcelSelected={handleParcelSelected} />
          </div>
        ) : null}

        {isStepVisible("price") ? (
          <div id={sellFieldDomId("price")} className="sell-page-field">
            <SellPricingBlock bare />
          </div>
        ) : null}

        {formError ? (
          <p
            className="rounded-ds-md border border-destructive/30 bg-destructive/10 px-ds-3 py-ds-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
      </ScrollContainer>

      <PublishingOverlay
        phase={publishPhase}
        uploadProgress={uploadProgress}
        isEdit={Boolean(editListingId)}
      />
      <SellPublishBar ref={publishBarRef} />

      <DraftRecoveryDialog
        open={recoveryOpen}
        onContinue={() => void handleContinueDraft()}
        onDiscard={() => void handleDiscardDraft()}
      />

      {publishSuccess ? (
        <PublishSuccessDialog
          open={successOpen}
          publish={publishSuccess}
          onSellAnother={() => void resetForAnotherListing()}
          onClose={() => setSuccessOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function SellScreen({ editListingId, initialDraft, restoreDraft = false }: SellScreenProps) {
  const freshSession = !editListingId && !initialDraft && !restoreDraft;
  const [draftRecoveryPending, setDraftRecoveryPending] = useState(freshSession);

  return (
    <BetaAppShell showBottomNav={false} className="sell-page-v1">
      <SellProvider
        editListingId={editListingId}
        initialDraft={initialDraft}
        freshSession={freshSession}
        restoreDraft={restoreDraft}
        draftRecoveryPending={draftRecoveryPending}
      >
        <div data-sell-canonical={SELL_PAGE_CANONICAL_VERSION}>
          <SellScreenInner
            freshSession={freshSession}
            restoreDraft={restoreDraft}
            onRecoveryResolved={() => setDraftRecoveryPending(false)}
          />
        </div>
      </SellProvider>
    </BetaAppShell>
  );
}
