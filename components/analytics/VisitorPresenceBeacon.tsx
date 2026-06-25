"use client";

import { useEffect } from "react";

const STORAGE_KEY = "rovexo-visitor-session";
const HEARTBEAT_INTERVAL_MS = 45_000;

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
}

export function VisitorPresenceBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionId = getOrCreateSessionId();
    let intervalId = 0;

    void sendHeartbeat(sessionId);
    intervalId = window.setInterval(() => void sendHeartbeat(sessionId), HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat(sessionId);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
