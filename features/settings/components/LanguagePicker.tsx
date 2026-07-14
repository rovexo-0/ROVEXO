"use client";

import { CanonicalSelector } from "@/src/components/canonical";
import { APP_DISPLAY_LOCALES } from "@/lib/i18n/app-locales";
import { LOCALE_OPTIONS, type LocaleCode } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";

type LanguagePickerProps = {
  value: string;
  localeCode: string;
  onChange: (localeCode: LocaleCode) => void;
};

export function LanguagePicker({ value, localeCode, onChange }: LanguagePickerProps) {
  const { tx } = useTranslation();
  const options = LOCALE_OPTIONS.filter((option) =>
    (APP_DISPLAY_LOCALES as readonly string[]).includes(option.code),
  );

  return (
    <div className="flex flex-col gap-ds-2">
      <CanonicalSelector
        label={tx("Language")}
        id="language-picker"
        kind="language"
        value={localeCode}
        onChange={(event) => onChange(event.target.value as LocaleCode)}
        options={options.map((option) => ({
          value: option.code,
          label: option.label,
        }))}
      />
      <p className="cds-field__hint">
        {tx("Current display language:")} {value}
      </p>
    </div>
  );
}
