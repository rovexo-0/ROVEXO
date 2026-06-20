"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type SettingToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function SettingToggle({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: SettingToggleProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-ds-7 cursor-pointer items-center justify-between gap-ds-3 px-ds-4 py-ds-3",
        disabled && "opacity-50",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-text-secondary">{description}</span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className={cn("h-5 w-5 rounded border-border text-primary", focusRing)}
      />
    </label>
  );
}
