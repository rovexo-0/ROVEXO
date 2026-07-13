"use client";

import { Checkbox as UiCheckbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuthCheckboxProps = {
  name: string;
  label: string;
  defaultChecked?: boolean;
  className?: string;
};

export function Checkbox({ name, label, defaultChecked, className }: AuthCheckboxProps) {
  return (
    <label
      className={cn(
        "auth-checkbox flex min-h-ds-7 cursor-pointer items-center gap-ds-3 rounded-ds-lg px-ds-4 py-ds-3",
        focusRing,
        className,
      )}
    >
      <UiCheckbox name={name} defaultChecked={defaultChecked} />
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </label>
  );
}
