"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLocaleOption, localeToHtmlLang, type LocaleCode } from "@/lib/i18n/config";

type LocaleContextValue = {
  localeCode: LocaleCode;
  language: string;
  currency: string;
  currencyLabel: string;
  setLocaleCode: (code: LocaleCode) => Promise<void>;
  loading: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "rovexo-locale";

function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return "en-IE";
  const stored = window.localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
  if (stored && getLocaleOption(stored)) return stored;
  return "en-IE";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [localeCode, setLocaleCodeState] = useState<LocaleCode>(readStoredLocale);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(localeCode);
  }, [localeCode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload = (await response.json()) as { settings?: { localeCode?: LocaleCode } };
        const code = payload.settings?.localeCode;
        if (!cancelled && code && getLocaleOption(code)) {
          setLocaleCodeState(code);
          window.localStorage.setItem(STORAGE_KEY, code);
          document.documentElement.lang = localeToHtmlLang(code);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyLocale = useCallback((code: LocaleCode) => {
    setLocaleCodeState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = localeToHtmlLang(code);
  }, []);

  const setLocaleCode = useCallback(
    async (code: LocaleCode) => {
      applyLocale(code);
      const option = getLocaleOption(code);
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localeCode: code,
          language: option.language,
          currency: option.currencyLabel,
        }),
      });
    },
    [applyLocale],
  );

  const option = getLocaleOption(localeCode);

  const value = useMemo(
    () => ({
      localeCode,
      language: option.language,
      currency: option.currency,
      currencyLabel: option.currencyLabel,
      setLocaleCode,
      loading,
    }),
    [localeCode, option, setLocaleCode, loading],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useLocaleOptional() {
  return useContext(LocaleContext);
}
