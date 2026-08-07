"use client";

/* P0-01: page-scoped Sell CSS — not loaded on Homepage/Search via platform index. */
import "@/styles/rovexo/sell.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { CanonicalModal } from "@/src/components/canonical";
import { clearBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useSellPageBottomClearance } from "@/features/sell/hooks/use-sell-page-bottom-clearance";
import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";
import type { SellListingDraft } from "@/features/sell/types";
import { SellProvider, useSellActions, useSellDraft, useSellPublishOutcome, useSellPublishProgress } from "@/features/sell/context/SellProvider";
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
import { SELL_ABSOLUTE_AUTHORITY_FREEZE_V1 } from "@/lib/sell/sell-absolute-authority-freeze-v1";
import {
  CANONICAL_EDIT_LISTING_ENGINE_V1,
  sellPageTitle,
} from "@/lib/sell/canonical-edit-listing-engine-v1";
import { getListingCanonicalPath } from "@/lib/sell/publish-success";
import { usePageBack } from "@/hooks/navigation/usePageBack";

/** Canonical sell page — Account design system only. */
export const SELL_PAGE_CANONICAL_VERSION = SELL_ABSOLUTE_AUTHORITY_FREEZE_V1.version;
export const SELL_PAGE_FREEZE = "FROZEN" as const;

type SellPageProps = {
  editListingId?: string;
  editListingSlug?: string;
  editListingStatus?: string;
  initialDraft?: SellListingDraft;
};

/** Isolated: upload/publish progress ticks must not wake the form tree (P7). */
function SellPublishingOverlayHost({ isEdit }: { isEdit: boolean }) {
  const { publishPhase, uploadProgress } = useSellPublishProgress();
  return <PublishingOverlay phase={publishPhase} uploadProgress={uploadProgress} isEdit={isEdit} />;
}

/** Isolated: formError updates without progress subscription (P7). */
function SellFormErrorHost() {
  const { formError } = useSellPublishOutcome();
  if (!formError) return null;
  return (
    <p className="cds-field__error" role="alert">
      {formError}
    </p>
  );
}

function SellPageInner() {
  const { editListingId, editListingSlug } = useSellDraft();
  const { publishSuccess } = useSellPublishOutcome();
  const { getIsDirty, resetForAnotherListing } = useSellActions();
  const { scrollToNextStep } = useSellProgressiveFlow();
  const shellRef = useRef<HTMLDivElement>(null);
  const publishBarRef = useRef<HTMLDivElement>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const leaveActionRef = useRef<(() => void) | null>(null);
  const isEdit = Boolean(editListingId);
  const backHref = editListingSlug
    ? getListingCanonicalPath(editListingSlug)
    : isEdit
      ? "/seller/listings"
      : "/";
  const pageBack = usePageBack({
    backHref,
    preferHistory: !isEdit,
    backLabel: "Back",
  });

  useSellPageBottomClearance(shellRef, publishBarRef);

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

  useEffect(() => {
    if (!isEdit) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!getIsDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [getIsDirty, isEdit]);

  const requestLeave = useCallback(
    (leave: () => void) => {
      if (!isEdit || !getIsDirty()) {
        leave();
        return;
      }
      leaveActionRef.current = leave;
      setUnsavedOpen(true);
    },
    [getIsDirty, isEdit],
  );

  const handleBack = useCallback(() => {
    requestLeave(() => pageBack.goBack());
  }, [pageBack, requestLeave]);

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
    <AccountCanonicalShell
      title={sellPageTitle(isEdit)}
      backHref={backHref}
      onBack={handleBack}
      showBottomNav={true}
      bottomNavTab="sell"
      showHeaderTitle
      contentClassName="w-full max-w-none"
      dataMyAccountSurface="sell"
    >
      <div
        data-sell-canonical={SELL_PAGE_CANONICAL_VERSION}
        data-sell-freeze={SELL_PAGE_FREEZE}
        data-edit-listing-engine={CANONICAL_EDIT_LISTING_ENGINE_V1.version}
        data-sell-mode={isEdit ? "EDIT" : "CREATE"}
        data-blood-code-xviii="18.0"
        data-blood-code-xx="20.0"
        data-blood-code-xxi="21.0"
        data-blood-code-xxii="22.0"
        data-sell-sprint="V"
        data-sell-sprint-status="PERMANENT-FREEZE"
        data-sell-complete="100"
        data-sell-owner-certified="true"
        data-sell-priority-zero="photo-publish-success"
      >
        <div
          ref={shellRef}
          className="w-full max-w-none sell-compact-premium"
          data-sell-shell
          data-sell-compact="v1.0"
        >
          <AccountPageStack
            aria-label={sellPageTitle(isEdit)}
            className="w-full max-w-none gap-[var(--cds-space-section-gap)] pb-[var(--sell-sticky-clearance,96px)]"
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

            <SellFormErrorHost />

            <SellPublishBar ref={publishBarRef} />
          </AccountPageStack>

          <SellPublishingOverlayHost isEdit={isEdit} />

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

          <CanonicalModal
            open={unsavedOpen}
            variant="confirm"
            title="Unsaved Changes"
            cancelLabel="Stay"
            confirmLabel="Leave"
            onClose={() => {
              setUnsavedOpen(false);
              leaveActionRef.current = null;
            }}
            onConfirm={() => {
              const leave = leaveActionRef.current;
              setUnsavedOpen(false);
              leaveActionRef.current = null;
              leave?.();
            }}
          >
            <p className="text-sm text-text-secondary">
              You have unsaved changes. Leave without saving?
            </p>
          </CanonicalModal>
        </div>
      </div>
    </AccountCanonicalShell>
  );
}

/** Canonical Sell Page — CREATE + EDIT modes share this one form. */
export function SellPage({
  editListingId,
  editListingSlug,
  editListingStatus,
  initialDraft,
}: SellPageProps) {
  return (
    <SellProvider
      editListingId={editListingId}
      editListingSlug={editListingSlug}
      editListingStatus={editListingStatus}
      initialDraft={initialDraft}
    >
      <SellPageInner />
    </SellProvider>
  );
}
