"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const COOKIE_CONSENT_KEY = "rovexo_cookie_consent_v1";

export type CookieConsentChoice = "accepted" | "rejected";

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === "accepted" || value === "rejected") return value;
  } catch {
    return null;
  }
  return null;
}

export function writeCookieConsent(choice: CookieConsentChoice) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    window.dispatchEvent(new CustomEvent("rovexo:cookie-consent", { detail: choice }));
  } catch {
    // ignore storage failures
  }
}

/** UK cookie banner — analytics only after Accept. Essential cookies always allowed. */
export function CookieConsentBanner() {
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("rovexo:cookie-consent", onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        window.removeEventListener("rovexo:cookie-consent", onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    readCookieConsent,
    () => "accepted" as CookieConsentChoice,
  );

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-surface px-ds-4 py-ds-4",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="flex w-full max-w-none flex-col gap-ds-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          We use essential cookies to run ROVEXO. Analytics cookies help us improve the marketplace
          and are optional. See our{" "}
          <Link href="/legal/cookie-policy" className="font-medium text-primary underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-ds-2">
          <button
            type="button"
            className="min-h-11 rounded-ds-full border border-border px-ds-4 text-sm font-semibold text-text-primary"
            onClick={() => {
              writeCookieConsent("rejected");
            }}
          >
            Reject
          </button>
          <button
            type="button"
            className="min-h-11 rounded-ds-full bg-primary px-ds-4 text-sm font-semibold text-white"
            onClick={() => {
              writeCookieConsent("accepted");
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
