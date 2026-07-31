"use client";

import { CanonicalInfoBlock } from "@/src/components/canonical";
import { useCallback, useEffect, useRef, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { PreferenceToggleRow } from "@/features/settings/components/PreferenceToggleRow";
import {
  NOTIFICATION_ENGINE_SECTIONS,
  type NotificationEngineChannelId,
  type NotificationEngineState,
  type NotificationEngineTopicId,
} from "@/lib/notifications/notification-engine-v1";
import type { NotificationSettings } from "@/lib/notifications/types";
import {
  subscribeToBrowserPush,
  unsubscribeFromBrowserPush,
} from "@/lib/push/client-subscribe";

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [engine, setEngine] = useState<NotificationEngineState | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [loadFailed, setLoadFailed] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    void fetch("/api/notifications/settings")
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload: { settings: NotificationSettings; engine: NotificationEngineState }) => {
        setSettings(payload.settings);
        setEngine(payload.engine);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const markSaving = (id: string, on: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const persistPatch = useCallback(
    async (
      controlId: string,
      patch: { topicId?: string; channelId?: string; enabled: boolean },
      optimistic: NotificationEngineState,
      rollback: NotificationEngineState,
    ) => {
      if (inflight.current.has(controlId)) return;
      inflight.current.add(controlId);
      markSaving(controlId, true);
      setEngine(optimistic);

      try {
        const response = await fetch("/api/notifications/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          setEngine(rollback);
          return;
        }
        const payload = (await response.json()) as {
          settings: NotificationSettings;
          engine: NotificationEngineState;
        };
        setSettings(payload.settings);
        setEngine(payload.engine);
      } catch {
        setEngine(rollback);
      } finally {
        inflight.current.delete(controlId);
        markSaving(controlId, false);
      }
    },
    [],
  );

  const updateTopic = async (topicId: NotificationEngineTopicId, enabled: boolean) => {
    if (!engine) return;
    const rollback = engine;
    const optimistic: NotificationEngineState = {
      ...engine,
      topics: { ...engine.topics, [topicId]: enabled },
    };
    await persistPatch(topicId, { topicId, enabled }, optimistic, rollback);
  };

  const updateChannel = async (channelId: NotificationEngineChannelId, enabled: boolean) => {
    if (!engine || !settings) return;
    if (channelId === "sms" || channelId === "whatsapp") return;

    if (channelId === "push" || channelId === "browser") {
      if (inflight.current.has(channelId)) return;
      inflight.current.add(channelId);
      markSaving(channelId, true);
      const rollback = engine;
      try {
        if (enabled) {
          const subscribed = await subscribeToBrowserPush({ allowPrompt: true });
          if (!subscribed) {
            setEngine(rollback);
            return;
          }
        } else if (channelId === "push") {
          await unsubscribeFromBrowserPush();
        }
        const optimistic: NotificationEngineState = {
          ...engine,
          channels: { ...engine.channels, [channelId]: enabled },
        };
        inflight.current.delete(channelId);
        await persistPatch(channelId, { channelId, enabled }, optimistic, rollback);
      } catch {
        setEngine(rollback);
        inflight.current.delete(channelId);
        markSaving(channelId, false);
      }
      return;
    }

    const rollback = engine;
    const optimistic: NotificationEngineState = {
      ...engine,
      channels: { ...engine.channels, [channelId]: enabled },
    };
    await persistPatch(channelId, { channelId, enabled }, optimistic, rollback);
  };

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  if (!settings || !engine) {
    return (
      <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
        <CanonicalInfoBlock variant="description">Loading settings…</CanonicalInfoBlock>
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
      <div
        className="settings-subpage-v1 fw-engine__stack"
        data-settings-notifications="v1.0"
        data-notification-engine="v1.0"
      >
        {savingIds.size > 0 ? (
          <p className="sr-only" aria-live="polite">
            Saving settings
          </p>
        ) : null}

        {NOTIFICATION_ENGINE_SECTIONS.map((section) => (
          <SettingSection key={section.id} title={section.title} intro={section.intro}>
            {section.kind === "security"
              ? section.controls.map((control) => (
                  <PreferenceToggleRow
                    key={control.id}
                    id={`notif-security-${control.id}`}
                    label={control.label}
                    description={control.description}
                    checked
                    locked
                    icon={section.icon}
                    tone={section.tone}
                    onChange={() => undefined}
                  />
                ))
              : null}

            {section.kind === "channels"
              ? section.controls.map((control) => {
                  const channelId = control.id as NotificationEngineChannelId;
                  const structureOnly = control.structureOnly === true;
                  return (
                    <PreferenceToggleRow
                      key={control.id}
                      id={`notif-channel-${control.id}`}
                      label={control.label}
                      description={control.description}
                      checked={structureOnly ? false : engine.channels[channelId] === true}
                      disabled={structureOnly || savingIds.has(channelId)}
                      saving={savingIds.has(channelId)}
                      icon={section.icon}
                      tone={section.tone}
                      onChange={(enabled) => {
                        void updateChannel(channelId, enabled);
                      }}
                    />
                  );
                })
              : null}

            {section.kind === "topics"
              ? section.controls.map((control) => {
                  const topicId = control.id as NotificationEngineTopicId;
                  return (
                    <PreferenceToggleRow
                      key={control.id}
                      id={`notif-topic-${control.id}`}
                      label={control.label}
                      description={control.description}
                      checked={engine.topics[topicId] === true}
                      disabled={savingIds.has(topicId)}
                      saving={savingIds.has(topicId)}
                      icon={section.icon}
                      tone={section.tone}
                      onChange={(enabled) => {
                        void updateTopic(topicId, enabled);
                      }}
                    />
                  );
                })
              : null}
          </SettingSection>
        ))}
      </div>
    </MyAccountTemplate>
  );
}
