"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/i18n/provider";
import { translate, type MessageKey } from "@/lib/i18n/messages";

export function useTranslation() {
  const { localeCode } = useLocale();

  const t = useCallback((key: MessageKey) => translate(localeCode, key), [localeCode]);

  return { t, localeCode };
}
