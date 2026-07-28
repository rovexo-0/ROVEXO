"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  resolveCanonicalSwitchChecked,
  resolveCanonicalSwitchDisabled,
} from "@/lib/master-engine/switch-engine";

export type CanonicalSwitchProps = {
  id: string;
  label: string;
  description?: string;
  /**
   * Fail-closed: only `true` is ON. `false` | `null` | `undefined` → OFF.
   * Never crash, never undefined visual state, never loading loops.
   */
  checked?: boolean | null;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  /**
   * Render the control only (for menu rows that supply their own label/layout).
   * Uses `label` as `aria-label`.
   */
  controlOnly?: boolean;
};

/**
 * ROVEXO Canonical Switch Engine v1.0 (LOCKED).
 * Sole platform switch — size, colour, animation, a11y, fail-closed.
 * No parallel switch designs permitted.
 */
export function CanonicalSwitch({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
  className,
  controlOnly = false,
}: CanonicalSwitchProps) {
  const isOn = resolveCanonicalSwitchChecked(checked);
  const isDisabled = resolveCanonicalSwitchDisabled(disabled);

  const control = (
    <span
      className={cn("cds-switch", isDisabled && "cds-switch--disabled")}
      data-canonical-switch="v1.0"
      data-switch-engine="v1.0"
      data-switch-state={isOn ? "on" : "off"}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={isOn}
        aria-label={controlOnly ? label : undefined}
        checked={isOn}
        disabled={isDisabled}
        onChange={(event) => {
          if (isDisabled) return;
          onChange(event.target.checked);
        }}
        className={cn("cds-switch__input", focusRing)}
      />
      <span className="cds-switch__track" aria-hidden>
        <span className="cds-switch__thumb" />
      </span>
    </span>
  );

  if (controlOnly) {
    return <span className={className}>{control}</span>;
  }

  return (
    <label
      htmlFor={id}
      className={cn("cds-toggle-row", isDisabled && "cds-toggle-row--disabled", className)}
    >
      <span className="cds-toggle-row__copy">
        <span className="cds-toggle-row__title">{label}</span>
        {description ? <span className="cds-toggle-row__description">{description}</span> : null}
      </span>
      {control}
    </label>
  );
}
