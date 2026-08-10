import { describe, expect, it } from "vitest";
import { buildProductInformationRows } from "@/features/product-detail/build-product-information-rows";
import { PRODUCT_INFORMATION_FIELD_MAP_V1 } from "@/lib/product-detail/product-information-field-map-v1";
import {
  collectDescriptionAttributeStripLabelsV1,
  parseListingAttributeNotesV1,
  resolveProductInformationValuesV1,
  stripListingAttributeNotesFromDescriptionV1,
} from "@/lib/product-detail/parse-listing-attribute-notes-v1";
import {
  categoryAllowsSizeAttribute,
  orderedViewItemSchemaFields,
} from "@/lib/product-detail/view-item-attribute-engine-v1";
import type { ProductDetail } from "@/lib/products/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";
import type { CategoryBreadcrumb } from "@/lib/categories/navigation";

function crumbs(...parts: { name: string; slug: string }[]): CategoryBreadcrumb[] {
  return parts.map((part, index) => ({
    id: `c${index}`,
    name: part.name,
    slug: part.slug,
    href: `/category/${parts
      .slice(0, index + 1)
      .map((p) => p.slug)
      .join("/")}`,
  }));
}

function sampleProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "sample",
    title: "Sample",
    price: 10,
    condition: "New",
    brand: "Nike",
    sellerName: "Seller",
    sellerId: "s1",
    rating: 5,
    reviewCount: 1,
    imageUrl: "/x.jpg",
    sections: ["new"],
    images: ["/x.jpg"],
    description: "A clean description.",
    salesCount: 1,
    deliveryCarriers: ["Royal Mail"],
    stock: 1,
    availability: "in_stock",
    transactionMode: DEFAULT_TRANSACTION_MODE,
    categoryId: "c1",
    categoryBreadcrumbs: crumbs({ name: "Men's Fashion", slug: "mens-fashion" }, { name: "T-Shirts", slug: "t-shirts" }),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Product Information Attribute Engine v1.0", () => {
  it("keeps field map metadata for notes / aliases", () => {
    expect(PRODUCT_INFORMATION_FIELD_MAP_V1.map((f) => f.id)).toContain("size");
    expect(PRODUCT_INFORMATION_FIELD_MAP_V1.map((f) => f.id)).toContain("uploaded");
  });

  it("parses Material / Season Rating / Storage notes from description", () => {
    const notes = parseListingAttributeNotesV1(
      "Warm jacket. Material: Nylon. Season Rating: 4 Season. Storage: 128GB.",
    );
    expect(notes).toEqual({
      material: "Nylon",
      season: "4 Season",
      storage: "128GB",
    });
  });

  it("structured fields win over description notes", () => {
    const resolved = resolveProductInformationValuesV1({
      colour: "Black",
      material: null,
      size: "M",
      description: "Item. Material: Cotton. Colour: Red. Size: L.",
    });
    expect(resolved.colour).toBe("Black");
    expect(resolved.size).toBe("M");
    expect(resolved.material).toBe("Cotton");
  });

  it("Description presentation strips attribute notes without deleting DB values", () => {
    const raw =
      "Great phone for daily use. Brand: Apple. Storage: 128GB. Colour: Black. Condition: Good. Category: Electronics.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe("Great phone for daily use.");
    expect(display).not.toMatch(/Brand:/i);
    expect(display).not.toMatch(/Storage:/i);
    expect(display).not.toMatch(/Colour:/i);
    expect(display).not.toMatch(/Condition:/i);
    expect(display).not.toMatch(/Category:/i);
    expect(raw).toContain("Brand: Apple");
  });

  it("Description strips Model note (Sell formatAttributeNote) — free text preserved", () => {
    const raw = "Smartphone iphone 14 pro max Model: Iphone14 pro max.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe("Smartphone iphone 14 pro max.");
    expect(display).not.toMatch(/Model:/i);
    expect(raw).toContain("Model: Iphone14 pro max");
  });

  it("Description strips Brand / Storage / Colour|Color / Condition / Category notes", () => {
    const raw =
      "Daily driver. Brand: Samsung. Storage: 256GB. Color: Graphite. Condition: Excellent. Category: Electronics.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe("Daily driver.");
    expect(display).not.toMatch(/Brand:|Storage:|Color:|Condition:|Category:/i);
    expect(raw).toContain("Brand: Samsung");
  });

  it("Description strips Style / Gender / Capacity / Compatible With (Sell ATTRIBUTE_DEFS labels)", () => {
    const raw =
      "Nice accessory. Style: Casual. Gender: Unisex. Capacity: 64GB. Compatible With: iPhone 14.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe("Nice accessory.");
    expect(display).not.toMatch(/Style:|Gender:|Capacity:|Compatible With:/i);
  });

  it("preserves legitimate free-text that mentions product words without Label: value. notes", () => {
    const raw =
      "This iPhone 14 Pro Max is in great condition. Battery health is excellent and the model feels solid.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe(raw);
    expect(display).toContain("iPhone 14 Pro Max");
    expect(display).toContain("condition");
    expect(display).toContain("model feels solid");
  });

  it("strip label set includes Model from Sell ATTRIBUTE_DEFS (not Model-only hardcode)", () => {
    const labels = collectDescriptionAttributeStripLabelsV1();
    expect(labels).toContain("Model");
    expect(labels).toContain("Brand");
    expect(labels).toContain("Storage");
    expect(labels).toContain("Colour");
    expect(labels).toContain("Color");
    expect(labels).toContain("Condition");
    expect(labels).toContain("Category");
    expect(labels).toContain("Material (recommended)");
    expect(labels.length).toBeGreaterThan(15);
  });

  it("attribute rows still resolve Storage from notes after Description strip (DB raw untouched)", () => {
    const raw = "Phone body text. Storage: 128GB. Model: Iphone14 pro max.";
    const display = stripListingAttributeNotesFromDescriptionV1(raw);
    expect(display).toBe("Phone body text.");
    const resolved = resolveProductInformationValuesV1({ description: raw });
    expect(resolved.storage).toBe("128GB");
    expect(raw).toContain("Model: Iphone14 pro max");
  });

  it("Camping — Size hidden even when orphan size is stored", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "M",
        colour: "Green",
        material: "Nylon",
        categoryBreadcrumbs: crumbs(
          { name: "Sports & Outdoors", slug: "sports-outdoors" },
          { name: "Camping", slug: "camping" },
          { name: "Camping Accessories", slug: "camping-accessories" },
        ),
      }),
    );
    expect(categoryAllowsSizeAttribute("camping-accessories")).toBe(false);
    expect(rows.some((r) => r.id === "size")).toBe(false);
    expect(rows.map((r) => r.id)).toEqual(["category", "brand", "condition", "colour", "uploaded"]);
  });

  it("Shoes — Size visible when populated", () => {
    expect(categoryAllowsSizeAttribute("trainers")).toBe(true);
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "UK 10 (EU 43)",
        colour: "Black",
        categoryBreadcrumbs: crumbs(
          { name: "Men's Fashion", slug: "mens-fashion" },
          { name: "Shoes", slug: "shoes" },
          { name: "Trainers", slug: "trainers" },
        ),
      }),
    );
    expect(rows.some((r) => r.id === "size")).toBe(true);
    expect(rows.find((r) => r.id === "size")?.value).toBe("UK 10 (EU 43)");
  });

  it("Clothing — Size visible", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "XL (UK 12 • EU 40)",
        material: "Cotton",
        colour: "Orange",
      }),
    );
    expect(rows.some((r) => r.id === "size")).toBe(true);
    expect(rows.find((r) => r.id === "material")?.value).toBe("Cotton");
  });

  it("Jewellery rings — Ring Size label", () => {
    const fields = orderedViewItemSchemaFields("rings");
    expect(fields.find((f) => f.fieldId === "size")?.label).toBe("Ring Size");
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "L",
        material: "Gold",
        categoryBreadcrumbs: crumbs(
          { name: "Designer", slug: "designer" },
          { name: "Jewellery", slug: "jewellery" },
          { name: "Rings", slug: "rings" },
        ),
      }),
    );
    expect(rows.find((r) => r.id === "size")?.label).toBe("Ring Size");
  });

  it("Helmets — Helmet Size label when size present", () => {
    const fields = orderedViewItemSchemaFields("helmets");
    expect(fields.find((f) => f.fieldId === "size")?.label).toBe("Helmet Size");
  });

  it("omits empty Material and Colour", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        colour: null,
        material: null,
        size: null,
        description: "Basic item without notes.",
      }),
    );
    expect(rows.map((r) => r.id)).toEqual(["category", "brand", "condition", "uploaded"]);
  });

  it("Phone — Storage visible; Size hidden", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "M",
        storage: "256GB",
        colour: "Silver",
        categoryBreadcrumbs: crumbs(
          { name: "Electronics", slug: "electronics" },
          { name: "Phones", slug: "phones" },
          { name: "Smartphones", slug: "smartphones" },
        ),
      }),
    );
    expect(rows.some((r) => r.id === "size")).toBe(false);
    expect(rows.find((r) => r.id === "storage")?.value).toBe("256GB");
  });

  it("Sleeping bag — Season from notes; Size hidden", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "L",
        colour: "Silver",
        material: null,
        description: "BISINNA Sleeping Bag. Season Rating: 4 Season. Material: Down.",
        categoryBreadcrumbs: crumbs(
          { name: "Sports & Outdoors", slug: "sports-outdoors" },
          { name: "Camping", slug: "camping" },
          { name: "Sleeping Bags", slug: "sleeping-bags" },
        ),
      }),
    );
    expect(rows.some((r) => r.id === "size")).toBe(false);
    expect(rows.find((r) => r.id === "season")?.value).toBe("4 Season");
    // campingSleepingBag schema has no material — hide orphan Material note
    expect(rows.some((r) => r.id === "material")).toBe(false);
  });

  it("never inserts blank placeholder rows", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        brand: "  ",
        material: "",
        colour: undefined,
        size: null,
      }),
    );
    expect(rows.every((r) => r.value.trim().length > 0)).toBe(true);
    expect(rows.some((r) => r.id === "brand")).toBe(false);
    expect(rows.some((r) => r.id === "material")).toBe(false);
  });
});
