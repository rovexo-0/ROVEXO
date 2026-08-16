"use client";

import { useEffect, useState } from "react";
import { ROVEXO_SW_CACHE_NAME } from "@/lib/app/version";
import {
  ROVEXO_SW_RELOAD_SESSION_KEY,
  ROVEXO_SW_SCOPE,
  ROVEXO_SW_SCRIPT,
  ROVEXO_SW_SKIP_WAITING_MESSAGE,
  shouldReloadForServiceWorkerUpdate,
} from "@/lib/pwa/pwa-update-engine-v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isFormActive(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  ) {
    return true;
  }
  return Boolean(
    document.querySelector("[aria-busy='true']") ||
      document.querySelector("form[data-submitting='true']"),
  );
}

function readReloadedVersion(): string | null {
  try {
    return sessionStorage.getItem(ROVEXO_SW_RELOAD_SESSION_KEY);
  } catch {
    return null;
  }
}

function markReloaded(version: string): void {
  try {
    sessionStorage.setItem(ROVEXO_SW_RELOAD_SESSION_KEY, version);
  } catch {
    /* ignore */
  }
}

function reloadOnceWhenSafe(version: string): boolean {
  if (
    !shouldReloadForServiceWorkerUpdate({
      pathname: window.location.pathname,
      nextVersion: version,
      alreadyReloadedForVersion: readReloadedVersion(),
      isFormActive: isFormActive(),
    })
  ) {
    return false;
  }
  markReloaded(version);
  window.location.reload();
  return true;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Dev / localhost must never keep a Service Worker. Cached HTML navigations
    // embed hashed /_next CSS+JS URLs; after `.next` rebuild those hashes die and
    // the UI falls back to unstyled/raw HTML with oversized images.
    const host = window.location.hostname;
    const isLocalDev =
      process.env.NODE_ENV !== "production" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]";

    if (isLocalDev) {
      void (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            reg.active?.postMessage({ type: "ROVEXO_DEV_UNREGISTER" });
            reg.waiting?.postMessage({ type: "ROVEXO_DEV_UNREGISTER" });
            reg.installing?.postMessage({ type: "ROVEXO_DEV_UNREGISTER" });
            await reg.unregister();
          }
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(
              keys
                .filter((key) => key.startsWith("rovexo-"))
                .map((key) => caches.delete(key)),
            );
          }
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;

    const activateWaiting = (reg: ServiceWorkerRegistration) => {
      const waiting = reg.waiting;
      if (!waiting) return;
      waiting.postMessage({ type: ROVEXO_SW_SKIP_WAITING_MESSAGE });
    };

    const onControllerChange = () => {
      reloadOnceWhenSafe(ROVEXO_SW_CACHE_NAME);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void registration?.update().catch(() => undefined);
      if (registration?.waiting) activateWaiting(registration);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibility);

    // Canonical SW: /sw.js — ONE worker, scope /
    void navigator.serviceWorker
      .register(ROVEXO_SW_SCRIPT, { scope: ROVEXO_SW_SCOPE, updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;
        void reg.update().catch(() => undefined);
        activateWaiting(reg);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              activateWaiting(reg);
            }
          });
        });
      })
      .catch(() => undefined);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setShowBanner(false);
    setInstallEvent(null);
  };

  return (
    <>
      {children}
      {showBanner && (
        <div className="fixed inset-x-4 bottom-20 z-50 rx-sheet p-ds-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
          <p className="text-sm font-semibold">Install ROVEXO</p>
          <p className="mt-ds-1 text-xs text-text-secondary">
            Add ROVEXO to your home screen for faster access and offline support.
          </p>
          <div className="mt-ds-3 flex gap-ds-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-primary px-ds-3 py-ds-2 text-sm font-medium text-white"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="rounded-lg px-ds-3 py-ds-2 text-sm text-text-secondary"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
