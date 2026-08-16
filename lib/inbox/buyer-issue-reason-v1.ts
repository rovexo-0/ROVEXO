/**
 * Buyer delivered-issue reasons — presentation contract.
 * Reuses existing Protection Engine case type ids. Not a second dispute system.
 */

import type { ProtectionEngineCaseTypeId } from "@/lib/protection-engine/types";
import type { Order } from "@/lib/orders/types";

export const BUYER_ISSUE_REASON_V1 = {
  version: "1.0",
  submitLabel: "Submit Issue",
  selectorTitle: "Why are you reporting an issue?",
  explanationLabel: "Add a short explanation",
  descriptionLabel: "Describe the issue",
  photosOptionalLabel: "Photos are optional",
  photosLabel: "Add photos",
  photosMultipleLabel: "Add photos (you can add more than one)",
  photosRequiredLabel: "Add photos — required for damage reports",
  photosRequiredHint: "Please add at least one photo showing the damage.",
} as const;

export type BuyerIssueReasonId = Extract<
  ProtectionEngineCaseTypeId,
  "item-not-received" | "item-damaged" | "not-as-described" | "wrong-item" | "other"
>;

export type BuyerIssueReasonOption = {
  id: BuyerIssueReasonId;
  label: string;
  explanation: "short" | "description";
  photos: "optional" | "upload";
  multiplePhotos: boolean;
  damagePhotosRequired: boolean;
  descriptionRequired: boolean;
  photoRequired: boolean;
  minimumPhotos: number;
};

export const BUYER_ISSUE_REASON_OPTIONS: readonly BuyerIssueReasonOption[] = [
  {
    id: "item-not-received",
    label: "Item not received",
    explanation: "short",
    photos: "optional",
    multiplePhotos: true,
    damagePhotosRequired: false,
    descriptionRequired: false,
    photoRequired: false,
    minimumPhotos: 0,
  },
  {
    id: "item-damaged",
    label: "Item is damaged",
    explanation: "description",
    photos: "upload",
    multiplePhotos: true,
    damagePhotosRequired: true,
    descriptionRequired: true,
    photoRequired: true,
    minimumPhotos: 1,
  },
  {
    id: "not-as-described",
    label: "Item not as described",
    explanation: "description",
    photos: "optional",
    multiplePhotos: true,
    damagePhotosRequired: false,
    descriptionRequired: false,
    photoRequired: false,
    minimumPhotos: 0,
  },
  {
    id: "wrong-item",
    label: "Wrong item received",
    explanation: "description",
    photos: "optional",
    multiplePhotos: true,
    damagePhotosRequired: false,
    descriptionRequired: false,
    photoRequired: false,
    minimumPhotos: 0,
  },
  {
    id: "other",
    label: "Something else",
    explanation: "description",
    photos: "optional",
    multiplePhotos: true,
    damagePhotosRequired: false,
    descriptionRequired: false,
    photoRequired: false,
    minimumPhotos: 0,
  },
] as const;

export function getBuyerIssueReasonOption(
  id: BuyerIssueReasonId | null | undefined,
): BuyerIssueReasonOption | null {
  if (!id) return null;
  return BUYER_ISSUE_REASON_OPTIONS.find((option) => option.id === id) ?? null;
}

export function isBuyerIssueReasonId(value: string): value is BuyerIssueReasonId {
  return BUYER_ISSUE_REASON_OPTIONS.some((option) => option.id === value);
}

export function isBuyerIssueReasonFlowAvailable(
  orderStatus: Order["status"] | null | undefined,
): boolean {
  return orderStatus === "delivered";
}

export function isDeliveredOnlyIssueReason(id: BuyerIssueReasonId): true {
  void id;
  return true;
}

export type BuyerIssueValidationInput = {
  reasonId: BuyerIssueReasonId | null | undefined;
  description: string;
  photoCount: number;
};

export type BuyerIssueValidationResult =
  | { ok: true }
  | { ok: false; code: "REASON_REQUIRED" | "DESCRIPTION_REQUIRED" | "PHOTO_REQUIRED" };

export function validateBuyerIssueSubmission(
  input: BuyerIssueValidationInput,
): BuyerIssueValidationResult {
  const option = getBuyerIssueReasonOption(input.reasonId);
  if (!option) return { ok: false, code: "REASON_REQUIRED" };
  const description = input.description.trim();
  if (option.descriptionRequired && !description) {
    return { ok: false, code: "DESCRIPTION_REQUIRED" };
  }
  if (option.photoRequired && input.photoCount < option.minimumPhotos) {
    return { ok: false, code: "PHOTO_REQUIRED" };
  }
  return { ok: true };
}

export function canSubmitBuyerIssue(input: BuyerIssueValidationInput): boolean {
  return validateBuyerIssueSubmission(input).ok;
}

export function buyerIssueReasonBlockedPreDelivery(id: string): boolean {
  return (
    id === "item-damaged" ||
    id === "not-as-described" ||
    id === "wrong-item" ||
    id === "damaged" ||
    id === "not_as_described" ||
    id === "wrong_item"
  );
}
