"use client";

import { useEffect } from "react";
import {
  CHUNK_RECOVER_COOLDOWN_MS,
  CHUNK_RECOVER_PARAM,
  CHUNK_RECOVER_SESSION_KEY,
  CHUNK_RECOVERY_LOCK_PROP,
  isWithinRecoveryCooldown,
  shouldAutoRecoverChunkFailure,
} from "@/lib/runtime/chunk-load-recovery-guard-v1";

type RecoveryLockWindow = Window & {
  [CHUNK_RECOVERY_LOCK_PROP]?: boolean;
};

function alreadyRecovered(): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(CHUNK_RECOVER_PARAM) === "1") return true;
  } catch {
    // ignore
  }
  try {
    return isWithinRecoveryCooldown(
      sessionStorage.getItem(CHUNK_RECOVER_SESSION_KEY),
      Date.now(),
      CHUNK_RECOVER_COOLDOWN_MS,
    );
  } catch {
    return false;
  }
}

function acquireRecoveryLock(): boolean {
  const w = window as RecoveryLockWindow;
  if (w[CHUNK_RECOVERY_LOCK_PROP]) return false;
  w[CHUNK_RECOVERY_LOCK_PROP] = true;
  return true;
}

async function clearStaleRuntimeCaches(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    // ignore
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore
  }
}

function markRecoveredAndReload(): void {
  // Sync lock FIRST — bootstrap + React must not both schedule replace().
  if (!acquireRecoveryLock()) return;
  if (alreadyRecovered()) return;

  try {
    sessionStorage.setItem(CHUNK_RECOVER_SESSION_KEY, String(Date.now()));
  } catch {
    // fall through to URL param
  }

  void clearStaleRuntimeCaches().finally(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(CHUNK_RECOVER_PARAM) === "1") return;
      url.searchParams.set(CHUNK_RECOVER_PARAM, "1");
      window.location.replace(url.toString());
    } catch {
      if (!/([?&])rx_chunk=1(?:&|$)/.test(window.location.search)) {
        const join = window.location.search ? "&" : "?";
        window.location.replace(`${window.location.href}${join}${CHUNK_RECOVER_PARAM}=1`);
      }
    }
  });
}

/**
 * One-shot recovery for stale `/_next` APP chunk hashes after rebuild/deploy.
 * P3.1: sync lock + cooldown; skip Turbopack HMR-client races on localhost/LAN
 * (errors still surface — recovery is not suppression).
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has(CHUNK_RECOVER_PARAM)) {
        url.searchParams.delete(CHUNK_RECOVER_PARAM);
        window.history.replaceState(window.history.state, "", url.toString());
        // Keep cooldown timestamp — do NOT clear immediately (R1.2 storm fix).
        // Legacy "1" flag → upgrade to timestamp so cooldown applies.
        try {
          const prev = sessionStorage.getItem(CHUNK_RECOVER_SESSION_KEY);
          if (!prev || prev === "1") {
            sessionStorage.setItem(CHUNK_RECOVER_SESSION_KEY, String(Date.now()));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    const recover = (reason: unknown) => {
      if (!shouldAutoRecoverChunkFailure(reason, window.location.hostname)) {
        return;
      }
      if (alreadyRecovered()) return;
      markRecoveredAndReload();
    };

    const onError = (event: ErrorEvent) => {
      const reason = event.error ?? event.message;
      recover(reason);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      recover(event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
