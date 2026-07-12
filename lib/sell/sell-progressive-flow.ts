import type { FlatCategoryPath } from "@/lib/categories/types";

import {

  getQuickSellAttributeDefs,

  isAttributeCompleted,

  type AttributeDef,

} from "@/lib/sell/attribute-engine";

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



export function isDescriptionStepComplete(_description: string): boolean {
  // Description is optional (Smart Description Engine §STEP 10).
  return true;
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
    { id: "category", fieldId: sellFieldDomId("category") },
    { id: "description", fieldId: sellFieldDomId("description") },
  ];



  if (draft.categoryPath) {

    for (const def of getQuickSellAttributeDefs(draft.categoryPath)) {

      steps.push({

        id: `attribute:${def.id}`,

        fieldId: sellFieldDomId(`attribute:${def.id}`),

      });

    }

    steps.push({ id: "condition", fieldId: sellFieldDomId("condition") });

    steps.push({ id: "parcel", fieldId: sellFieldDomId("parcel") });

    steps.push({ id: "price", fieldId: sellFieldDomId("price") });

  }



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

  if (step.id === "photos" || step.id === "title") {
    return true;
  }

  if (step.id === "category") {
    return isTitleStepComplete(input.title);
  }

  if (step.id === "description") {
    return isCategoryStepComplete(draft.categoryPath);
  }



  if (!draft.categoryPath) return false;



  const postCategorySteps = steps.filter(

    (item) =>

      item.id !== "photos" &&

      item.id !== "title" &&

      item.id !== "description" &&

      item.id !== "category",

  );

  const stepIndex = postCategorySteps.findIndex((item) => item.id === step.id);

  if (stepIndex < 0) return false;



  for (let index = 0; index < stepIndex; index += 1) {

    const prior = postCategorySteps[index];

    if (!prior) continue;

    if (!isSellProgressiveStepComplete(prior, draft, input)) {

      return false;

    }

  }



  return true;

}



export function getVisibleAttributeDefs(

  draft: SellListingDraft,

  input: { title: string; description: string },

): AttributeDef[] {

  if (!draft.categoryPath) return [];



  const defs = getQuickSellAttributeDefs(draft.categoryPath);

  const steps = buildSellProgressiveSteps(draft);

  const visible: AttributeDef[] = [];



  for (const def of defs) {

    const stepId = `attribute:${def.id}` as SellProgressiveStepId;

    const step = steps.find((item) => item.id === stepId);

    if (!step) continue;

    if (!isSellProgressiveStepVisible(step, steps, draft, input)) break;

    visible.push(def);

    if (!isAttributeCompleted(draft, def)) break;

  }



  return visible;

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


