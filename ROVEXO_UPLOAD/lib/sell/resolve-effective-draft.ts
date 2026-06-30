import type { SellListingDraft } from "@/features/sell/types";

/** Merge in-progress title text for validation and publish. */
export function resolveEffectiveSellDraft(
  draft: SellListingDraft,
  pendingTitle: string,
): SellListingDraft {
  return { ...draft, title: pendingTitle.trim() };
}
