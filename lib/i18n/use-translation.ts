"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/i18n/provider";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import { translateUi } from "@/lib/i18n/ui-phrases";

export function useTranslation() {
  const { localeCode } = useLocale();

  const t = useCallback((key: MessageKey) => translate(localeCode, key), [localeCode]);
  /** Translate a literal English UI string; falls back to English when missing. */
  const tx = useCallback((text: string) => translateUi(localeCode, text), [localeCode]);

  return { t, tx, localeCode };
}
