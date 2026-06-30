"use client";

import { LOCALE_OPTIONS, type LocaleCode } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type LanguagePickerProps = {
  value: string;
  localeCode: string;
  onChange: (localeCode: LocaleCode) => void;
};

export function LanguagePicker({ value, localeCode, onChange }: LanguagePickerProps) {
  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor="language-picker" className="text-sm font-medium text-text-primary">
        Language
      </label>
      <select
        id="language-picker"
        value={localeCode}
        onChange={(event) => onChange(event.target.value as LocaleCode)}
        className={cn(
          "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
          focusRing,
        )}
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-text-secondary">Current display language: {value}</p>
    </div>
  );
}
