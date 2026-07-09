import { describe, expect, it } from "vitest";
import {
  compareListingSimilarity,
  isDuplicateListing,
} from "@/lib/seller/migration/duplicate/fingerprint";
import { normalizeListing } from "@/lib/seller/migration/engine/normalizer";
import { listMigrationProviders } from "@/lib/seller/migration/providers/registry";
import {
  MIGRATION_IMPORT_METHODS,
  MIGRATION_PLATFORMS,
  MIGRATION_WIZARD_STEPS,
} from "@/lib/seller/migration/constants";
import { IMPORT_WIZARD_PATH, MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { buildPreviewItems } from "@/lib/seller/migration/preview";
import { MIGRATION_BATCH_SIZE } from "@/lib/seller/migration/engine/config";

describe("store migration module", () => {
  it("defines migration center route", () => {
    expect(MIGRATION_CENTER_PATH).toBe(IMPORT_WIZARD_PATH);
    expect(MIGRATION_CENTER_PATH).toBe("/account/bring-your-item");
  });

  it("lists supported platforms and import methods", () => {
    expect(MIGRATION_PLATFORMS.length).toBeGreaterThanOrEqual(25);
    expect(MIGRATION_IMPORT_METHODS.length).toBe(8);
    expect(MIGRATION_WIZARD_STEPS.length).toBe(3);
    expect(listMigrationProviders().length).toBeGreaterThanOrEqual(25);
  });

  it("builds preview items for the wizard", () => {
    const items = buildPreviewItems("eBay", "CSV");
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.status === "warning")).toBe(true);
  });

  it("uses safe batch sizing without artificial caps", () => {
    expect(MIGRATION_BATCH_SIZE).toBeGreaterThan(0);
    expect(MIGRATION_BATCH_SIZE).toBeLessThanOrEqual(100);
  });
});

describe("migration engine duplicate detection", () => {
  it("fingerprints listings from multiple attributes", () => {
    const a = normalizeListing({
      externalId: "1",
      title: "Nike Air Max 90",
      brand: "Nike",
      model: "Air Max 90",
      price: 120,
      sku: "SKU-1",
      imageUrls: ["https://example.com/a.jpg"],
    });
    const b = normalizeListing({
      externalId: "2",
      title: "Nike Air Max 90",
      brand: "Nike",
      model: "Air Max 90",
      price: 120,
      sku: "SKU-1",
      imageUrls: ["https://example.com/a.jpg"],
    });
    const c = normalizeListing({
      externalId: "3",
      title: "Adidas Samba",
      brand: "Adidas",
      price: 85,
    });

    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.fingerprint).not.toBe(c.fingerprint);
  });

  it("scores similarity across fields beyond title", () => {
    const base = {
      externalId: "1",
      title: "Phone",
      brand: "Samsung",
      model: "Galaxy S23",
      price: 499,
      sku: "S23-128",
    };
    const near = { ...base, title: "Different title", colour: undefined, size: undefined };
    const far = { externalId: "2", title: "Jacket", brand: "Zara", price: 40 };

    const nearScore = compareListingSimilarity(base, near);
    const farScore = compareListingSimilarity(base, far);
    expect(nearScore).toBeGreaterThan(farScore);
    expect(nearScore).toBeGreaterThan(0.75);
    expect(isDuplicateListing(farScore)).toBe(false);
    expect(isDuplicateListing(compareListingSimilarity(base, base))).toBe(true);
  });

  it("sanitizes normalized listing input", () => {
    const listing = normalizeListing({
      externalId: "x",
      title: "  Test <b>item</b>  ",
      price: -5,
      imageUrls: ["javascript:alert(1)", "https://example.com/ok.jpg"],
    });
    expect(listing.title).toBe("Test item");
    expect(listing.price).toBe(0);
    expect(listing.imageUrls).toEqual(["https://example.com/ok.jpg"]);
    expect(listing.warnings.length).toBeGreaterThan(0);
  });
});

describe("migration providers", () => {
  it("registers live API providers for eBay and Etsy", () => {
    const ebay = listMigrationProviders().find((p) => p.capabilities.id === "ebay");
    const etsy = listMigrationProviders().find((p) => p.capabilities.id === "etsy");
    expect(ebay?.capabilities.integrationStatus).toBe("api");
    expect(etsy?.capabilities.integrationStatus).toBe("api");
  });
});
