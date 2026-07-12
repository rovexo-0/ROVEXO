import type { SellListingDraft } from "@/features/sell/types";
import type { DeterministicPrefillPatch } from "@/lib/sell/deterministic-prefill";
import { applyDeterministicPrefill } from "@/lib/sell/deterministic-prefill";

/** Canonical suggestion field ids — userModified locks apply per session. */
export type SuggestionFieldId =
  | "category"
  | "brand"
  | "colour"
  | "material"
  | "size"
  | "condition"
  | "pattern"
  | "style"
  | "model"
  | "collection"
  | "generation"
  | "series"
  | `attribute:${string}`;

export type UserModifiedFields = Partial<Record<SuggestionFieldId, boolean>>;

export function createEmptyUserModified(): UserModifiedFields {
  return {};
}

export function isFieldUserModified(
  userModified: UserModifiedFields | undefined,
  field: SuggestionFieldId,
): boolean {
  return Boolean(userModified?.[field]);
}

export function markFieldsUserModified(
  userModified: UserModifiedFields | undefined,
  fields: SuggestionFieldId[],
): UserModifiedFields {
  const next = { ...userModified };
  for (const field of fields) {
    next[field] = true;
  }
  return next;
}

/** Map attribute-engine def id to suggestion lock id. */
export function suggestionFieldFromAttributeId(attributeId: string): SuggestionFieldId {
  if (attributeId === "colour") return "colour";
  if (
    attributeId === "brand" ||
    attributeId === "material" ||
    attributeId === "size" ||
    attributeId === "pattern" ||
    attributeId === "style" ||
    attributeId === "model" ||
    attributeId === "collection" ||
    attributeId === "generation" ||
    attributeId === "series"
  ) {
    return attributeId;
  }
  return `attribute:${attributeId}`;
}

export function applyPrefillRespectingLocks(
  draft: SellListingDraft,
  patch: DeterministicPrefillPatch,
): Partial<SellListingDraft> {
  const merged = applyDeterministicPrefill(draft, patch);
  const locks = draft.userModified ?? {};

  if (locks.brand) delete merged.brand;
  if (locks.colour) delete merged.color;
  if (locks.material) delete merged.material;
  if (locks.size) delete merged.size;
  if (locks.condition) delete merged.condition;

  if (merged.attributes && locks) {
    const attributes = { ...merged.attributes };
    let changed = false;
    for (const key of Object.keys(attributes)) {
      const field = suggestionFieldFromAttributeId(key);
      if (locks[field] || locks[`attribute:${key}` as SuggestionFieldId]) {
        delete attributes[key];
        changed = true;
      }
    }
    if (changed) {
      if (Object.keys(attributes).length === 0) {
        delete merged.attributes;
      } else {
        merged.attributes = attributes;
      }
    }
  }

  return merged;
}

export function shouldApplyPhotoColourSuggestion(draft: SellListingDraft): boolean {
  return !isFieldUserModified(draft.userModified, "colour") && !draft.color.trim();
}

/** Restore locks for drafts saved before userModified existed. */
export function inferUserModifiedFromDraft(draft: Partial<SellListingDraft>): UserModifiedFields {
  const locks: UserModifiedFields = { ...createEmptyUserModified(), ...draft.userModified };
  if (draft.categoryPath) locks.category = true;
  if (draft.brand?.trim()) locks.brand = true;
  if (draft.color?.trim()) locks.colour = true;
  if (draft.material?.trim()) locks.material = true;
  if (draft.size?.trim()) locks.size = true;
  if (draft.condition?.trim()) locks.condition = true;
  return locks;
}
