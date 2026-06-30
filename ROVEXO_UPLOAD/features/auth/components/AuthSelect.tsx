"use client";

import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AuthSelectOption = {
  value: string;
  label: string;
};

type AuthSelectProps = {
  label: string;
  name: string;
  defaultValue?: string;
  options: AuthSelectOption[];
};

export function AuthSelect({ label, name, defaultValue, options }: AuthSelectProps) {
  return (
    <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
      <label className="flex flex-col gap-ds-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <select
          name={name}
          defaultValue={defaultValue}
          className={cn(
            "min-h-[44px] w-full appearance-none border-0 bg-transparent p-0 text-[17px] text-text-primary outline-none",
            focusRing,
            transitionFast,
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
