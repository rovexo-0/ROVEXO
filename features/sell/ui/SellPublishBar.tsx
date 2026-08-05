"use client";

import { forwardRef, useSyncExternalStore } from "react";
import { CanonicalButton } from "@/src/components/canonical";
import { publishPhaseLabel } from "@/lib/sell/publish-engine";
import { getPendingTextSnapshot, subscribePendingText } from "@/lib/sell/pending-text-store";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { isSellListingPublishable } from "@/lib/sell/sell-validation";
import {
  useSellActions,
  useSellDraft,
  useSellPublishProgress,
} from "@/features/sell/context/SellProvider";

function readCanPublish(
  draft: ReturnType<typeof useSellDraft>["draft"],
  pendingTitleRef: ReturnType<typeof useSellActions>["pendingTitleRef"],
  pendingDescriptionRef: ReturnType<typeof useSellActions>["pendingDescriptionRef"],
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

/** Sticky publish CTA — Settings sticky action + CanonicalButton only. */
export const SellPublishBar = forwardRef<HTMLDivElement>(function SellPublishBar(_props, ref) {
  const { draft, editListingId } = useSellDraft();
  const { pendingTitleRef, pendingDescriptionRef, publishListing } = useSellActions();
  const { isPublishing, publishPhase, uploadProgress } = useSellPublishProgress();

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
      className="account-settings-sticky-action w-full max-w-none"
      data-sell-publish-bar
      role="region"
      aria-label="Publish listing"
    >
      <CanonicalButton
        fullWidth
        loading={isPublishing}
        disabled={!canPublish || isPublishing}
        onClick={() => void publishListing()}
      >
        {label}
      </CanonicalButton>
    </div>
  );
});
