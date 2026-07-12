"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
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
    <AccountCanonicalShell title="Language" backHref="/account/settings" backLabel="Settings">
      <CanonicalSection title="Language">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <LanguagePicker
            value={getLocaleOption(localeCode).language}
            localeCode={localeCode}
            onChange={(code) => void save(code)}
          />
          {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
