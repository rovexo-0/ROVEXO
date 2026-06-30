"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
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
