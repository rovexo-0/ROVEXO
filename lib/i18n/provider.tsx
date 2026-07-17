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
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { createClient } from "@/lib/supabase/client";

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
  if (typeof window === "undefined") return "en-GB";
  const stored = window.localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
  if (stored && getLocaleOption(stored)) return stored;
  const fromCookie = readCookieLocale();
  if (fromCookie) return fromCookie;
  return "en-GB";
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
        const {
          data: { session },
        } = await createClient().auth.getSession();
        if (!session || cancelled) return;

        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload = (await response.json()) as { settings?: { localeCode?: LocaleCode } };
        const code = payload.settings?.localeCode;
        if (!cancelled && code && getLocaleOption(code) && code !== readStoredLocale()) {
          window.localStorage.setItem(STORAGE_KEY, code);
          writeLocaleCookie(code);
          notifyLocaleChange();
          document.documentElement.lang = localeToHtmlLang(code);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const applyLocale = useCallback((code: LocaleCode) => {
    window.localStorage.setItem(STORAGE_KEY, code);
    writeLocaleCookie(code);
    document.documentElement.lang = localeToHtmlLang(code);
    document.documentElement.dir = localeDirection(code);
    notifyLocaleChange();
  }, []);

  const setLocaleCode = useCallback(
    async (code: LocaleCode) => {
      applyLocale(code);
      const option = getLocaleOption(code);
      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localeCode: code,
            language: option.language,
            currency: option.currencyLabel,
          }),
        });
      } catch {
        // Keep local locale applied even if the settings sync fails offline.
      }
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
