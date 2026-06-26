import { XMLParser } from "fast-xml-parser";
import type { MigrationInputPayload, MigrationRawListing } from "@/lib/seller/migration/engine/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import { resolveTextContent } from "@/lib/seller/migration/connectors/file/file-buffer";
import {
  detectFileColumnMapping,
  mergeFileColumnMapping,
  rowToListing,
  type FileColumnMapping,
} from "@/lib/seller/migration/connectors/file/field-mapping";

const PRODUCT_KEYS = new Set([
  "item",
  "product",
  "entry",
  "offer",
  "listing",
  "record",
]);

function flattenValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return flattenValue(value[0]);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("#text" in record) return flattenValue(record["#text"]);
    if ("_text" in record) return flattenValue(record._text);
    const first = Object.values(record)[0];
    return flattenValue(first);
  }
  return "";
}

function collectImageUrls(node: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const imageKeys = ["image", "image_link", "imageurl", "img", "photo", "picture", "gallery"];

  for (const key of imageKeys) {
    const value = node[key] ?? node[key.toUpperCase()];
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) urls.push(flattenValue(item));
    } else {
      urls.push(flattenValue(value));
    }
  }

  const imagesNode = node.images ?? node.Images;
  if (imagesNode && typeof imagesNode === "object") {
    const imageList = (imagesNode as Record<string, unknown>).image;
    if (Array.isArray(imageList)) {
      for (const item of imageList) urls.push(flattenValue(item));
    } else if (imageList) {
      urls.push(flattenValue(imageList));
    }
  }

  return urls.filter((url) => url.startsWith("http"));
}

function nodeToRow(node: Record<string, unknown>, index: number): Record<string, string> {
  const row: Record<string, string> = { _row: String(index) };

  const assign = (key: string, ...aliases: string[]) => {
    for (const alias of aliases) {
      const value = node[alias] ?? node[alias.toLowerCase()] ?? node[alias.toUpperCase()];
      if (value != null && value !== "") {
        row[key] = flattenValue(value);
        return;
      }
    }
  };

  assign("title", "title", "name", "product_name");
  assign("description", "description", "body_html", "summary");
  assign("price", "price", "amount", "regular_price");
  assign("sale_price", "sale_price", "special_price");
  assign("brand", "brand", "vendor", "manufacturer");
  assign("condition", "condition");
  assign("sku", "sku", "id", "g:id");
  assign("category", "category", "product_type", "type");
  assign("quantity", "quantity", "stock", "inventory_quantity", "g:quantity");
  assign("ean", "ean", "gtin", "barcode", "g:gtin");
  assign("mpn", "mpn", "g:mpn");
  assign("oem", "oem");
  assign("weight", "weight", "g:shipping_weight");
  assign("attributes", "attributes");

  const images = collectImageUrls(node);
  if (images.length) row.images = images.join("|");

  const variants = node.variants ?? node.Variants;
  if (variants) row.variants = flattenValue(variants);

  return row;
}

function findProductNodes(value: unknown, results: Record<string, unknown>[]): void {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) findProductNodes(item, results);
    return;
  }

  if (typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    const normalizedKey = key.replace(/^.*:/, "").toLowerCase();
    if (PRODUCT_KEYS.has(normalizedKey)) {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object") results.push(item as Record<string, unknown>);
        }
      } else if (child && typeof child === "object") {
        results.push(child as Record<string, unknown>);
      }
      continue;
    }
    findProductNodes(child, results);
  }
}

export type ParsedXmlContent = {
  encoding: string;
  headers: string[];
  rows: Record<string, string>[];
  detectedMapping: FileColumnMapping;
};

export function parseXmlContent(content: string): ParsedXmlContent {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    attributeNamePrefix: "",
    trimValues: true,
    parseTagValue: true,
    isArray: (name) => PRODUCT_KEYS.has(name.toLowerCase()),
  });

  const parsed = parser.parse(content);
  const productNodes: Record<string, unknown>[] = [];
  findProductNodes(parsed, productNodes);

  const rows = productNodes
    .map((node, index) => nodeToRow(node, index))
    .filter((row) => row.title?.trim());

  const headers = rows.length
    ? Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "_row"))))
    : [];

  return {
    encoding: "utf-8",
    headers,
    rows,
    detectedMapping: detectFileColumnMapping(headers),
  };
}

export function listingsFromXmlContent(
  content: string,
  platform: MigrationPlatformId,
  importMethod: MigrationImportMethodId,
  offset: number,
  limit: number,
  mapping?: FileColumnMapping,
): MigrationRawListing[] {
  const parsed = parseXmlContent(content);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  return parsed.rows.slice(offset, offset + limit).map((row, index) =>
    rowToListing(row, platform, importMethod, offset + index, resolvedMapping),
  );
}

export function countXmlItems(content: string): number {
  return parseXmlContent(content).rows.length;
}

export function previewXmlContent(
  content: string,
  limit = 5,
  mapping?: FileColumnMapping,
): ParsedXmlContent & { preview: MigrationRawListing[] } {
  const parsed = parseXmlContent(content);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  const preview = parsed.rows.slice(0, limit).map((row, index) =>
    rowToListing(row, "xml", "xml", index, resolvedMapping),
  );
  return { ...parsed, detectedMapping: resolvedMapping, preview };
}

export function resolveXmlContent(payload?: MigrationInputPayload): string | null {
  return resolveTextContent(payload);
}

export function parseXmlItems(content: string): Record<string, string>[] {
  return parseXmlContent(content).rows;
}

export type { FileColumnMapping };
