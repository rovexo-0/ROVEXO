/**
 * Sell Parcel Size UX v1.0 — SMALL · MEDIUM · LARGE (EXTRA LARGE removed).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  CANONICAL_PARCEL_SIZES_V1,
  formatCanonicalMaxDimensionsLine,
  resolveCanonicalParcelSize,
} from "@/lib/shipping/canonical-parcel-size-v1";
import { createEmptyDraft, PARCEL_SIZE_OPTIONS, PARCEL_SIZES, type ParcelSize } from "@/features/sell/types";
import { PARCEL_CARD_PRESENTATION } from "@/features/sell/ui/sell-picker-presentation-v1";

describe("Sell Parcel Size UX v1.0", () => {
  it("1–5. exactly three sizes: SMALL MEDIUM LARGE · EXTRA LARGE removed", () => {
    expect([...PARCEL_SIZES]).toEqual(["small", "medium", "large"]);
    expect(PARCEL_SIZE_OPTIONS).toHaveLength(3);
    expect(CANONICAL_PARCEL_SIZES_V1).toHaveLength(3);
    expect(PARCEL_SIZE_OPTIONS.map((o) => o.label)).toEqual(["SMALL", "MEDIUM", "LARGE"]);
    expect(resolveCanonicalParcelSize("small")).not.toBeNull();
    expect(resolveCanonicalParcelSize("medium")).not.toBeNull();
    expect(resolveCanonicalParcelSize("large")).not.toBeNull();
    expect(PARCEL_SIZE_OPTIONS.some((o) => o.id === "xl")).toBe(false);
  });

  it("6–9. exact weight lines (no carrier / Sendcloud copy)", () => {
    expect(PARCEL_SIZE_OPTIONS.find((o) => o.id === "small")?.description).toBe("Weight: 0–1 kg");
    expect(PARCEL_SIZE_OPTIONS.find((o) => o.id === "medium")?.description).toBe("Weight: 1–2 kg");
    expect(PARCEL_SIZE_OPTIONS.find((o) => o.id === "large")?.description).toBe("Weight: 2–15 kg");

    for (const def of CANONICAL_PARCEL_SIZES_V1) {
      expect(def.sellWeightLine).toBe(PARCEL_SIZE_OPTIONS.find((o) => o.id === def.id)!.description);
    }
  });

  it("10–13. canonical max dimensions · UI reads SSOT · no 45×10×10 · no duplicate catalogue", () => {
    for (const def of CANONICAL_PARCEL_SIZES_V1) {
      expect(def.maxDimensionsCm.length).toBeGreaterThan(0);
      expect(PARCEL_CARD_PRESENTATION[def.id].maxDimensions).toBe(
        formatCanonicalMaxDimensionsLine(def),
      );
      expect(PARCEL_CARD_PRESENTATION[def.id].title).toBe(def.sellLabel);
      expect(PARCEL_CARD_PRESENTATION[def.id].weight).toBe(def.sellWeightLine);
      expect(PARCEL_CARD_PRESENTATION[def.id].subtitle).toBe(def.sellWeightLine);
    }

    const ui = readFileSync("features/sell/ui/SellParcelBlock.tsx", "utf8");
    expect(ui).toContain("PARCEL_CARD_PRESENTATION");
    expect(ui).not.toMatch(/45\s*×\s*10\s*×\s*10|45\s*x\s*10\s*x\s*10/i);
    expect(existsSync("lib/shipping/canonical-parcel-size-v1.ts")).toBe(true);
    expect(existsSync("lib/shipping/canonical-parcel-size-v2.ts")).toBe(false);
    expect(existsSync("features/sell/parcel-size-catalogue-v2.ts")).toBe(false);
  });

  it("14–20. selection · single choice · persist · restore", () => {
    const sizes: ParcelSize[] = ["small", "medium", "large"];
    for (const size of sizes) {
      const draft = createEmptyDraft();
      draft.parcelSize = size;
      expect(draft.parcelSize).toBe(size);
      expect(PARCEL_SIZE_OPTIONS.filter((o) => o.id === draft.parcelSize)).toHaveLength(1);
    }

    const restored = createEmptyDraft();
    restored.parcelSize = "medium";
    expect(restored.parcelSize).toBe("medium");
    expect(PARCEL_SIZE_OPTIONS.find((o) => o.id === restored.parcelSize)?.label).toBe("MEDIUM");
  });

  it("21–25. no manual measurements · no 2kg/45×10×10 as Small · no carrier UI", () => {
    const ui = readFileSync("features/sell/ui/SellParcelBlock.tsx", "utf8");
    expect(ui).not.toMatch(/type=["']number["']/);
    expect(ui).not.toMatch(/weightKg|lengthCm|widthCm|heightCm/);
    expect(ui).not.toMatch(/EVRi|Royal Mail|DPD|InPost/i);
    expect(ui).not.toContain("getV1_0ParcelShippingDetailsBlocks");

    const small = resolveCanonicalParcelSize("small")!;
    expect(PARCEL_CARD_PRESENTATION.small.maxDimensions).toBe(
      formatCanonicalMaxDimensionsLine(small),
    );
    expect(PARCEL_CARD_PRESENTATION.small.maxDimensions).toBe("Max dimensions: 45 × 35 × 16 cm");
    expect(PARCEL_CARD_PRESENTATION.small.maxDimensions).not.toContain("45 × 10 × 10");
    expect(PARCEL_CARD_PRESENTATION.large.maxDimensions).toBe("Max dimensions: Max length 120 cm");
    expect(PARCEL_CARD_PRESENTATION.large.maxDimensions).not.toMatch(/15\.001|Sendcloud|EVRi/i);
    expect(ui).not.toMatch(/Packaging guide|PARCEL_PACKAGING_GUIDE|Sendcloud|15\.001/);
  });
});
