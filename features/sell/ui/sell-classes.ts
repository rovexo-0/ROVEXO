/**
 * ROVEXO Sell v3 — shared presentational class tokens.
 *
 * Brand-new Sell experience. Pure ROVEXO design-system utilities (spacing,
 * radius, colour and focus tokens) — no dependency on any legacy Sell UI.
 */
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

/** Card container for a titled Sell section. */
export const sellCard =
  "rx-form-section flex flex-col gap-ds-3 rounded-[var(--cds-radius-lg)] border border-border bg-white p-ds-4";

/** Standard text input / textarea inside the Sell flow. */
export const sellInput =
  "rx-input min-h-ds-7 w-full rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm text-text-primary outline-none placeholder:text-text-muted";

/** Inner layout for full-screen sell pickers inside ModalContainer. */
export const sellPanel = "flex min-h-0 flex-1 flex-col bg-surface";

export function sellInvalid(hasError: boolean): string {
  return cn(hasError && "border-danger/60 ring-1 ring-danger/40");
}

export { focusRing };
