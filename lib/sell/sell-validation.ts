import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";
import { validateManualCategoryPath } from "@/lib/sell/category-engine-v1";
import { validateListingTitle } from "@/lib/sell/listing-title";
import { sellFieldDomId } from "@/lib/sell/sell-progressive-flow";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";

export type SellValidationFieldId =
  | "photos"
  | "title"
  | "description"
  | "category"
  | "brand"
  | "colour"
  | "size"
  | "condition"
  | "parcelSize"
  | "price";

export type SellValidationIssue = {
  field: SellValidationFieldId;
  message: string;
  fieldDomId: string;
};

const DESCRIPTION_MIN = 10;

function hasValidPhotos(draft: SellListingDraft): boolean {
  return (
    draft.photos.length > 0 &&
    draft.photos.every((photo) => photo.uploaded || photo.file) &&
    !draft.photos.some((photo) => photo.uploading)
  );
}

function hasValidPrice(draft: SellListingDraft): boolean {
  return Number(draft.price) > 0;
}

function hasValidDescription(description: string): boolean {
  return description.trim().length >= DESCRIPTION_MIN;
}

function hasValidBrand(draft: SellListingDraft): boolean {
  return draft.brand.trim().length > 0;
}

function needsParcelSize(draft: SellListingDraft): boolean {
  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;
  return !directContact && draft.shippingMethod !== "collection_only";
}

/**
 * Publish Listing enabled when Owner core fields are complete.
 * Temperature Rating · Season Rating · Length are OPTIONAL — never block Publish.
 */
export function getFirstSellValidationIssue(
  draft: SellListingDraft,
  input: { title: string; description: string },
): SellValidationIssue | null {
  if (!hasValidPhotos(draft)) {
    return {
      field: "photos",
      message: draft.photos.some((photo) => photo.uploading)
        ? "Wait for photos to finish uploading."
        : "Add at least one photo.",
      fieldDomId: sellFieldDomId("photos"),
    };
  }

  const titleError = validateListingTitle(input.title, { required: true });
  if (titleError) {
    return { field: "title", message: titleError, fieldDomId: sellFieldDomId("title") };
  }

  if (!hasValidDescription(input.description)) {
    return {
      field: "description",
      message: "Add a description (at least 10 characters).",
      fieldDomId: sellFieldDomId("description"),
    };
  }

  const categoryGate = validateManualCategoryPath(draft.categoryPath);
  if (!categoryGate.ok) {
    return {
      field: "category",
      message: categoryGate.message,
      fieldDomId: sellFieldDomId("category"),
    };
  }

  if (!hasValidBrand(draft)) {
    return {
      field: "brand",
      message: "Select a brand (or No Brand).",
      fieldDomId: sellFieldDomId("attribute:brand"),
    };
  }

  // Condition is OPTIONAL for publish (Sell Absolute Authority core-6).
  // Progressive UI may still prompt for it; it must never block Publish.

  if (!hasValidPrice(draft)) {
    return {
      field: "price",
      message: "Enter a price greater than zero.",
      fieldDomId: sellFieldDomId("price"),
    };
  }

  if (needsParcelSize(draft) && !draft.parcelSize) {
    return {
      field: "parcelSize",
      message: "Select a parcel size.",
      fieldDomId: sellFieldDomId("parcel"),
    };
  }

  // Explicit: Temperature Rating / Season Rating / Length never appear here.
  return null;
}

export function isSellListingPublishable(
  draft: SellListingDraft,
  input: { title: string; description: string },
): boolean {
  return getFirstSellValidationIssue(draft, input) === null;
}

export function getSellValidationErrorForField(
  draft: SellListingDraft,
  input: { title: string; description: string },
  field: SellValidationFieldId,
): string | undefined {
  const issue = getFirstSellValidationIssue(draft, input);
  if (!issue || issue.field !== field) return undefined;
  return issue.message;
}

/** @deprecated Prefer getQuickSellAttributeDefs — kept for callers expecting id lists. */
export function applicableAttributeIds(categoryPath: FlatCategoryPath | null): string[] {
  void categoryPath;
  return [];
}
