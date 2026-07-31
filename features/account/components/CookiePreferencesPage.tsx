"use client";

import { CanonicalInfoBlock } from "@/src/components/canonical";
import { useCallback, useEffect, useRef, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { PreferenceToggleRow } from "@/features/settings/components/PreferenceToggleRow";
import {
  COOKIE_PREFERENCE_CONTROLS,
  cookiePreferencesToBannerChoice,
  createDefaultCookiePreferences,
  type CookiePreferenceId,
  type CookiePreferencesState,
} from "@/lib/privacy/privacy-engine-v1";
import { writeCookieConsent } from "@/components/legal/CookieConsentBanner";

export function CookiePreferencesPage() {
  const [cookies, setCookies] = useState<CookiePreferencesState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    void fetch("/api/account/privacy/cookies")
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload: { cookies: CookiePreferencesState }) => {
        setCookies(payload.cookies ?? createDefaultCookiePreferences());
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const persist = useCallback(
    async (id: CookiePreferenceId, enabled: boolean) => {
      if (!cookies || id === "necessary" || inflight.current.has(id)) return;
      inflight.current.add(id);
      setSavingIds((prev) => new Set(prev).add(id));
      const rollback = cookies;
      const optimistic = { ...cookies, [id]: enabled, necessary: true as const };
      setCookies(optimistic);

      try {
        const response = await fetch("/api/account/privacy/cookies", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [id]: enabled }),
        });
        if (!response.ok) {
          setCookies(rollback);
          return;
        }
        const payload = (await response.json()) as { cookies: CookiePreferencesState };
        setCookies(payload.cookies);
        writeCookieConsent(cookiePreferencesToBannerChoice(payload.cookies));
      } catch {
        setCookies(rollback);
      } finally {
        inflight.current.delete(id);
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [cookies],
  );

  if (loadFailed) {
    return (
      <MyAccountTemplate
        surface="privacy"
        title="Cookie Preferences"
        backHref="/account/privacy"
        showHeaderTitle
      >
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  if (!cookies) {
    return (
      <MyAccountTemplate
        surface="privacy"
        title="Cookie Preferences"
        backHref="/account/privacy"
        showHeaderTitle
      >
        <CanonicalInfoBlock variant="description">Loading cookie preferences…</CanonicalInfoBlock>
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate
      surface="privacy"
      title="Cookie Preferences"
      backHref="/account/privacy"
      showHeaderTitle
    >
      <div
        className="settings-subpage-v1 fw-engine__stack"
        data-cookie-preferences="v1.0"
        data-full-width-surface="privacy"
      >
        {savingIds.size > 0 ? (
          <p className="sr-only" aria-live="polite">
            Saving cookie preferences
          </p>
        ) : null}

        <SettingSection
          title="Cookie Categories"
          intro="Necessary cookies are always on. Other categories are optional."
        >
          {COOKIE_PREFERENCE_CONTROLS.map((control) => {
            const id = control.id as CookiePreferenceId;
            const locked = control.locked === true || id === "necessary";
            return (
              <PreferenceToggleRow
                key={control.id}
                id={`cookie-${control.id}`}
                label={control.label}
                description={control.description}
                checked={locked ? true : cookies[id] === true}
                locked={locked}
                saving={savingIds.has(id)}
                disabled={locked || savingIds.has(id)}
                icon="settings"
                tone="orange"
                onChange={(enabled) => {
                  void persist(id, enabled);
                }}
              />
            );
          })}
        </SettingSection>
      </div>
    </MyAccountTemplate>
  );
}
