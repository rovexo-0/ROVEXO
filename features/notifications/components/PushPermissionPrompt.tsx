"use client";

import { useCallback, useEffect, useState } from "react";
import { CanonicalModal } from "@/src/components/canonical";
import { SafeImage } from "@/components/ui/SafeImage";
import { OFFICIAL_BRAND_APP_ICON } from "@/lib/brand/official-brand-application-v1";
import {
  PUSH_SOFT_PROMPT_BENEFITS,
  PUSH_SOFT_PROMPT_COPY,
  writePushSoftPromptRecord,
} from "@/lib/push/soft-permission-prompt-v1";
import { subscribeToBrowserPush } from "@/lib/push/client-subscribe";
import { logPushPermissionFlow } from "@/lib/push/push-permission-flow-log-v1";

export type PushPermissionPromptProps = {
  open: boolean;
  onClose: () => void;
  /** Called after successful subscribe + preference enable attempt. */
  onEnabled?: () => void;
};

async function enablePushPreferenceChannels(): Promise<void> {
  for (const channelId of ["push", "browser"] as const) {
    await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, enabled: true }),
    });
  }
}

/**
 * Soft Permission Sheet — Master UI Spec APPROVED.
 * Enable Notifications is the only path that may call Notification.requestPermission.
 */
export function PushPermissionPrompt({ open, onClose, onEnabled }: PushPermissionPromptProps) {
  const [loading, setLoading] = useState(false);

  // P0 AUDIT — prove component mount on every device.
  useEffect(() => {
    logPushPermissionFlow("PUSH_PERMISSION_PROMPT_COMPONENT_MOUNTED", {});
  }, []);

  useEffect(() => {
    logPushPermissionFlow(
      open ? "PUSH_PERMISSION_PROMPT_OPEN_TRUE" : "PUSH_PERMISSION_PROMPT_OPEN_FALSE",
      { open },
    );
    if (open) {
      logPushPermissionFlow("SOFT_SHEET_VISIBLE_RENDER", {
        title: PUSH_SOFT_PROMPT_COPY.title,
      });
    }
  }, [open]);

  const handleLater = useCallback(() => {
    logPushPermissionFlow("SOFT_SHEET_MAYBE_LATER", {});
    writePushSoftPromptRecord({ outcome: "later", at: Date.now() });
    onClose();
  }, [onClose]);

  const handleEnable = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    logPushPermissionFlow("SOFT_SHEET_ENABLE_TAP", {});
    try {
      const subscribed = await subscribeToBrowserPush({ allowPrompt: true });
      logPushPermissionFlow("SOFT_SHEET_SUBSCRIBE_RESULT", {
        subscribed,
        notificationPermission:
          typeof Notification !== "undefined" ? Notification.permission : "Notification_API_absent",
      });
      if (!subscribed) {
        const permission =
          typeof Notification !== "undefined" ? Notification.permission : "denied";
        writePushSoftPromptRecord({
          outcome: permission === "denied" ? "denied" : "later",
          at: Date.now(),
        });
        logPushPermissionFlow(
          permission === "denied" ? "SKIP:native_permission_denied" : "SKIP:subscribe_failed",
          { permission },
        );
        onClose();
        return;
      }

      await enablePushPreferenceChannels();
      writePushSoftPromptRecord({ outcome: "enabled", at: Date.now() });
      logPushPermissionFlow("READY", { subscribed: true, preferencesSynced: true });
      onEnabled?.();
      onClose();
    } catch (error) {
      logPushPermissionFlow("SKIP:enable_threw", {
        message: error instanceof Error ? error.message : "unknown",
      });
      writePushSoftPromptRecord({ outcome: "later", at: Date.now() });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [loading, onClose, onEnabled]);

  return (
    <CanonicalModal
      open={open}
      onClose={handleLater}
      variant="information"
      title={PUSH_SOFT_PROMPT_COPY.title}
      confirmLabel={PUSH_SOFT_PROMPT_COPY.enableLabel}
      cancelLabel={PUSH_SOFT_PROMPT_COPY.laterLabel}
      onConfirm={() => {
        void handleEnable();
      }}
      loading={loading}
      className="push-soft-permission-prompt"
    >
      <div className="flex flex-col gap-4 text-left">
        <div className="flex justify-center">
          <SafeImage
            src={OFFICIAL_BRAND_APP_ICON}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12"
            fallback="hide"
          />
        </div>
        <p className="text-[15px] font-medium text-[var(--cds-color-text,#1a1a1a)]">
          {PUSH_SOFT_PROMPT_COPY.subtitle}
        </p>
        <ul className="m-0 list-disc space-y-1.5 pl-5 text-[14px] leading-5 text-[var(--cds-color-text-muted,#64748b)]">
          {PUSH_SOFT_PROMPT_BENEFITS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </CanonicalModal>
  );
}
