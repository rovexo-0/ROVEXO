"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { getPendingTextSnapshot, subscribePendingText } from "@/lib/sell/pending-text-store";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { isListingValid } from "@/features/sell/types";
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
  const publishDraft = effective.condition ? effective : { ...effective, condition: "Used" };
  return isListingValid(publishDraft, { mode: "quick", showErrors: true });
}

export function StickyPublishButton() {
  const { draft, pendingTitleRef, pendingDescriptionRef, isPublishing, publishListing, editListingId } =
    useSell();

  const canPublish = useSyncExternalStore(
    subscribePendingText,
    () => readCanPublish(draft, pendingTitleRef, pendingDescriptionRef),
    () => readCanPublish(draft, pendingTitleRef, pendingDescriptionRef),
  );

  const actionLabel = editListingId ? "Save Changes" : "Publish";
  const loadingLabel = editListingId ? "Saving…" : "Publishing…";

  return (
    <div className="rx-footer-bar fixed inset-x-0 bottom-0 z-[110]">
      <div className="mx-auto max-w-2xl px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
          disabled={!canPublish || isPublishing}
          onClick={() => void publishListing()}
        >
          {isPublishing ? loadingLabel : actionLabel}
        </Button>
      </div>
    </div>
  );
}
