"use client";

import { useEffect } from "react";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import { isDocumentVisible } from "@/lib/performance/visibility";

const STORAGE_KEY = "rovexo-visitor-session";
const HEARTBEAT_INTERVAL_MS = 45_000;

/** P3 — skip overlapping POSTs (focus + interval); keep cadence unchanged. */
let presenceInflight: Promise<void> | null = null;

function getOrCreateSessionId(): string {
  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `rv-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(STORAGE_KEY, sessionId);
  return sessionId;
}

async function sendHeartbeat(sessionId: string): Promise<void> {
  if (!isDocumentVisible()) return;
  if (presenceInflight) return presenceInflight;

  presenceInflight = (async () => {
    await fetch("/api/analytics/live-presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        referrer: document.referrer || undefined,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch(() => undefined);
  })().finally(() => {
    presenceInflight = null;
  });

  return presenceInflight;
}

export function VisitorPresenceBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    getOrCreateSessionId();
  }, []);

  useVisibilityPolling(
    () => {
      void sendHeartbeat(getOrCreateSessionId());
    },
    HEARTBEAT_INTERVAL_MS,
    { immediate: true, refreshOnVisible: true },
  );

  return null;
}
