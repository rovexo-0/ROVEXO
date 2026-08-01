import { describe, expect, it } from "vitest";
import {
  assertConditionPresentationCoverage,
  brandLogoUrl,
  brandMonogram,
  COLOUR_POPULAR_IDS,
  conditionDescription,
  enrichPickerOption,
  materialGlyphKey,
  PARCEL_CARD_PRESENTATION,
  resolveSellPickerVisualKind,
} from "@/features/sell/ui/sell-picker-presentation-v1";

describe("sell-picker-presentation-v1", () => {
  it("covers quick condition copy", () => {
    expect(assertConditionPresentationCoverage()).toBe(true);
    expect(conditionDescription("Excellent")).toBe("Minimal signs of wear");
    expect(conditionDescription("Fair")).toBe("Visible signs of wear, still usable");
  });

  it("resolves visual kinds from attribute ids", () => {
    expect(resolveSellPickerVisualKind("brand", "Brand")).toBe("brand");
    expect(resolveSellPickerVisualKind("material", "Material")).toBe("material");
    expect(resolveSellPickerVisualKind("condition", "Condition")).toBe("condition");
    expect(resolveSellPickerVisualKind("colour", "Colour")).toBe("colour");
  });

  it("maps popular brand logos and monogram fallback", () => {
    expect(brandLogoUrl("Nike")).toContain("nike.com");
    expect(brandLogoUrl("Unknown Brand XYZ")).toBeNull();
    expect(brandMonogram("Nike")).toBe("NI");
    expect(brandMonogram("The North Face")).toBe("TN");
  });

  it("maps material glyph keys", () => {
    expect(materialGlyphKey("Cotton")).toBe("cotton");
    expect(materialGlyphKey("Leather")).toBe("leather");
    expect(materialGlyphKey("Denim")).toBe("denim");
  });

  it("enriches without changing option id/label", () => {
    const base = { id: "cotton", label: "Cotton" };
    const enriched = enrichPickerOption("material", base);
    expect(enriched.id).toBe("cotton");
    expect(enriched.label).toBe("Cotton");
    expect(enriched.materialKey).toBe("cotton");
  });

  it("exposes colour popular ids and parcel card presentation", () => {
    expect(COLOUR_POPULAR_IDS).toContain("Red");
    expect(COLOUR_POPULAR_IDS).toContain("Other");
    expect(PARCEL_CARD_PRESENTATION.medium.weight).toMatch(/2/);
    expect(PARCEL_CARD_PRESENTATION.xl.title).toBe("Extra Large");
  });

  it("maps Owner-requested brand logo domains", () => {
    for (const brand of [
      "Nike",
      "Adidas",
      "Puma",
      "New Balance",
      "Converse",
      "Vans",
      "Reebok",
      "Under Armour",
      "The North Face",
      "Levi's",
      "H&M",
      "Zara",
      "Primark",
      "Apple",
      "Samsung",
      "Sony",
      "IKEA",
      "Gucci",
      "Louis Vuitton",
      "Chanel",
      "Dior",
      "Rolex",
      "Casio",
      "Bosch",
      "Makita",
      "DeWalt",
      "LEGO",
      "Canon",
      "Nikon",
      "Microsoft",
      "Logitech",
    ]) {
      expect(brandLogoUrl(brand), brand).toBeTruthy();
    }
  });
});
