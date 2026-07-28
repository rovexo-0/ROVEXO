"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { clearBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useSellPageBottomClearance } from "@/features/sell/hooks/use-sell-page-bottom-clearance";
import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";
import type { SellListingDraft } from "@/features/sell/types";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";
import { SellPhotoRail } from "@/features/sell/ui/SellPhotoRail";
import { SellTitleBlock } from "@/features/sell/ui/SellTitleBlock";
import { SellDescriptionBlock } from "@/features/sell/ui/SellDescriptionBlock";
import { SellCategoryBlock } from "@/features/sell/ui/SellCategoryBlock";
import { SellProgressiveAttributes } from "@/features/sell/ui/SellProgressiveAttributes";
import { SellParcelBlock } from "@/features/sell/ui/SellParcelBlock";
import { SellPricingBlock } from "@/features/sell/ui/SellPricingBlock";
import { SellStockQuantityBlock } from "@/features/sell/ui/SellStockQuantityBlock";
import { SellPublishBar } from "@/features/sell/ui/SellPublishBar";
import { PublishSuccessDialog } from "@/components/sell/PublishSuccessDialog";
import { PublishingOverlay } from "@/components/sell/PublishingOverlay";
import { sellFieldDomId } from "@/lib/sell/sell-progressive-flow";
import { clearSellDraft } from "@/lib/sell/draft-storage";
import { clearDraftPhotos } from "@/lib/sell/draft-photo-storage";
import { SELL_ABSOLUTE_AUTHORITY_FREEZE_V1 } from "@/lib/sell/sell-absolute-authority-freeze-v1";

/** Canonical sell page — Account design system only. */
export const SELL_PAGE_CANONICAL_VERSION = SELL_ABSOLUTE_AUTHORITY_FREEZE_V1.version;
export const SELL_PAGE_FREEZE = "FROZEN" as const;

type SellPageProps = {
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

function SellPageInner() {
  const {
    formError,
    publishPhase,
    uploadProgress,
    publishSuccess,
    editListingId,
    resetForAnotherListing,
  } = useSell();
  const { scrollToNextStep } = useSellProgressiveFlow();
  const shellRef = useRef<HTMLDivElement>(null);
  const publishBarRef = useRef<HTMLDivElement>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useSellPageBottomClearance(shellRef, publishBarRef);

  useEffect(() => {
    if (editListingId) return;
    return () => {
      clearSellDraft();
      void clearDraftPhotos();
    };
  }, [editListingId]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (!hash) return;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      const focusable = target?.querySelector<HTMLElement>(
        'button, [href], input, label, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus({ preventScroll: true });
    }, 160);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!publishSuccess) return;
    const openTimer = window.setTimeout(() => setSuccessOpen(true), 0);
    return () => window.clearTimeout(openTimer);
  }, [publishSuccess]);

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

  useEffect(() => () => clearBodyScrollLock(), []);

  return (
    <div ref={shellRef} className="w-full max-w-none sell-compact-premium" data-sell-shell data-sell-compact="v1.0">
      <AccountPageStack
        aria-label="Sell an item"
        className="w-full max-w-none gap-3 pb-[var(--sell-sticky-clearance,96px)]"
      >
        <div id={sellFieldDomId("photos")}>
          <SellPhotoRail onPhotosAdded={handlePhotosAdded} />
        </div>

        <div id={sellFieldDomId("title")}>
          <SellTitleBlock onStepComplete={handleTitleComplete} />
        </div>

        <div id={sellFieldDomId("description")}>
          <SellDescriptionBlock onStepComplete={handleDescriptionComplete} />
        </div>

        <div id={sellFieldDomId("category")}>
          <SellCategoryBlock onCategorySelected={handleCategorySelected} />
        </div>

        {/* Taxonomy-driven dynamic attributes (Brand / Condition / Material / Colour / …) */}
        <SellProgressiveAttributes />

        <div id={sellFieldDomId("price")}>
          <SellPricingBlock bare />
        </div>

        <div id="sell-field-stock">
          <SellStockQuantityBlock />
        </div>

        <div id={sellFieldDomId("parcel")}>
          <SellParcelBlock bare onParcelSelected={handleParcelSelected} />
        </div>

        {formError ? (
          <p className="cds-field__error" role="alert">
            {formError}
          </p>
        ) : null}

        <SellPublishBar ref={publishBarRef} />
      </AccountPageStack>

      <PublishingOverlay
        phase={publishPhase}
        uploadProgress={uploadProgress}
        isEdit={Boolean(editListingId)}
      />

      {publishSuccess ? (
        <PublishSuccessDialog
          open={successOpen}
          publish={publishSuccess}
          onSellAnother={() => void resetForAnotherListing()}
          onClose={() => {
            setSuccessOpen(false);
          }}
          onDismissToHome={() => {
            setSuccessOpen(false);
            window.location.assign("/");
          }}
        />
      ) : null}
    </div>
  );
}

/** Canonical Sell Page — 100% Account / Settings / Profile design system. */
export function SellPage({ editListingId, initialDraft }: SellPageProps) {
  const freshSession = !editListingId && !initialDraft;

  return (
    <AccountCanonicalShell
      title="Sell an item"
      backHref="/"
      showBottomNav={true}
      bottomNavTab="sell"
      showHeaderTitle
      contentClassName="w-full max-w-none"
      dataMyAccountSurface="sell"
    >
      <SellProvider
        editListingId={editListingId}
        initialDraft={initialDraft}
        freshSession={freshSession}
      >
        <div
          data-sell-canonical={SELL_PAGE_CANONICAL_VERSION}
          data-sell-freeze={SELL_PAGE_FREEZE}
          data-blood-code-xviii="18.0"
          data-blood-code-xx="20.0"
          data-blood-code-xxi="21.0"
          data-blood-code-xxii="22.0"
          data-sell-sprint="V"
          data-sell-sprint-status="PERMANENT-FREEZE"
          data-sell-complete="100"
          data-sell-owner-certified="true"
          data-sell-mode="FROZEN"
          data-sell-priority-zero="photo-publish-success"
        >
          <SellPageInner />
        </div>
      </SellProvider>
    </AccountCanonicalShell>
  );
}
