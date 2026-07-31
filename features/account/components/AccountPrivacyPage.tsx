"use client";

import {
  CanonicalSection,
  CanonicalInfoBlock,
  CanonicalSelector,
} from "@/src/components/canonical";
import { useCallback, useEffect, useRef, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { PreferenceToggleRow } from "@/features/settings/components/PreferenceToggleRow";
import {
  PRIVACY_ENGINE_SECTIONS,
  PRIVACY_PROFILE_VISIBILITY_OPTIONS,
  createDefaultPrivacyEngineState,
  type PrivacyEngineState,
  type PrivacySwitchId,
} from "@/lib/privacy/privacy-engine-v1";
import type { ProfileVisibility } from "@/lib/settings/types";

export function AccountPrivacyPage() {
  const [privacy, setPrivacy] = useState<PrivacyEngineState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/account/privacy");
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as {
          privacy: {
            engine?: PrivacyEngineState;
            switches?: PrivacyEngineState["switches"];
            whoCanViewProfile?: ProfileVisibility;
          };
        };
        if (cancelled) return;
        if (payload.privacy.engine) {
          setPrivacy(payload.privacy.engine);
        } else {
          const next = createDefaultPrivacyEngineState();
          if (payload.privacy.switches) next.switches = { ...next.switches, ...payload.privacy.switches };
          if (payload.privacy.whoCanViewProfile) next.whoCanViewProfile = payload.privacy.whoCanViewProfile;
          setPrivacy(next);
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markSaving = (id: string, on: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const persistSwitch = useCallback(async (switchId: PrivacySwitchId, enabled: boolean) => {
    if (!privacy || inflight.current.has(switchId)) return;
    inflight.current.add(switchId);
    markSaving(switchId, true);
    const rollback = privacy;
    const optimistic: PrivacyEngineState = {
      ...privacy,
      switches: { ...privacy.switches, [switchId]: enabled },
    };
    setPrivacy(optimistic);

    try {
      const response = await fetch("/api/account/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ switchId, switchEnabled: enabled }),
      });
      if (!response.ok) {
        setPrivacy(rollback);
        return;
      }
      const payload = (await response.json()) as { privacy: { engine: PrivacyEngineState } };
      setPrivacy(payload.privacy.engine);
    } catch {
      setPrivacy(rollback);
    } finally {
      inflight.current.delete(switchId);
      markSaving(switchId, false);
    }
  }, [privacy]);

  const persistVisibility = useCallback(
    async (whoCanViewProfile: ProfileVisibility) => {
      if (!privacy || inflight.current.has("whoCanViewProfile")) return;
      inflight.current.add("whoCanViewProfile");
      markSaving("whoCanViewProfile", true);
      const rollback = privacy;
      const optimistic = { ...privacy, whoCanViewProfile };
      setPrivacy(optimistic);
      try {
        const response = await fetch("/api/account/privacy", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whoCanViewProfile }),
        });
        if (!response.ok) {
          setPrivacy(rollback);
          return;
        }
        const payload = (await response.json()) as { privacy: { engine: PrivacyEngineState } };
        setPrivacy(payload.privacy.engine);
      } catch {
        setPrivacy(rollback);
      } finally {
        inflight.current.delete("whoCanViewProfile");
        markSaving("whoCanViewProfile", false);
      }
    },
    [privacy],
  );

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="privacy" title="Privacy" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  if (!privacy) {
    return (
      <MyAccountTemplate surface="privacy" title="Privacy" backHref="/account/settings" showHeaderTitle>
        <CanonicalInfoBlock variant="description">Loading privacy…</CanonicalInfoBlock>
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="privacy" title="Privacy" backHref="/account/settings" showHeaderTitle>
      <div
        className="settings-subpage-v1 fw-engine__stack"
        data-settings-privacy="v1.1"
        data-privacy-engine="v1.0"
        data-full-width-surface="privacy"
      >
        {savingIds.size > 0 ? (
          <p className="sr-only" aria-live="polite">
            Saving privacy settings
          </p>
        ) : null}

        {PRIVACY_ENGINE_SECTIONS.map((section) => {
          if (section.kind === "switches" && section.controls) {
            return (
              <SettingSection key={section.id} title={section.title} intro={section.intro}>
                {section.controls.map((control) => {
                  const switchId = control.id as PrivacySwitchId;
                  return (
                    <PreferenceToggleRow
                      key={control.id}
                      id={`privacy-${control.id}`}
                      label={control.label}
                      description={control.description}
                      checked={privacy.switches[switchId] === true}
                      saving={savingIds.has(switchId)}
                      disabled={savingIds.has(switchId)}
                      icon={section.icon}
                      tone={section.tone}
                      onChange={(enabled) => {
                        void persistSwitch(switchId, enabled);
                      }}
                    />
                  );
                })}
              </SettingSection>
            );
          }

          if (section.kind === "selector") {
            return (
              <CanonicalSection key={section.id} title={section.title}>
                <div className="fw-engine__group">
                  <CanonicalSelector
                    label="Who can view my profile"
                    id="whoCanViewProfile"
                    kind="generic"
                    options={PRIVACY_PROFILE_VISIBILITY_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={privacy.whoCanViewProfile}
                    disabled={savingIds.has("whoCanViewProfile")}
                    onChange={(event) => {
                      void persistVisibility(event.target.value as ProfileVisibility);
                    }}
                  />
                </div>
              </CanonicalSection>
            );
          }

          return null;
        })}
      </div>
    </MyAccountTemplate>
  );
}
