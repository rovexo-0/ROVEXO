/** Publish-button invalidation without re-rendering the Sell page on every keystroke. */

import { sellProfileBumpPending } from "@/lib/sell/sell-profiler";

let version = 0;
const listeners = new Set<() => void>();

export function subscribePendingText(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingTextSnapshot(): number {
  return version;
}

export function bumpPendingTextVersion(): void {
  version += 1;
  sellProfileBumpPending();
  listeners.forEach((listener) => listener());
}
