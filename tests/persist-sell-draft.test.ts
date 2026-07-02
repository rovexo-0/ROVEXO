/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { persistSellDraftTextSync } from "@/lib/sell/persist-sell-draft";

const STORAGE_KEY = "rovexo:sell-draft";
const SESSION_KEY = "rovexo:sell-upload-session";

describe("persistSellDraftTextSync", () => {
  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  });

  it("persists pending refs without flushing text commits to React state", () => {
    const draft = createEmptyDraft();
    const draftRef = { current: draft };
    const pendingTitleRef = { current: "Nike trainers" };
    const pendingDescriptionRef = { current: "Size 9, worn twice, great condition overall." };

    const saved = persistSellDraftTextSync({
      draftRef,
      pendingTitleRef,
      pendingDescriptionRef,
      uploadSessionId: "session-1",
    });

    expect(saved).toBe(true);
    expect(draftRef.current.description).toBe("");

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      title?: string;
      description?: string;
    };
    expect(stored?.title).toBe("Nike trainers");
    expect(stored?.description).toBe("Size 9, worn twice, great condition overall.");
  });
});
