import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import type { MigrationRawListing } from "@/lib/seller/migration/engine/types";

export type InlinePreviewValidation = {
  externalId: string;
  valid: boolean;
  errors: Array<{ field: string; message: string; severity?: string }>;
};

export type InlineImportPreview = {
  totalRows: number;
  preview: MigrationRawListing[];
  validation: InlinePreviewValidation[];
  headers?: string[];
  sourceLabel?: string;
};

export type InlineImportPhase =
  | "idle"
  | "previewing"
  | "preview_ready"
  | "importing"
  | "success"
  | "error";

const FILE_PREVIEW_METHODS = new Set<MigrationImportMethodId>(["csv", "xlsx", "xml"]);
const URL_METHODS = new Set<MigrationImportMethodId>(["single_url", "multiple_urls", "store_import"]);

export function importMethodNeedsFilePreview(method: MigrationImportMethodId): boolean {
  return FILE_PREVIEW_METHODS.has(method);
}

export function importMethodNeedsUrlPreview(method: MigrationImportMethodId): boolean {
  return URL_METHODS.has(method);
}

export function resolvePreviewEndpoint(method: MigrationImportMethodId): string | null {
  if (method === "csv") return "/api/seller/migration/connectors/csv/preview";
  if (method === "xlsx") return "/api/seller/migration/connectors/xlsx/preview";
  if (method === "xml") return "/api/seller/migration/connectors/xml/preview";
  return null;
}

export function previewHasBlockingErrors(preview: InlineImportPreview | null): boolean {
  if (!preview) return false;
  return preview.validation.some((entry) => !entry.valid);
}

export function countPreviewIssues(preview: InlineImportPreview | null): {
  valid: number;
  invalid: number;
  total: number;
} {
  if (!preview) return { valid: 0, invalid: 0, total: 0 };
  const invalid = preview.validation.filter((entry) => !entry.valid).length;
  return {
    valid: preview.validation.length - invalid,
    invalid,
    total: preview.totalRows,
  };
}

export function buildUrlPreview(urls: string[]): InlineImportPreview | null {
  const trimmed = urls.map((url) => url.trim()).filter(Boolean);
  if (trimmed.length === 0) return null;

  const invalidUrls = trimmed.filter((url) => {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  });

  const preview: MigrationRawListing[] = trimmed.slice(0, 5).map((url, index) => ({
    externalId: `url-${index + 1}`,
    title: url.length > 72 ? `${url.slice(0, 69)}…` : url,
    price: 0,
    imageUrls: [],
  }));

  const validation: InlinePreviewValidation[] = trimmed.map((url, index) => {
    try {
      new URL(url);
      return { externalId: `url-${index + 1}`, valid: true, errors: [] };
    } catch {
      return {
        externalId: `url-${index + 1}`,
        valid: false,
        errors: [{ field: "url", message: "Invalid URL format." }],
      };
    }
  });

  return {
    totalRows: trimmed.length,
    preview,
    validation,
    sourceLabel: invalidUrls.length > 0 ? "Fix invalid URLs before importing." : `${trimmed.length} listing URL(s) ready`,
  };
}

export function buildOAuthReadyPreview(platformLabel: string): InlineImportPreview {
  return {
    totalRows: 0,
    preview: [],
    validation: [],
    sourceLabel: `Connected to ${platformLabel}. Listings will be fetched when you import.`,
  };
}
