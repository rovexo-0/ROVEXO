"use client";

import {
  PUBLISH_FAILURE_MESSAGE,
  type PublishPhase,
} from "@/lib/sell/publish-engine";
import { useSell } from "@/features/sell/context/SellProvider";

export function usePublishListing() {
  const {
    publishListing,
    isPublishing,
    publishPhase,
    uploadProgress,
    publishSuccess,
    formError,
    resetForAnotherListing,
    editListingId,
  } = useSell();

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
