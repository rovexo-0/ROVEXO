/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import {
  persistSellDraftSnapshot,
  persistSellDraftTextSync,
} from "@/lib/sell/persist-sell-draft";

const STORAGE_KEY = "rovexo:sell-draft";
const SESSION_KEY = "rovexo:sell-upload-session";

describe("persistSellDraftTextSync", () => {
  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  it("P10.1 skips empty post-publish shell without rewriting localStorage", () => {
    const draft = createEmptyDraft();
    const draftRef = { current: draft };
    const pendingTitleRef = { current: "" };
    const pendingDescriptionRef = { current: "" };

    const saved = persistSellDraftTextSync({
      draftRef,
      pendingTitleRef,
      pendingDescriptionRef,
      uploadSessionId: "session-empty",
    });

    expect(saved).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("persistSellDraftSnapshot P10.1 post-publish", () => {
  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not POST /api/sell/draft for an empty reset shell", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const draft = createEmptyDraft();
    const result = await persistSellDraftSnapshot(
      {
        draftRef: { current: draft },
        pendingTitleRef: { current: "" },
        pendingDescriptionRef: { current: "" },
        uploadSessionId: "session-empty",
      },
      { persistDatabase: true },
    );

    expect(result.databaseDraftSaved).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not POST when photos exist but price is empty (post-publish remnant)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const draft = {
      ...createEmptyDraft(),
      photos: [
        {
          id: "p1",
          previewUrl: "blob:x",
          uploaded: true,
          url: "https://cdn.example/a.jpg",
          storagePath: "a.jpg",
        },
      ],
      price: "",
    };

    const result = await persistSellDraftSnapshot(
      {
        draftRef: { current: draft },
        pendingTitleRef: { current: "" },
        pendingDescriptionRef: { current: "" },
        uploadSessionId: "session-photo",
      },
      { persistDatabase: true },
    );

    expect(result.databaseDraftSaved).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
