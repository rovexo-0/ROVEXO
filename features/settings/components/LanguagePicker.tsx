"use client";


import { CanonicalSelector } from "@/src/components/canonical";
import { LOCALE_OPTIONS, type LocaleCode } from "@/lib/i18n/config";

type LanguagePickerProps = {
  value: string;
  localeCode: string;
  onChange: (localeCode: LocaleCode) => void;
};

export function LanguagePicker({ value, localeCode, onChange }: LanguagePickerProps) {
  return (
    <div className="flex flex-col gap-ds-2">
      <CanonicalSelector
        label="Language"
        id="language-picker"
        kind="language"
        value={localeCode}
        onChange={(event) => onChange(event.target.value as LocaleCode)}
        options={LOCALE_OPTIONS.map((option) => ({
          value: option.code,
          label: option.label,
        }))}
      />
      <p className="cds-field__hint">Current display language: {value}</p>
    </div>
  );
}
