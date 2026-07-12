"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type CanonicalSwitchProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

/**
 * Canonical switch row — matches settings toggle rows inside list cards.
 */
export function CanonicalSwitch({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
  className,
}: CanonicalSwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn("cds-toggle-row", disabled && "cds-toggle-row--disabled", className)}
    >
      <span className="cds-toggle-row__copy">
        <span className="cds-toggle-row__title">{label}</span>
        {description ? <span className="cds-toggle-row__description">{description}</span> : null}
      </span>
      <span className="cds-switch">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className={cn("cds-switch__input", focusRing)}
        />
        <span className="cds-switch__track" aria-hidden />
      </span>
    </label>
  );
}
