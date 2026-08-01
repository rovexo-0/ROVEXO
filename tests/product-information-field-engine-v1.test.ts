import { describe, expect, it } from "vitest";
import { buildProductInformationRows } from "@/features/product-detail/build-product-information-rows";
import { PRODUCT_INFORMATION_FIELD_MAP_V1 } from "@/lib/product-detail/product-information-field-map-v1";
import {
  parseListingAttributeNotesV1,
  resolveProductInformationValuesV1,
} from "@/lib/product-detail/parse-listing-attribute-notes-v1";
import type { ProductDetail } from "@/lib/products/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";

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
    categoryBreadcrumbs: [{ id: "c1", name: "Fashion", slug: "fashion" }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Product Information dynamic field engine", () => {
  it("locks configurable field map order", () => {
    expect(PRODUCT_INFORMATION_FIELD_MAP_V1.map((f) => f.id)).toEqual([
      "category",
      "brand",
      "condition",
      "material",
      "colour",
      "size",
      "storage",
      "network",
      "compatibility",
      "season",
      "uploaded",
    ]);
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

  it("Product A — all core fields present, no empty rows, no stock row", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        colour: "Black",
        material: "Cotton",
        description: "Nice tee.",
      }),
    );
    expect(rows.map((r) => r.id)).toEqual([
      "category",
      "brand",
      "condition",
      "material",
      "colour",
      "uploaded",
    ]);
    expect(rows.some((r) => r.id === "stock")).toBe(false);
  });

  it("Product B — omits empty Material and Colour", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        colour: null,
        material: null,
        description: "Basic item without notes.",
      }),
    );
    expect(rows.map((r) => r.id)).toEqual(["category", "brand", "condition", "uploaded"]);
  });

  it("Product C — Material + Colour without empty Condition gap when condition set", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        brand: "Adidas",
        material: "Leather",
        colour: "Brown",
      }),
    );
    expect(rows.map((r) => r.id)).toEqual([
      "category",
      "brand",
      "condition",
      "material",
      "colour",
      "uploaded",
    ]);
  });

  it("renders Size Storage Network Season Compatibility when populated", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        size: "42",
        storage: "256GB",
        network: "Unlocked",
        season: "4 Season",
        compatibility: "iPhone 15",
      }),
    );
    expect(rows.map((r) => r.id)).toEqual([
      "category",
      "brand",
      "condition",
      "size",
      "storage",
      "network",
      "compatibility",
      "season",
      "uploaded",
    ]);
  });

  it("recovers Material and Season from Sell publish description notes", () => {
    const rows = buildProductInformationRows(
      sampleProduct({
        colour: "Silver",
        material: null,
        description:
          "BISINNA Sleeping Bag. Backpacking Season Rating: 4 Season. Material: Down.",
      }),
    );
    expect(rows.find((r) => r.id === "material")?.value).toBe("Down");
    expect(rows.find((r) => r.id === "season")?.value).toBe("4 Season");
    expect(rows.find((r) => r.id === "colour")?.value).toBe("Silver");
    expect(rows.some((r) => r.id === "stock")).toBe(false);
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
