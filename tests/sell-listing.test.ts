import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setVisionResponseForTests,
  analyzeImageBuffer,
  analyzeImages,
} from "@/lib/ai-camera/analyze";
import { buildResultFromVisionPayload } from "@/lib/ai-camera/build-result";
import { AI_CAMERA_CONFIDENCE_THRESHOLD } from "@/lib/ai-camera/types";
import { analyzeWithFilenameFallback } from "@/lib/ai-camera/fallback";
import type { VisionResponsePayload } from "@/lib/ai-camera/vision-schema";
import {
  createEmptyDraft,
  getListingValidationErrors,
  isListingValid,
} from "@/features/sell/types";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";

const CAR_SEAT_VISION: VisionResponsePayload = {
  overallConfidence: 0.94,
  labels: ["car seat", "baby product"],
  predictions: [
    {
      confidence: 0.94,
      title: "Maxi-Cosi Pearl Car Seat – Black – Good Condition",
      description:
        "Baby car seat shown in the photos. Black colour. Good condition based on visible wear.",
      brand: "Maxi-Cosi",
      condition: "Good",
      dominantColour: "Black",
      material: null,
      size: null,
      categorySlugs: ["baby", "pushchairs", "travel-systems"],
      attributes: { type: "car seat" },
      defects: [],
      accessories: [],
    },
    {
      confidence: 0.81,
      title: "Infant Car Seat – Black",
      description: "Infant car seat. Black. Please verify model before purchase.",
      brand: null,
      condition: "Good",
      dominantColour: "Black",
      material: null,
      size: null,
      categorySlugs: ["baby", "pushchairs", "travel-systems"],
      attributes: {},
      defects: [],
      accessories: [],
    },
  ],
};

describe("AI vision pipeline", () => {
  beforeEach(() => {
    __setVisionResponseForTests(CAR_SEAT_VISION);
  });

  afterEach(() => {
    __setVisionResponseForTests(null);
    vi.unstubAllEnvs();
  });

  it("builds autofill result from high-confidence vision payload", () => {
    const result = buildResultFromVisionPayload(CAR_SEAT_VISION, "vision");

    expect(result.source).toBe("vision");
    expect(result.confidence).toBeGreaterThanOrEqual(AI_CAMERA_CONFIDENCE_THRESHOLD);
    expect(result.autoSelected).toBe(true);
    expect(result.lowConfidence).toBe(false);
    expect(result.predictions).toHaveLength(2);
    expect(result.matches[0]?.path.categorySlug).toBe("baby");
    expect(result.brand?.value).toBe("Maxi-Cosi");
    expect(result.condition?.value).toBe("Good");
    expect(result.color?.value).toBe("Black");
  });

  it("never autofills when vision confidence is below 90%", () => {
    const lowConfidencePayload: VisionResponsePayload = {
      overallConfidence: 0.72,
      labels: ["electronics"],
      predictions: [
        {
          confidence: 0.72,
          title: "Electronic Device",
          description: "Electronic device shown in the photo. Details unclear.",
          brand: null,
          condition: null,
          dominantColour: "Black",
          material: null,
          size: null,
          categorySlugs: ["electronics", "audio", "headphones"],
          attributes: {},
          defects: [],
          accessories: [],
        },
      ],
    };

    const result = buildResultFromVisionPayload(lowConfidencePayload, "vision");
    expect(result.lowConfidence).toBe(true);
    expect(result.autoSelected).toBe(false);
    expect(result.suggestions.titles).toHaveLength(1);
  });

  it("returns up to five suggestions from vision predictions", () => {
    const payload: VisionResponsePayload = {
      overallConfidence: 0.6,
      labels: ["shoe"],
      predictions: Array.from({ length: 5 }, (_, index) => ({
        confidence: 0.6 - index * 0.05,
        title: `Trainer Option ${index + 1}`,
        description: `Trainer listing suggestion ${index + 1} for testing.`,
        brand: index === 0 ? "Nike" : null,
        condition: "Good",
        dominantColour: "White",
        material: null,
        size: "UK 9",
        categorySlugs: ["shoes", "trainers", "nike"],
        attributes: {},
        defects: [],
        accessories: [],
      })),
    };

    const result = buildResultFromVisionPayload(payload, "vision");
    expect(result.predictions).toHaveLength(5);
    expect(result.suggestions.titles).toHaveLength(5);
    expect(result.suggestions.brands).toContain("Nike");
  });

  it("uses vision mock in test mode without OpenAI network calls", async () => {
    vi.stubEnv("AI_CAMERA_VISION_MOCK", "true");
    vi.stubEnv("OPENAI_API_KEY", "");

    const result = await analyzeImages([
      { buffer: Buffer.from("jpeg"), mimeType: "image/jpeg", fileName: "car-seat.jpg" },
    ]);

    expect(result.source).toBe("vision");
    expect(result.predictions.length).toBeGreaterThan(0);
  });

  it("falls back to filename heuristics when vision is unavailable", async () => {
    vi.stubEnv("AI_CAMERA_VISION_MOCK", "false");
    vi.stubEnv("OPENAI_API_KEY", "");

    const result = await analyzeImageBuffer(
      Buffer.from("image"),
      "maxi-cosi-car-seat-isofix.jpg",
    );

    expect(result.source).toBe("fallback");
    expect(result.lowConfidence).toBe(true);
    expect(result.autoSelected).toBe(false);
    expect(result.suggestions.categories.length).toBeGreaterThan(0);
  });

  it("filename fallback never exceeds 75% confidence", () => {
    const result = analyzeWithFilenameFallback("maxi-cosi-car-seat-isofix.jpg");
    expect(result.confidence).toBeLessThan(AI_CAMERA_CONFIDENCE_THRESHOLD);
    expect(result.lowConfidence).toBe(true);
  });
});

describe("sell listing validation", () => {
  it("requires core fields for quick listings", () => {
    const draft = createEmptyDraft();
    const errors = getListingValidationErrors(draft, { mode: "quick" });

    expect(errors.photos).toBeTruthy();
    expect(errors.title).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.category).toBeTruthy();
    expect(errors.condition).toBeTruthy();
    expect(errors.price).toBeTruthy();
    expect(errors.location).toBeTruthy();
    expect(isListingValid(draft, { mode: "quick" })).toBe(false);
  });

  it("enables save when all required fields are present", () => {
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
    draft.title = "Maxi-Cosi Car Seat";
    draft.description = "Selling a car seat in good condition.";
    draft.categoryPath = resolveCategoryPathBySlugs(["baby", "pushchairs", "travel-systems"]);
    draft.condition = "Good";
    draft.price = "120";
    draft.shippingMethod = "delivery_available";
    draft.locationCity = "Manchester";

    expect(getListingValidationErrors(draft, { mode: "quick" })).toEqual({});
    expect(isListingValid(draft, { mode: "quick" })).toBe(true);
  });

  it("does not expose sku or low stock fields on the draft", () => {
    const draft = createEmptyDraft();
    expect("sku" in draft).toBe(false);
    expect("lowStockAlert" in draft).toBe(false);
  });
});
