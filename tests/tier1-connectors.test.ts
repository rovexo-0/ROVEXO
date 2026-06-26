import { describe, expect, it } from "vitest";
import { normalizeShopifyStoreUrl } from "@/lib/seller/migration/connectors/api/shopify-client";
import { normalizeWooStoreUrl } from "@/lib/seller/migration/connectors/api/woocommerce-client";
import { createConnector } from "@/lib/seller/migration/connectors/factory";
import {
  detectCsvColumnMapping,
  pickMappedField,
} from "@/lib/seller/migration/connectors/file/csv-mapping";
import {
  countCsvRows,
  detectCsvDelimiter,
  listingsFromCsvContent,
  parseCsvContent,
  previewCsvContent,
} from "@/lib/seller/migration/connectors/file/csv-parser";

const COMMA_CSV = `title,price,description,image
"Blue Jacket",45.00,"Warm jacket","https://example.com/jacket.jpg"`;

const SEMICOLON_CSV = `title;price;description;image
"Red Shoes";29.99;"Running shoes";"https://example.com/shoes.jpg"`;

const EXTENDED_CSV = `product_name;amount;brand;ean;oem;mpn;category;photo
"Widget Pro";19.99;Acme;1234567890123;OEM-1;MPN-9;Tools;https://example.com/widget.jpg`;

describe("tier 1 connectors", () => {
  it("marks Shopify, WooCommerce and CSV as production integrations", () => {
    expect(createConnector("shopify").definition.integrationStatus).toBe("api");
    expect(createConnector("woocommerce").definition.integrationStatus).toBe("api");
    expect(createConnector("csv").definition.integrationStatus).toBe("file");
    expect(createConnector("shopify").definition.capabilities.apiImport).toBe(true);
    expect(createConnector("csv").definition.capabilities.fileImport).toBe(true);
  });

  it("normalizes Shopify and WooCommerce store URLs", () => {
    expect(normalizeShopifyStoreUrl("demo")).toBe("https://demo.myshopify.com");
    expect(normalizeShopifyStoreUrl("https://custom.example.com")).toBe("https://custom.example.com");
    expect(normalizeWooStoreUrl("shop.example.com")).toBe("https://shop.example.com");
  });

  it("detects CSV delimiters and headers", () => {
    expect(detectCsvDelimiter(COMMA_CSV)).toBe(",");
    expect(detectCsvDelimiter(SEMICOLON_CSV)).toBe(";");
    expect(parseCsvContent(SEMICOLON_CSV).rows).toHaveLength(1);
  });

  it("auto-detects extended CSV column mappings", () => {
    const parsed = parseCsvContent(EXTENDED_CSV);
    const mapping = detectCsvColumnMapping(parsed.headers);
    expect(mapping.title).toBe("product_name");
    expect(mapping.brand).toBe("brand");
    expect(mapping.ean).toBe("ean");
    expect(mapping.oem).toBe("oem");
    expect(mapping.mpn).toBe("mpn");
  });

  it("supports manual CSV remapping", () => {
    const parsed = parseCsvContent(EXTENDED_CSV);
    const customMapping = { title: "product_name", price: "amount", images: "photo" };
    const row = parsed.rows[0]!;
    expect(pickMappedField(row, customMapping, "title")).toBe("Widget Pro");
    expect(pickMappedField(row, customMapping, "price")).toBe("19.99");
  });

  it("imports CSV rows with OEM, MPN and EAN fields", () => {
    const listings = listingsFromCsvContent(EXTENDED_CSV, "csv", "csv", 0, 10);
    expect(listings).toHaveLength(1);
    expect(listings[0]?.brand).toBe("Acme");
    expect(listings[0]?.ean).toBe("1234567890123");
    expect(listings[0]?.attributes?.oem).toBe("OEM-1");
    expect(listings[0]?.attributes?.mpn).toBe("MPN-9");
  });

  it("previews CSV imports before migration", () => {
    const preview = previewCsvContent(COMMA_CSV, 1);
    expect(preview.rows.length).toBeGreaterThan(0);
    expect(preview.preview[0]?.title).toBe("Blue Jacket");
    expect(countCsvRows(COMMA_CSV)).toBe(1);
  });
});
