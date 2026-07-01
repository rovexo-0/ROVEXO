import type { SellListingDraft } from "@/features/sell/types";

type PendingText = {
  title?: string;
  description?: string;
};

/** Merge in-progress keystrokes for publish / validation. */
export function resolveEffectiveSellDraft(
  draft: SellListingDraft,
  pending: PendingText = {},
): SellListingDraft {
  const title = pending.title ?? draft.title;
  const description = pending.description ?? draft.description;
  if (title === draft.title && description === draft.description) return draft;
  return { ...draft, title, description };
}
