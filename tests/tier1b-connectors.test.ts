import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  detectFileColumnMapping,
  rowToListing,
} from "@/lib/seller/migration/connectors/file/field-mapping";
import {
  countXmlItems,
  listingsFromXmlContent,
  parseXmlContent,
  previewXmlContent,
} from "@/lib/seller/migration/connectors/file/xml-parser";
import {
  countXlsxRows,
  listingsFromXlsxContent,
  parseXlsxBuffer,
  previewXlsxContent,
} from "@/lib/seller/migration/connectors/file/xlsx-parser";
import { isValidImageUrl } from "@/lib/seller/migration/images/downloader";
import { buildMigrationImageVariantPath } from "@/lib/seller/migration/images/config";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <product>
    <title>Camera Lens</title>
    <description>Professional lens</description>
    <price>120.00</price>
    <brand>OpticPro</brand>
    <sku>LENS-001</sku>
    <category>Photography</category>
    <quantity>3</quantity>
    <image>https://example.com/lens.jpg</image>
    <variants>
      <variant>
        <title>50mm</title>
        <price>120</price>
      </variant>
    </variants>
  </product>
</feed>`;

function buildSampleXlsxBuffer(): Buffer {
  const workbook = XLSX.utils.book_new();
  const rows = [
    ["product_name", "amount", "brand", "ean", "photo"],
    ["Widget Pro", "19.99", "Acme", "1234567890123", "https://example.com/widget.jpg"],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

describe("tier 1b connectors", () => {
  it("parses nested XML products with variants and images", () => {
    const parsed = parseXmlContent(SAMPLE_XML);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.title).toBe("Camera Lens");
    expect(parsed.detectedMapping.title).toBe("title");

    const listings = listingsFromXmlContent(SAMPLE_XML, "xml", "xml", 0, 10);
    expect(listings[0]?.title).toBe("Camera Lens");
    expect(listings[0]?.imageUrls?.[0]).toContain("lens.jpg");
    expect(listings[0]?.attributes?.variants).toBeTruthy();
    expect(countXmlItems(SAMPLE_XML)).toBe(1);
  });

  it("previews XML imports", () => {
    const preview = previewXmlContent(SAMPLE_XML, 1);
    expect(preview.preview[0]?.brand).toBe("OpticPro");
  });

  it("parses binary XLSX workbooks with worksheet detection", () => {
    const buffer = buildSampleXlsxBuffer();
    const parsed = parseXlsxBuffer(buffer);
    expect(parsed.worksheet).toBe("Products");
    expect(parsed.rows).toHaveLength(1);
    expect(detectFileColumnMapping(parsed.headers).title).toBe("product_name");

    const listings = listingsFromXlsxContent(buffer, "xlsx", "xlsx", 0, 10);
    expect(listings[0]?.title).toBe("Widget Pro");
    expect(listings[0]?.ean).toBe("1234567890123");
    expect(countXlsxRows(buffer)).toBe(1);
  });

  it("previews XLSX imports with worksheet list", () => {
    const buffer = buildSampleXlsxBuffer();
    const preview = previewXlsxContent(buffer, 1);
    expect(preview.worksheets).toContain("Products");
    expect(preview.preview[0]?.brand).toBe("Acme");
  });

  it("maps extended file fields through rowToListing", () => {
    const row = {
      _row: "0",
      product_name: "Brake Pad",
      sale_price: "44.99",
      oem: "OEM-44",
      mpn: "MPN-9",
      gallery: "https://example.com/a.jpg|https://example.com/b.jpg",
    };
    const listing = rowToListing(row, "csv", "csv", 0, {
      title: "product_name",
      salePrice: "sale_price",
      oem: "oem",
      mpn: "mpn",
      gallery: "gallery",
    });
    expect(listing.title).toBe("Brake Pad");
    expect(listing.price).toBe(44.99);
    expect(listing.attributes?.oem).toBe("OEM-44");
    expect(listing.imageUrls).toHaveLength(2);
  });

  it("defines migration image storage paths", () => {
    const path = buildMigrationImageVariantPath("seller-1", "listing-1", "thumbnail", "abc.webp");
    expect(path).toBe("seller-1/migration/listing-1/thumbnail/abc.webp");
    expect(isValidImageUrl("https://example.com/a.jpg")).toBe(true);
    expect(isValidImageUrl("ftp://bad")).toBe(false);
  });
});
