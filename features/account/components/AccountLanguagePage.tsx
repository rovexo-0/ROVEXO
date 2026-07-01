"use client";

import { useState } from "react";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { LanguagePicker } from "@/features/settings/components/LanguagePicker";
import { useLocale } from "@/lib/i18n/provider";
import { getLocaleOption, type LocaleCode } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";

export function AccountLanguagePage() {
  const { localeCode, setLocaleCode } = useLocale();
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);

  const save = async (code: LocaleCode) => {
    setMessage(null);
    try {
      await setLocaleCode(code);
      setMessage(t("language.updated"));
    } catch {
      setMessage(t("language.error"));
    }
  };

  return (
    <AccountPageShell
      title="Language"
      subtitle="Choose your preferred language and regional format."
      backHref="/account/settings"
      backLabel="Settings"
    >
      <section className="rx-surface-card p-ds-5">
        <LanguagePicker
          value={getLocaleOption(localeCode).language}
          localeCode={localeCode}
          onChange={(code) => void save(code)}
        />
        {message ? <p className="mt-ds-3 text-sm text-text-secondary">{message}</p> : null}
      </section>
    </AccountPageShell>
  );
}
