"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  readOwnerDemoModeFromBrowser,
  writeOwnerDemoModeToBrowser,
} from "@/lib/inbox/demo/owner-demo-mode-v1";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onStoreChange();
  window.addEventListener("rovexo:owner-demo-mode", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("rovexo:owner-demo-mode", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): boolean {
  return readOwnerDemoModeFromBrowser();
}

function getServerSnapshot(): boolean {
  return false;
}

/** Client Owner Demo Mode flag (default OFF). Syncs localStorage + cookie. */
export function useOwnerDemoMode(): {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  hydrated: boolean;
} {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setEnabled = useCallback((next: boolean) => {
    writeOwnerDemoModeToBrowser(next);
  }, []);

  return { enabled, setEnabled, hydrated: true };
}
