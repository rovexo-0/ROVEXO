"use client";

import type { AppearanceMode } from "@/lib/settings/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const OPTIONS: { id: AppearanceMode; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "Always use light theme" },
  { id: "dark", label: "Dark", description: "Always use dark theme" },
  { id: "system", label: "System", description: "Match your device setting" },
];

type AppearancePickerProps = {
  value: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
};

export function AppearancePicker({ value, onChange }: AppearancePickerProps) {
  return (
    <fieldset className="flex flex-col gap-ds-2">
      <legend className="text-sm font-medium text-text-primary">Appearance</legend>
      <div className="grid gap-ds-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            className={cn(
              "rounded-ds-lg border px-ds-3 py-ds-3 text-left",
              value === option.id
                ? "border-primary bg-primary/10"
                : "border-border bg-surface",
              focusRing,
            )}
          >
            <p className="text-sm font-semibold text-text-primary">{option.label}</p>
            <p className="mt-1 text-xs text-text-secondary">{option.description}</p>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
