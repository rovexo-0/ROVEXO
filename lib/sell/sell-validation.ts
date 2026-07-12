import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";
import {
  getQuickSellAttributeDefs,
  isAttributeCompleted,
} from "@/lib/sell/attribute-engine";
import { validateListingTitle } from "@/lib/sell/listing-title";
import { isSellQuickCondition } from "@/lib/sell/sell-condition-options";
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

function needsParcelSize(draft: SellListingDraft): boolean {
  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;
  return !directContact && draft.shippingMethod !== "collection_only";
}

function applicableAttributeIds(categoryPath: FlatCategoryPath | null): string[] {
  return getQuickSellAttributeDefs(categoryPath).map((def) => def.id);
}

/** §41 — first failing field in canonical order; stops at first error. */
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

  if (!draft.categoryPath) {
    return {
      field: "category",
      message: "Select a category.",
      fieldDomId: sellFieldDomId("category"),
    };
  }

  const attributeIds = applicableAttributeIds(draft.categoryPath);
  const attributeDefs = getQuickSellAttributeDefs(draft.categoryPath);

  for (const def of attributeDefs) {
    if (!isAttributeCompleted(draft, def)) {
      const field = def.id as "brand" | "colour" | "size";
      if (!attributeIds.includes(def.id)) continue;
      return {
        field,
        message: `Select ${def.label.toLowerCase()}.`,
        fieldDomId: sellFieldDomId(`attribute:${def.id}`),
      };
    }
  }

  if (!draft.condition.trim() || !isSellQuickCondition(draft.condition)) {
    return {
      field: "condition",
      message: "Select condition.",
      fieldDomId: sellFieldDomId("condition"),
    };
  }

  if (needsParcelSize(draft) && !draft.parcelSize) {
    return {
      field: "parcelSize",
      message: "Select a parcel size.",
      fieldDomId: sellFieldDomId("parcel"),
    };
  }

  if (!hasValidPrice(draft)) {
    return {
      field: "price",
      message: "Enter a price greater than zero.",
      fieldDomId: sellFieldDomId("price"),
    };
  }

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
