import type { FlatCategoryPath } from "@/lib/categories/types";

import { getQuickSellAttributeDefs, isAttributeCompleted, type AttributeDef } from "@/lib/sell/attribute-engine";
import { categorySupportsCondition } from "@/lib/sell/aa-quick-sell-attributes";
import { isSellQuickCondition } from "@/lib/sell/sell-condition-options";

import { validateListingTitle } from "@/lib/sell/listing-title";

import type { SellListingDraft } from "@/features/sell/types";

import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";

import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";



export type SellProgressiveStepId =

  | "photos"

  | "title"

  | "description"

  | "category"

  | `attribute:${string}`

  | "condition"

  | "parcel"

  | "price";



export type SellProgressiveStep = {

  id: SellProgressiveStepId;

  fieldId: string;

};



export function sellFieldDomId(stepId: SellProgressiveStepId): string {

  if (stepId.startsWith("attribute:")) {

    return `sell-field-${stepId.slice("attribute:".length)}`;

  }

  return `sell-field-${stepId}`;

}



export function buildCategoryDetectionText(

  draft: SellListingDraft,

  title: string,

  description: string,

): { title: string; description: string } {

  const photoText = draft.photos

    .map((photo) => {

      const parts = [photo.file?.name, photo.file?.type].filter(Boolean);

      return parts.join(" ");

    })

    .filter(Boolean)

    .join(" ");



  return {

    title,

    description: [description, photoText].filter(Boolean).join(" ").trim(),

  };

}



export function isTitleStepComplete(title: string): boolean {

  return !validateListingTitle(title, { required: true });

}



export function isDescriptionStepComplete(description: string): boolean {
  // Absolute Authority: Description required for publish (min 10).
  return description.trim().length >= 10;
}



export function isCategoryStepComplete(categoryPath: FlatCategoryPath | null): boolean {

  return Boolean(categoryPath);

}



export function isConditionStepComplete(draft: SellListingDraft): boolean {

  return isSellQuickCondition(draft.condition);

}



export function isParcelStepComplete(draft: SellListingDraft): boolean {

  const directContact = draft.categoryPath

    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))

    : false;

  if (directContact) return true;

  return Boolean(draft.parcelSize);

}



export function isPriceStepComplete(draft: SellListingDraft): boolean {

  return Number(draft.price) > 0;

}



export function buildSellProgressiveSteps(draft: SellListingDraft): SellProgressiveStep[] {
  const steps: SellProgressiveStep[] = [
    { id: "photos", fieldId: sellFieldDomId("photos") },
    { id: "title", fieldId: sellFieldDomId("title") },
    { id: "description", fieldId: sellFieldDomId("description") },
    { id: "category", fieldId: sellFieldDomId("category") },
  ];

  if (draft.categoryPath) {
    const attrs = getQuickSellAttributeDefs(draft.categoryPath);
    for (const def of attrs) {
      if (def.id === "condition") {
        steps.push({ id: "condition", fieldId: sellFieldDomId("condition") });
      } else {
        steps.push({
          id: `attribute:${def.id}`,
          fieldId: sellFieldDomId(`attribute:${def.id}`),
        });
      }
    }
  }

  // Always present in initial view (Absolute Authority).
  steps.push({ id: "price", fieldId: sellFieldDomId("price") });
  steps.push({ id: "parcel", fieldId: sellFieldDomId("parcel") });

  return steps;
}



export function isSellProgressiveStepComplete(

  step: SellProgressiveStep,

  draft: SellListingDraft,

  input: { title: string; description: string },

): boolean {

  switch (step.id) {

    case "photos":

      return draft.photos.length > 0;

    case "title":

      return isTitleStepComplete(input.title);

    case "description":

      return isDescriptionStepComplete(input.description);

    case "category":

      return isCategoryStepComplete(draft.categoryPath);

    case "condition":

      return isConditionStepComplete(draft);

    case "parcel":

      return isParcelStepComplete(draft);

    case "price":

      return isPriceStepComplete(draft);

    default: {

      if (!step.id.startsWith("attribute:")) return false;

      const attributeId = step.id.slice("attribute:".length);

      const def = getQuickSellAttributeDefs(draft.categoryPath).find((item) => item.id === attributeId);

      return def ? isAttributeCompleted(draft, def) : false;

    }

  }

}



export function getFirstIncompleteSellStep(

  steps: SellProgressiveStep[],

  draft: SellListingDraft,

  input: { title: string; description: string },

): SellProgressiveStep | null {

  for (const step of steps) {

    if (!isSellProgressiveStepComplete(step, draft, input)) {

      return step;

    }

  }

  return null;

}



export function isSellProgressiveStepVisible(
  step: SellProgressiveStep,
  steps: SellProgressiveStep[],
  draft: SellListingDraft,
  input: { title: string; description: string },
): boolean {
  // Absolute Authority initial view — always visible core fields.
  if (
    step.id === "photos" ||
    step.id === "title" ||
    step.id === "description" ||
    step.id === "category" ||
    step.id === "price" ||
    step.id === "parcel"
  ) {
    return true;
  }

  // Dynamic attributes + Condition only after category selection (taxonomy-driven).
  if (!draft.categoryPath) return false;

  if (step.id === "condition") {
    return categorySupportsCondition(draft.categoryPath);
  }

  if (step.id.startsWith("attribute:")) {
    return true;
  }

  void steps;
  void input;
  return false;
}

export function getVisibleAttributeDefs(
  draft: SellListingDraft,
  input: { title: string; description: string },
): AttributeDef[] {
  void input;
  if (!draft.categoryPath) return [];
  // Show all category attributes after selection (no unused fields; no one-by-one drip).
  return getQuickSellAttributeDefs(draft.categoryPath);
}



export function areRequiredAttributesComplete(draft: SellListingDraft): boolean {

  if (!draft.categoryPath) return false;

  return getQuickSellAttributeDefs(draft.categoryPath).every((def) => isAttributeCompleted(draft, def));

}



export function scrollToSellField(fieldId: string): void {

  if (typeof document === "undefined") return;

  window.requestAnimationFrame(() => {

    document.getElementById(fieldId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  });

}


