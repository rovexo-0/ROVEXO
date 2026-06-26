import { describe, expect, it } from "vitest";
import {
  CONNECTOR_DEFINITIONS,
  getConnectorDefinition,
  listConnectorDefinitions,
} from "@/lib/seller/migration/connectors/definitions";
import { createConnector } from "@/lib/seller/migration/connectors/factory";
import {
  encryptCredentials,
  decryptCredentials,
} from "@/lib/seller/migration/connectors/credentials";
import {
  parseCsvContent,
  listingsFromCsvContent,
  countCsvRows,
} from "@/lib/seller/migration/connectors/file/csv-parser";
import { parseXmlItems, listingsFromXmlContent } from "@/lib/seller/migration/connectors/file/xml-parser";
import { listMigrationProviders } from "@/lib/seller/migration/providers/registry";
import { validationPipeline } from "@/lib/seller/migration/connectors/pipelines";

const SAMPLE_CSV = `title,price,description,image
"Blue Jacket",45.00,"Warm jacket","https://example.com/jacket.jpg"
"Red Shoes",29.99,"Running shoes","https://example.com/shoes.jpg"`;

const SAMPLE_XML = `<?xml version="1.0"?>
<feed>
  <item>
    <title>Camera</title>
    <price>120</price>
    <description>Vintage camera</description>
    <image>https://example.com/camera.jpg</image>
  </item>
</feed>`;

describe("universal connector framework", () => {
  it("registers all marketplace and file providers", () => {
    expect(CONNECTOR_DEFINITIONS.length).toBeGreaterThanOrEqual(30);
    expect(listConnectorDefinitions().length).toBe(CONNECTOR_DEFINITIONS.length);
    expect(listMigrationProviders().length).toBe(CONNECTOR_DEFINITIONS.length);
  });

  it("exposes capability flags on every provider", () => {
    for (const provider of listMigrationProviders()) {
      expect(provider.capabilities.capabilities).toBeDefined();
      expect(provider.capabilities.capabilities.bulkPublish).toBe(true);
      expect(provider.capabilities.capabilities.categoryMapping).toBe(true);
    }
  });

  it("creates connectors through the factory", () => {
    const csv = createConnector("csv");
    expect(csv.definition.integrationStatus).toBe("file");
    expect(csv.definition.capabilities.fileImport).toBe(true);

    const shopify = createConnector("shopify");
    expect(shopify.definition.integrationStatus).toBe("api");
    expect(shopify.definition.capabilities.apiImport).toBe(true);
  });

  it("encrypts and decrypts connector credentials", () => {
    const encrypted = encryptCredentials({
      storeUrl: "https://demo.myshopify.com",
      accessToken: "shpat_test_token",
    });
    const decrypted = decryptCredentials(encrypted);
    expect(decrypted?.storeUrl).toBe("https://demo.myshopify.com");
    expect(decrypted?.accessToken).toBe("shpat_test_token");
  });
});

describe("file connectors", () => {
  it("parses CSV rows into listings", () => {
    expect(countCsvRows(SAMPLE_CSV)).toBe(2);
    const rows = parseCsvContent(SAMPLE_CSV);
    expect(rows.rows[0]?.title).toBe("Blue Jacket");

    const listings = listingsFromCsvContent(SAMPLE_CSV, "csv", "csv", 0, 10);
    expect(listings).toHaveLength(2);
    expect(listings[0]?.title).toBe("Blue Jacket");
    expect(listings[0]?.price).toBe(45);
  });

  it("parses XML items into listings", () => {
    const items = parseXmlItems(SAMPLE_XML);
    expect(items).toHaveLength(1);
    const listings = listingsFromXmlContent(SAMPLE_XML, "xml", "xml", 0, 10);
    expect(listings[0]?.title).toBe("Camera");
    expect(listings[0]?.price).toBe(120);
  });

  it("validates parsed listings through the validation pipeline", () => {
    const listings = listingsFromCsvContent(SAMPLE_CSV, "csv", "csv", 0, 1);
    const result = validationPipeline.validateRaw(listings[0]!);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "category")).toBe(true);
  });
});

describe("connector definitions", () => {
  it("marks classifieds as stub integrations", () => {
    const vinted = getConnectorDefinition("vinted");
    expect(vinted.integrationStatus).toBe("stub");
    expect(vinted.capabilities.apiImport).toBe(false);

    const etsy = getConnectorDefinition("etsy");
    expect(etsy.integrationStatus).toBe("api");
  });

  it("marks ecommerce platforms with extended capabilities", () => {
    const shopify = getConnectorDefinition("shopify");
    expect(shopify.capabilities.inventorySync).toBe(true);
    expect(shopify.capabilities.priceSync).toBe(true);
  });
});
