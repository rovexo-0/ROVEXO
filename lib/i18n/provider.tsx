"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { getLocaleOption, localeDirection, localeToHtmlLang, type LocaleCode } from "@/lib/i18n/config";
import {
  PLATFORM_LANGUAGE_CODE,
  PLATFORM_LANGUAGE_LABEL,
  resolvePlatformLanguage,
} from "@/lib/i18n/platform-language";
import { UK_DEFAULT_CURRENCY } from "@/lib/i18n/uk-first";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { tryCreateClient } from "@/lib/supabase/client";

export type SetLocaleOptions = {
  persist?: boolean;
};

type LocaleContextValue = {
  localeCode: LocaleCode;
  language: string;
  currency: string;
  currencyLabel: string;
  setLocaleCode: (code: LocaleCode, options?: SetLocaleOptions) => Promise<void>;
  loading: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "rovexo-locale";
const COOKIE_KEY = "rovexo-locale";
const LOCALE_CHANGE_EVENT = "rovexo-locale-change";
const PUBLIC_AUTH_ROUTES: ReadonlySet<string> = new Set([
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.verifyEmail,
  AUTH_ROUTES.resetPassword,
  "/splash",
  "/welcome",
]);

function writeLocaleCookie(code: LocaleCode) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(code)};path=/;max-age=31536000;samesite=lax`;
}

function readCookieLocale(): LocaleCode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)rovexo-locale=([^;]+)/);
  if (!match?.[1]) return null;
  const code = decodeURIComponent(match[1]) as LocaleCode;
  return getLocaleOption(code) ? code : null;
}

function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return resolvePlatformLanguage(null);
  const stored = window.localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
  if (stored && getLocaleOption(stored)) return resolvePlatformLanguage(stored);
  const fromCookie = readCookieLocale();
  if (fromCookie) return resolvePlatformLanguage(fromCookie);
  return resolvePlatformLanguage(null);
}

function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function notifyLocaleChange() {
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const localeCode = useSyncExternalStore(
    subscribeLocale,
    readStoredLocale,
    (): LocaleCode => "en-GB",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(localeCode);
    document.documentElement.dir = localeDirection(localeCode);
  }, [localeCode]);

  useEffect(() => {
    if (PUBLIC_AUTH_ROUTES.has(pathname)) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const client = tryCreateClient();
        if (!client) return;
        const {
          data: { session },
        } = await client.auth.getSession();
        if (!session || cancelled) return;

        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload = (await response.json()) as { settings?: { localeCode?: LocaleCode } };
        const code = payload.settings?.localeCode;
        const resolved = resolvePlatformLanguage(code);
        if (!cancelled && code && getLocaleOption(code) && resolved !== readStoredLocale()) {
          window.localStorage.setItem(STORAGE_KEY, resolved);
          writeLocaleCookie(resolved);
          notifyLocaleChange();
          document.documentElement.lang = localeToHtmlLang(resolved);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const applyLocale = useCallback(() => {
    const resolved = PLATFORM_LANGUAGE_CODE;
    window.localStorage.setItem(STORAGE_KEY, resolved);
    writeLocaleCookie(resolved);
    document.documentElement.lang = localeToHtmlLang(resolved);
    document.documentElement.dir = localeDirection(resolved);
    notifyLocaleChange();
  }, []);

  const setLocaleCode = useCallback(
    async (_code?: LocaleCode, options?: SetLocaleOptions) => {
      void _code;
      applyLocale();
      if (options?.persist === false) return;
      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localeCode: PLATFORM_LANGUAGE_CODE,
            language: PLATFORM_LANGUAGE_LABEL,
          }),
        });
      } catch {
        // Keep English (UK) applied even if the settings sync fails offline.
      }
    },
    [applyLocale],
  );

  const value = useMemo(
    () => ({
      localeCode: PLATFORM_LANGUAGE_CODE,
      language: PLATFORM_LANGUAGE_LABEL,
      currency: UK_DEFAULT_CURRENCY,
      currencyLabel: "GBP (£)",
      setLocaleCode,
      loading,
    }),
    [setLocaleCode, loading],
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
