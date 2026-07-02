/// <reference lib="webworker" />
//
// Category detection runs entirely inside this Web Worker so the taxonomy tree
// build, keyword/synonym index construction and fuzzy search NEVER execute on
// the UI thread. Even if a future taxonomy data defect reintroduced a slow or
// pathological build, it would stall this worker — the Description field, the
// page and `beforeunload` would all stay responsive. This is what guarantees
// identical behaviour across Chrome, Safari, Android Chrome and the PWA.

import {
  detectCategoryFromTitle,
  type CategoryDetectionResult,
} from "@/lib/sell/category-detection-pro";
import { warmCategoryIndexes } from "@/lib/taxonomy/category-search";

type DetectionRequest =
  | { type: "warm" }
  | { type: "detect"; id: number; title: string; description: string };

export type DetectionResponse = { id: number; result: CategoryDetectionResult };

function reply(message: DetectionResponse): void {
  // `postMessage` on the worker global takes a single argument; cast to avoid
  // the DOM `Window.postMessage(message, targetOrigin)` overload from the libs.
  (globalThis as unknown as { postMessage: (message: unknown) => void }).postMessage(message);
}

globalThis.addEventListener("message", (event) => {
  const data = (event as MessageEvent<DetectionRequest>).data;

  if (data.type === "warm") {
    // Build every index once, off the main thread, right after mount.
    warmCategoryIndexes();
    return;
  }

  if (data.type === "detect") {
    const result = detectCategoryFromTitle(data.title, data.description);
    reply({ id: data.id, result });
  }
});
