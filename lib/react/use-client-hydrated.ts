"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** True only after the client has hydrated — keeps SSR and first client render identical. */
export function useClientHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
}
