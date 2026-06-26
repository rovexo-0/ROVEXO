import type { MigrationInputPayload, MigrationRawListing } from "@/lib/seller/migration/engine/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import {
  detectFileColumnMapping,
  mergeFileColumnMapping,
  rowToListing,
  type FileColumnMapping,
} from "@/lib/seller/migration/connectors/file/field-mapping";

export type CsvDelimiter = "," | ";";
export type CsvColumnMapping = FileColumnMapping;

export function detectCsvDelimiter(content: string): CsvDelimiter {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim()) ?? "";
  if (!firstLine) return ",";

  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;

  for (let i = 0; i < firstLine.length; i += 1) {
    const char = firstLine[i];
    if (char === '"') {
      if (inQuotes && firstLine[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (char === ",") commas += 1;
      if (char === ";") semicolons += 1;
    }
  }

  return semicolons > commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export type ParsedCsvContent = {
  delimiter: CsvDelimiter;
  headers: string[];
  rows: Record<string, string>[];
  detectedMapping: FileColumnMapping;
};

export function parseCsvContent(content: string, delimiter?: CsvDelimiter): ParsedCsvContent {
  const resolvedDelimiter = delimiter ?? detectCsvDelimiter(content);
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { delimiter: resolvedDelimiter, headers: [], rows: [], detectedMapping: {} };
  }

  const headers = parseCsvLine(lines[0]!, resolvedDelimiter).map((header) =>
    header.replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"),
  );
  const detectedMapping = detectFileColumnMapping(headers);

  const rows = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line, resolvedDelimiter);
    const row: Record<string, string> = { _row: String(index) };
    headers.forEach((header, cellIndex) => {
      row[header] = (cells[cellIndex] ?? "").replace(/^"|"$/g, "");
    });
    return row;
  });

  return { delimiter: resolvedDelimiter, headers, rows, detectedMapping };
}

export const csvRowToListing = rowToListing;

export function listingsFromCsvContent(
  content: string,
  platform: MigrationPlatformId,
  importMethod: MigrationImportMethodId,
  offset: number,
  limit: number,
  mapping?: FileColumnMapping,
): MigrationRawListing[] {
  const parsed = parseCsvContent(content);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  return parsed.rows.slice(offset, offset + limit).map((row, index) =>
    rowToListing(row, platform, importMethod, offset + index, resolvedMapping),
  );
}

export function countCsvRows(content: string): number {
  return parseCsvContent(content).rows.length;
}

export function previewCsvContent(
  content: string,
  limit = 5,
  mapping?: FileColumnMapping,
): ParsedCsvContent & { preview: MigrationRawListing[] } {
  const parsed = parseCsvContent(content);
  const resolvedMapping = mergeFileColumnMapping(parsed.detectedMapping, mapping);
  const preview = parsed.rows.slice(0, limit).map((row, index) =>
    rowToListing(row, "csv", "csv", index, resolvedMapping),
  );
  return { ...parsed, detectedMapping: resolvedMapping, preview };
}

export function resolveFileContent(payload?: MigrationInputPayload): string | null {
  if (payload?.fileContent) return payload.fileContent;
  return null;
}

export { detectFileColumnMapping as detectCsvColumnMapping };
