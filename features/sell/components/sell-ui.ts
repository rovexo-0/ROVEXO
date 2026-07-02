import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export const sellFieldClassName =
  "rx-input min-h-ds-7 w-full rounded-ds-sm px-ds-3 py-ds-2 text-sm placeholder:text-text-muted";

export const sellFormCardClassName = "rx-form-section flex flex-col gap-ds-3 p-ds-4";

export function sellDeliveryCardClassName(selected: boolean) {
  return cn(
    "min-h-ds-7 rounded-ds-md border px-ds-3 py-ds-3 text-left transition-colors touch-manipulation",
    selected ? "border-primary bg-primary/5" : "border-border bg-surface",
    focusRing,
  );
}

export function sellConditionChipClassName() {
  return cn("sell-condition-chip touch-manipulation", focusRing);
}
