import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
  validateListingTitle,
} from "@/lib/sell/listing-title";
import {
  createEmptyDraft,
  getListingValidationErrors,
  isListingValid,
} from "@/features/sell/types";
import { getCategoryTree } from "@/lib/categories/queries";
import {
  loadCategoriesWithRecovery,
  writeCategoryTreeCache,
} from "@/lib/categories/category-loader";
import {
  applyAiAnalysisFields,
  categoryDetectionFromAiAnalysis,
  LISTING_AI_CONFIRM_THRESHOLD,
} from "@/lib/sell/listing-ai-category";
import { buildResultFromVisionPayload } from "@/lib/ai-camera/build-result";
import type { VisionResponsePayload } from "@/lib/ai-camera/vision-schema";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";

const SAMPLE_TREE = getCategoryTree();

describe("listing title field rules", () => {
  it("accepts up to 120 characters including paste-sized input", () => {
    const pasted = "A".repeat(200);
    const clamped = clampListingTitle(pasted);
    expect(clamped).toHaveLength(LISTING_TITLE_MAX);
    expect(validateListingTitle(clamped)).toBeUndefined();
  });

  it("requires at least 3 characters when required", () => {
    expect(validateListingTitle("ab", { required: true })).toContain("3");
    expect(validateListingTitle("Valid title", { required: true })).toBeUndefined();
  });

  it("does not surface form errors until publish validation is enabled", () => {
    const draft = createEmptyDraft();
    draft.title = "ab";
    draft.photos = [
      {
        id: "1",
        previewUrl: "https://www.rovexo.co.uk/media/test/a.jpg",
        uploaded: true,
        url: "https://www.rovexo.co.uk/media/test/a.jpg",
        storagePath: "seller/a.jpg",
      },
    ];
    expect(getListingValidationErrors(draft, { showErrors: false })).toEqual({});
    expect(isListingValid(draft)).toBe(false);
    expect(getListingValidationErrors(draft, { showErrors: true }).title).toBeTruthy();
  });
});

describe("category recovery loader", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      setTimeout: globalThis.setTimeout,
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses session cache when available", async () => {
    writeCategoryTreeCache(SAMPLE_TREE);
    const result = await loadCategoriesWithRecovery();
    expect(result.source).toBe("cache");
    expect(result.tree.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries API then falls back to static tree without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    const result = await loadCategoriesWithRecovery(2);
    expect(result.source).toBe("static");
    expect(result.recovered).toBe(true);
    expect(result.tree.length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("refreshes cache after successful API recovery", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ tree: SAMPLE_TREE }), { status: 200 }),
    );
    const result = await loadCategoriesWithRecovery();
    expect(result.source).toBe("api");
    expect(storage.has("rovexo:category-tree:v1")).toBe(true);
  });
});

describe("AI category recovery bridge", () => {
  const visionPayload: VisionResponsePayload = {
    overallConfidence: 0.82,
    labels: ["trainer", "shoe"],
    predictions: [
      {
        confidence: 0.82,
        title: "Nike Air Max Trainers UK 9",
        description: "White trainers in good condition.",
        brand: "Nike",
        condition: "Good",
        dominantColour: "White",
        material: null,
        size: "UK 9",
        categorySlugs: ["shoes", "trainers", "nike"],
        attributes: { type: "trainer" },
        defects: [],
        accessories: [],
      },
    ],
  };

  it("asks for confirmation below auto-select but above none when confidence is under 90%", () => {
    const analysis = buildResultFromVisionPayload(visionPayload, "vision");
    const detection = categoryDetectionFromAiAnalysis(
      analysis,
      "Nike trainers",
      "Good condition white trainers.",
    );

    expect(detection.top).not.toBeNull();
    expect(detection.top!.confidence).toBeGreaterThanOrEqual(LISTING_AI_CONFIRM_THRESHOLD);
    expect(detection.tier).toBe("suggest");
  });

  it("applies brand and condition without forcing category when confidence needs confirmation", () => {
    const analysis = buildResultFromVisionPayload(visionPayload, "vision");
    const patch = applyAiAnalysisFields(analysis, {
      title: "",
      brand: "",
      color: "",
      size: "",
      condition: "",
      description: "",
    });

    expect(patch.brand).toBe("Nike");
    expect(patch.condition).toBe("Good");
    expect(patch.categoryPath).toBeUndefined();
  });

  it("keeps publish path valid when category is chosen manually after AI failure", () => {
    const draft = createEmptyDraft();
    draft.photos = [
      {
        id: "1",
        previewUrl: "https://www.rovexo.co.uk/media/test/a.jpg",
        uploaded: true,
        url: "https://www.rovexo.co.uk/media/test/a.jpg",
        storagePath: "seller/a.jpg",
      },
    ];
    draft.title = "Nike Air Max Trainers";
    draft.description = "White trainers in good condition.";
    draft.categoryPath = resolveCategoryPathBySlugs(["shoes", "trainers", "nike"]);
    draft.condition = "Good";
    draft.price = "80";
    draft.shippingMethod = "delivery_available";

    expect(isListingValid(draft, { mode: "quick" })).toBe(true);
  });
});
