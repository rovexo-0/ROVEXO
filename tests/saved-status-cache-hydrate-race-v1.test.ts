import { afterEach, describe, expect, it, vi } from "vitest";
import {
  invalidateSavedStatusCache,
  loadSavedSlugSet,
  markSavedInCache,
  peekSavedStatusCache,
} from "@/lib/saved/saved-status-cache";

describe("Saved hydrate does not overwrite optimistic POST", () => {
  afterEach(() => {
    invalidateSavedStatusCache();
    vi.unstubAllGlobals();
  });

  it("keeps a slug marked during an in-flight GET", async () => {
    let finishFetch!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finishFetch = resolve;
          }),
      ),
    );

    const hydrate = loadSavedSlugSet();
    markSavedInCache("store-listing", true);

    finishFetch(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const set = await hydrate;
    expect(set.has("store-listing")).toBe(true);
    expect(peekSavedStatusCache()?.has("store-listing")).toBe(true);
  });
});
