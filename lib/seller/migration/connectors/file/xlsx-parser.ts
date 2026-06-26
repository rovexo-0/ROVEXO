import * as XLSX from "xlsx";
import type { MigrationInputPayload, MigrationRawListing } from "@/lib/seller/migration/engine/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import { resolveFileBuffer } from "@/lib/seller/migration/connectors/file/file-buffer";
import {
  detectFileColumnMapping,
  mergeFileColumnMapping,
  normalizeFieldHeader,
  rowToListing,
  type FileColumnMapping,
} from "@/lib/seller/migration/connectors/file/field-mapping";

export type ParsedXlsxContent = {
  worksheet: string;
  headers: string[];
  rows: Record<string, string>[];
  detectedMapping: FileColumnMapping;
};

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, string>[] {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number | boolean | null)[][];

  if (matrix.length < 2) return [];

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((cell) => normalizeFieldHeader(String(cell ?? "")));
  const rows: Record<string, string>[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const cells = matrix[index] ?? [];
    const row: Record<string, string> = { _row: String(index - 1) };
    let hasValue = false;

    headers.forEach((header, cellIndex) => {
      if (!header) return;
      const value = String(cells[cellIndex] ?? "").trim();
      if (value) hasValue = true;
      row[header] = value;
    });

    if (hasValue) rows.push(row);
  }

  return rows;
}

function detectBestWorksheet(workbook: XLSX.WorkBook): string {
  let bestSheet = workbook.SheetNames[0] ?? "";
  let bestScore = -1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = sheetToRows(sheet);
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const mapping = detectFileColumnMapping(headers);
    const score = Object.keys(mapping).length * 10 + rows.length;
    if (score > bestScore) {
      bestScore = score;
      bestSheet = sheetName;
    }
  }

  return bestSheet;
}

export function parseXlsxBuffer(buffer: Buffer, worksheetName?: string): ParsedXlsxContent {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const worksheet = worksheetName ?? detectBestWorksheet(workbook);
  const sheet = workbook.Sheets[worksheet] ?? workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows = sheetToRows(sheet);
  const headers = rows.length
    ? Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "_row"))))
    : [];

  return {
    worksheet,
    headers,
    rows,
    detectedMapping: detectFileColumnMapping(headers),
  };
}

export function listingsFromXlsxContent(
  content: string | Buffer,
  platform: MigrationPlatformId,
  importMethod: MigrationImportMethodId,
  offset: number,
  limit: number,
  mapping?: FileColumnMapping,
  worksheetName?: string,
): MigrationRawListing[] {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const parsed = parseXlsxBuffer(buffer, worksheetName);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  return parsed.rows.slice(offset, offset + limit).map((row, index) =>
    rowToListing(row, platform, importMethod, offset + index, resolvedMapping),
  );
}

export function countXlsxRows(content: string | Buffer, worksheetName?: string): number {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  return parseXlsxBuffer(buffer, worksheetName).rows.length;
}

export function previewXlsxContent(
  content: string | Buffer,
  limit = 5,
  mapping?: FileColumnMapping,
  worksheetName?: string,
): ParsedXlsxContent & { preview: MigrationRawListing[]; worksheets: string[] } {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parsed = parseXlsxBuffer(buffer, worksheetName);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  const preview = parsed.rows.slice(0, limit).map((row, index) =>
    rowToListing(row, "xlsx", "xlsx", index, resolvedMapping),
  );

  return {
    ...parsed,
    worksheets: workbook.SheetNames,
    detectedMapping: resolvedMapping,
    preview,
  };
}

export function resolveXlsxBuffer(payload?: MigrationInputPayload): Buffer | null {
  return resolveFileBuffer(payload);
}

/** Legacy TSV/CSV-like fallback for plain-text uploads. */
export function parseXlsxLikeContent(content: string): Record<string, string>[] {
  const delimiter = content.includes("\t") ? "\t" : ",";
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0]!
    .split(delimiter)
    .map((header) => normalizeFieldHeader(header));

  return lines.slice(1).map((line, index) => {
    const cells = line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, "").trim());
    const row: Record<string, string> = { _row: String(index) };
    headers.forEach((header, cellIndex) => {
      if (header) row[header] = cells[cellIndex] ?? "";
    });
    return row;
  });
}

export type { FileColumnMapping };
