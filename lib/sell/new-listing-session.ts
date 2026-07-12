import { clearSellDraft } from "@/lib/sell/draft-storage";
import { clearDraftPhotos } from "@/lib/sell/draft-photo-storage";
import { createEmptyDraft, type SellListingDraft } from "@/features/sell/types";
import { createEmptyUserModified } from "@/lib/sell/suggestion-field-lock";
import type { DescriptionEditState } from "@/lib/sell/smart-description-engine";
import type { PhotoMetadataEntry } from "@/lib/sell/photo-metadata";

/** PATCH 4 — wipe every sell-session artifact for a brand-new listing. */
export function revokeDraftPhotoUrls(draft: SellListingDraft): void {
  for (const photo of draft.photos) {
    if (photo.file && photo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photo.previewUrl);
    }
  }
}

export type NewListingSessionReset = {
  draft: SellListingDraft;
  uploadSessionId: string;
  descriptionEdit: DescriptionEditState;
  photoMetadata: PhotoMetadataEntry[];
};

export async function createNewListingSession(
  currentDraft: SellListingDraft,
  nextUploadSessionId: string,
): Promise<NewListingSessionReset> {
  revokeDraftPhotoUrls(currentDraft);
  clearSellDraft();
  await clearDraftPhotos();

  if (typeof window !== "undefined") {
    window.scrollTo(0, 0);
  }

  return {
    draft: { ...createEmptyDraft(), userModified: createEmptyUserModified() },
    uploadSessionId: nextUploadSessionId,
    descriptionEdit: { lastAuto: "", userEdited: false },
    photoMetadata: [],
  };
}
