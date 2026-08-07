"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PushPermissionPrompt } from "@/features/notifications/components/PushPermissionPrompt";
import { subscribeToBrowserPush, unsubscribeFromBrowserPush } from "@/lib/push/client-subscribe";
import {
  buildPushPermissionFlowSnapshot,
  logPushPermissionFlow,
  probeExistingPushSubscription,
} from "@/lib/push/push-permission-flow-log-v1";
import { isDocumentVisible } from "@/lib/performance/visibility";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { tryCreateClient } from "@/lib/supabase/client";

const PUBLIC_AUTH_ROUTES: ReadonlySet<string> = new Set([
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.verifyEmail,
  AUTH_ROUTES.resetPassword,
  "/splash",
  "/welcome",
]);

/**
 * Background push sync (never prompts) + Soft Permission Sheet (Phase 1).
 * Soft sheet evaluation is independent of Service Worker ready state.
 * Every early return logs an exact SKIP reason (Owner Live Certification).
 */
export function PushSubscriptionManager() {
  const pathname = usePathname();
  const [softPromptOpen, setSoftPromptOpen] = useState(false);

  useEffect(() => {
    logPushPermissionFlow("PUSH_PERMISSION_PROMPT_MOUNTED", { pathname });
    logPushPermissionFlow("PUSH_ENGINE_BOOT", { pathname });
  }, [pathname]);

  const evaluateSoftPrompt = useCallback(async (trigger: string) => {
    logPushPermissionFlow("EVALUATE_PERMISSION_FLOW", { trigger, pathname });

    if (PUBLIC_AUTH_ROUTES.has(pathname)) {
      const snapshot = buildPushPermissionFlowSnapshot({
        event: "SKIP",
        pathname,
        authenticated: false,
      });
      logPushPermissionFlow("SKIP:auth_route", { ...snapshot, skipReason: "auth_route" });
      setSoftPromptOpen(false);
      return;
    }

    if (!isDocumentVisible()) {
      logPushPermissionFlow("SKIP:document_not_visible", {
        pathname,
        visibilityState: document.visibilityState,
        hidden: document.hidden,
        skipReason: "document_not_visible",
      });
      return;
    }

    const client = tryCreateClient();
    if (!client) {
      logPushPermissionFlow("SKIP:supabase_client_unavailable", {
        pathname,
        skipReason: "supabase_client_unavailable",
      });
      setSoftPromptOpen(false);
      return;
    }

    const {
      data: { session },
    } = await client.auth.getSession();
    const authenticated = Boolean(session);

    if (!authenticated) {
      const snapshot = buildPushPermissionFlowSnapshot({
        event: "SKIP",
        pathname,
        authenticated: false,
      });
      logPushPermissionFlow("SKIP:not_authenticated", snapshot);
      setSoftPromptOpen(false);
      return;
    }

    const existingSubscriptionHint = await probeExistingPushSubscription();
    const snapshot = buildPushPermissionFlowSnapshot({
      event: "EVALUATE_PERMISSION_FLOW_RESULT",
      pathname,
      authenticated: true,
      existingSubscriptionHint,
    });

    logPushPermissionFlow("CONDITION_DUMP", snapshot);

    if (!snapshot.shouldShowPrompt) {
      logPushPermissionFlow(`SKIP:${snapshot.skipReason}`, {
        finalReason: snapshot.skipReason,
        shouldShowPrompt: false,
      });
      setSoftPromptOpen(false);
      return;
    }

    logPushPermissionFlow("SHOW_SOFT_PERMISSION_SHEET", {
      shouldShowPrompt: true,
      skipReason: "none",
      finalReason: "none",
    });
    setSoftPromptOpen(true);
  }, [pathname]);

  // Soft Permission Sheet — never wait on SW sync. Retry when auth hydrates (mobile race).
  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const run = async (trigger: string) => {
      if (cancelled) return;
      await evaluateSoftPrompt(trigger);
    };

    void run("mount");

    // Mobile often hydrates session after first paint — re-evaluate on auth change.
    const client = tryCreateClient();
    if (client) {
      const { data } = client.auth.onAuthStateChange((event) => {
        logPushPermissionFlow("AUTH_STATE_CHANGE", { event, pathname });
        void run(`auth:${event}`);
      });
      authSubscription = data.subscription;
    }

    // Short retries cover slow mobile session restore without waiting forever.
    const retryTimers = [400, 1200, 3000].map((ms) =>
      window.setTimeout(() => {
        void run(`retry:${ms}ms`);
      }, ms),
    );

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void run("visibilitychange");
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      authSubscription?.unsubscribe();
      for (const timer of retryTimers) window.clearTimeout(timer);
    };
  }, [pathname, evaluateSoftPrompt]);

  // Background subscription sync — must never block Soft Permission Sheet.
  useEffect(() => {
    if (PUBLIC_AUTH_ROUTES.has(pathname)) return;

    let cancelled = false;

    async function syncPushSubscription() {
      if (!isDocumentVisible() || cancelled) return;
      const client = tryCreateClient();
      if (!client) return;
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session || cancelled) return;

      try {
        const settingsResponse = await fetch("/api/notifications/settings", {
          cache: "no-store",
        });
        if (!settingsResponse.ok || cancelled) return;

        const { settings } = (await settingsResponse.json()) as {
          settings: { pushEnabled: boolean; browserPush?: boolean };
        };

        const browserPushEnabled = settings.browserPush ?? true;
        logPushPermissionFlow("BACKGROUND_SYNC", {
          pushEnabled: settings.pushEnabled,
          browserPushEnabled,
        });

        if (settings.pushEnabled && browserPushEnabled) {
          await subscribeToBrowserPush({ allowPrompt: false });
        } else {
          await unsubscribeFromBrowserPush();
        }
      } catch (error) {
        logPushPermissionFlow("BACKGROUND_SYNC_ERROR", {
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    void syncPushSubscription();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncPushSubscription();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  useEffect(() => {
    logPushPermissionFlow(softPromptOpen ? "SOFT_SHEET_OPEN_STATE_TRUE" : "SOFT_SHEET_OPEN_STATE_FALSE", {
      softPromptOpen,
      pathname,
    });
  }, [softPromptOpen, pathname]);

  return (
    <PushPermissionPrompt
      open={softPromptOpen}
      onClose={() => {
        logPushPermissionFlow("SOFT_SHEET_DISMISS", { pathname });
        setSoftPromptOpen(false);
      }}
      onEnabled={() => {
        logPushPermissionFlow("SOFT_SHEET_ENABLED_SUCCESS", { pathname });
        void subscribeToBrowserPush({ allowPrompt: false });
      }}
    />
  );
}
