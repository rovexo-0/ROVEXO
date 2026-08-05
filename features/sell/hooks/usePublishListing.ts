"use client";

import {
  PUBLISH_FAILURE_MESSAGE,
  type PublishPhase,
} from "@/lib/sell/publish-engine";
import {
  useSellActions,
  useSellDraft,
  useSellPublishOutcome,
  useSellPublishProgress,
} from "@/features/sell/context/SellProvider";

export function usePublishListing() {
  const { editListingId } = useSellDraft();
  const { publishListing, resetForAnotherListing } = useSellActions();
  const { isPublishing, publishPhase, uploadProgress } = useSellPublishProgress();
  const { publishSuccess, formError } = useSellPublishOutcome();

  return {
    publishListing,
    isPublishing,
    publishPhase,
    uploadProgress,
    publishSuccess,
    publishError: formError,
    publishFailureMessage: PUBLISH_FAILURE_MESSAGE,
    resetForAnotherListing,
    isEdit: Boolean(editListingId),
  };
}

export type { PublishPhase };
