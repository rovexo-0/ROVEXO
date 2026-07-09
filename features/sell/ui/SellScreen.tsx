"use client";

import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { cn } from "@/lib/cn";
import { focusRing } from "@/features/sell/ui/sell-classes";
import type { SellListingDraft } from "@/features/sell/types";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";
import { SellPhotoRail } from "@/features/sell/ui/SellPhotoRail";
import { SellTitleBlock } from "@/features/sell/ui/SellTitleBlock";
import { SellCategoryBlock } from "@/features/sell/ui/SellCategoryBlock";
import { SellConditionBlock } from "@/features/sell/ui/SellConditionBlock";
import { SellAttributesBlock } from "@/features/sell/ui/SellAttributesBlock";
import { SellPricingBlock } from "@/features/sell/ui/SellPricingBlock";
import { SellShippingBlock } from "@/features/sell/ui/SellShippingBlock";
import { SellOptionsBlock } from "@/features/sell/ui/SellOptionsBlock";
import { SellPublishBar } from "@/features/sell/ui/SellPublishBar";
import { SellSuccessScreen } from "@/features/sell/ui/SellSuccessScreen";

type SellScreenProps = {
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SellTopBar({ title }: { title: string }) {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-ds-2 border-b border-border bg-surface/90 px-ds-3 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))] backdrop-blur">
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-ds-full text-text-primary hover:bg-surface-muted", focusRing)}
      >
        <CloseIcon />
      </button>
      <h1 className="flex-1 truncate text-center text-base font-semibold text-text-primary">{title}</h1>
      <span className="h-10 w-10 shrink-0" aria-hidden />
    </header>
  );
}

function SellScreenInner() {
  const { view, formError } = useSell();

  if (view === "published") {
    return <SellSuccessScreen />;
  }

  return (
    <>
      <SellTopBar title="Sell an item" />
      {/* Horizontal padding respects device safe-area insets (notches / landscape). */}
      <ScrollContainer withBottomNav={false} className="mx-auto flex max-w-2xl flex-col gap-ds-4 py-ds-4 px-[max(env(safe-area-inset-left),var(--ds-space-4))]">
        <SellPhotoRail />
        <SellTitleBlock />
        <SellCategoryBlock />
        <SellConditionBlock />
        <SellAttributesBlock />
        <SellPricingBlock />
        <SellShippingBlock />
        <SellOptionsBlock />

        {formError ? (
          <p className="rounded-ds-md border border-destructive/30 bg-destructive/10 px-ds-3 py-ds-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <SellPublishBar />
      </ScrollContainer>
    </>
  );
}

export function SellScreen({ editListingId, initialDraft }: SellScreenProps) {
  return (
    <BetaAppShell showBottomNav={false} className="sell-page-v1">
      <SellProvider editListingId={editListingId} initialDraft={initialDraft}>
        <SellScreenInner />
      </SellProvider>
    </BetaAppShell>
  );
}
