"use client";

import { forwardRef, useSyncExternalStore } from "react";
import { CanonicalButton } from "@/src/components/canonical";
import { publishPhaseLabel } from "@/lib/sell/publish-engine";
import { getPendingTextSnapshot, subscribePendingText } from "@/lib/sell/pending-text-store";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { isSellListingPublishable } from "@/lib/sell/sell-validation";
import { useSell } from "@/features/sell/context/SellProvider";

function readCanPublish(
  draft: ReturnType<typeof useSell>["draft"],
  pendingTitleRef: ReturnType<typeof useSell>["pendingTitleRef"],
  pendingDescriptionRef: ReturnType<typeof useSell>["pendingDescriptionRef"],
): boolean {
  void getPendingTextSnapshot();
  const effective = resolveEffectiveSellDraft(draft, {
    title: pendingTitleRef.current,
    description: pendingDescriptionRef.current,
  });

  return isSellListingPublishable(effective, {
    title: pendingTitleRef.current,
    description: pendingDescriptionRef.current,
  });
}

export const SellPublishBar = forwardRef<HTMLDivElement>(function SellPublishBar(_props, ref) {
  const {
    draft,
    pendingTitleRef,
    pendingDescriptionRef,
    isPublishing,
    publishPhase,
    uploadProgress,
    publishListing,
    editListingId,
  } = useSell();

  const canPublish = useSyncExternalStore(
    subscribePendingText,
    () => readCanPublish(draft, pendingTitleRef, pendingDescriptionRef),
    () => readCanPublish(draft, pendingTitleRef, pendingDescriptionRef),
  );

  const label = publishPhaseLabel(publishPhase, {
    uploadProgress,
    isEdit: Boolean(editListingId),
  });

  return (
    <div
      ref={ref}
      className="sell-publish-bar fixed inset-x-0 z-[110] border-t border-border bg-white"
      data-sell-publish-bar
      role="region"
      aria-label="Publish listing"
    >
      <div className="mx-auto max-w-2xl px-[var(--cds-space-page-x)] py-ds-3">
        <CanonicalButton
          fullWidth
          loading={isPublishing}
          disabled={!canPublish || isPublishing}
          onClick={() => void publishListing()}
        >
          {label}
        </CanonicalButton>
      </div>
    </div>
  );
});
