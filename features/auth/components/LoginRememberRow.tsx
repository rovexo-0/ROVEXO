"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function LoginRememberRow() {
  return (
    <label
      className={cn(
        "rx-glass rx-depth-1 flex min-h-ds-7 cursor-pointer items-center gap-ds-3 rounded-ds-lg px-ds-4 py-ds-3",
        focusRing,
      )}
    >
      <input
        type="checkbox"
        name="remember"
        defaultChecked
        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <span className="text-sm font-medium text-text-primary">Remember me on this device</span>
    </label>
  );
}
