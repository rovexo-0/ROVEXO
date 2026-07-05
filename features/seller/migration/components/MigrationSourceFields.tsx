"use client";

import type { MigrationImportMethodId } from "@/lib/seller/migration/types";

export type MigrationSourceInput = {
  storeUrl: string;
  sourceUrls: string;
  fileName: string | null;
  fileContent: string | null;
  fileEncoding?: "utf8" | "base64";
};

type MigrationSourceFieldsProps = {
  importMethod: MigrationImportMethodId | null;
  value: MigrationSourceInput;
  onChange: (patch: Partial<MigrationSourceInput>) => void;
};

const FILE_METHODS = new Set<MigrationImportMethodId>(["csv", "xlsx", "xml", "bulk_import"]);
const URL_METHODS = new Set<MigrationImportMethodId>(["single_url", "multiple_urls", "store_import"]);

export function MigrationSourceFields({ importMethod, value, onChange }: MigrationSourceFieldsProps) {
  if (!importMethod) return null;

  const showStoreUrl = importMethod === "store_import";
  const showUrls = URL_METHODS.has(importMethod) && importMethod !== "store_import";
  const showFile = FILE_METHODS.has(importMethod);

  if (!showStoreUrl && !showUrls && !showFile) {
    return null;
  }

  return (
    <div className="byi-source">
      <div>
        <h3 className="byi-source__label">Import source</h3>
        <p className="byi-source__help">Provide the data ROVEXO should import.</p>
      </div>

      {showStoreUrl ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="byi-source__label">Store URL</span>
          <input
            type="url"
            value={value.storeUrl}
            onChange={(event) => onChange({ storeUrl: event.target.value })}
            placeholder="https://your-store.example.com"
            className="byi-input"
            autoComplete="url"
          />
        </label>
      ) : null}

      {showUrls ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="byi-source__label">
            {importMethod === "single_url" ? "Listing URL" : "Listing URLs"}
          </span>
          <textarea
            value={value.sourceUrls}
            onChange={(event) => onChange({ sourceUrls: event.target.value })}
            rows={importMethod === "single_url" ? 2 : 4}
            placeholder={
              importMethod === "single_url"
                ? "https://marketplace.example.com/listing/123"
                : "One URL per line"
            }
            className="byi-textarea"
          />
        </label>
      ) : null}

      {showFile ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="byi-source__label">Import file</span>
          <input
            type="file"
            accept={importMethod === "csv" ? ".csv" : importMethod === "xlsx" ? ".xlsx,.xls" : ".xml"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                onChange({ fileName: null, fileContent: null, fileEncoding: undefined });
                return;
              }
              const isXlsx = importMethod === "xlsx";
              const reader = new FileReader();
              reader.onload = () => {
                if (isXlsx && typeof reader.result === "string") {
                  const base64 = reader.result.includes(",")
                    ? reader.result.split(",")[1] ?? ""
                    : reader.result;
                  onChange({
                    fileName: file.name,
                    fileContent: base64,
                    fileEncoding: "base64",
                  });
                  return;
                }
                onChange({
                  fileName: file.name,
                  fileContent: typeof reader.result === "string" ? reader.result : null,
                  fileEncoding: "utf8",
                });
              };
              if (isXlsx) reader.readAsDataURL(file);
              else reader.readAsText(file);
            }}
            className="text-sm text-text-secondary"
          />
          {value.fileName ? (
            <p className="byi-source__help">Selected: {value.fileName}</p>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}

export function buildMigrationInputPayload(
  importMethod: MigrationImportMethodId,
  source: MigrationSourceInput,
): Record<string, unknown> | undefined {
  const input: Record<string, unknown> = {};

  if (importMethod === "store_import" && source.storeUrl.trim()) {
    input.storeUrl = source.storeUrl.trim();
  }

  const urls = source.sourceUrls
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (urls.length > 0 && importMethod !== "store_import") {
    input.urls = urls;
  }

  if (source.fileContent && source.fileName) {
    input.fileName = source.fileName;
    input.fileContent = source.fileContent;
    if (source.fileEncoding) input.fileEncoding = source.fileEncoding;
  }

  return Object.keys(input).length > 0 ? input : undefined;
}

export function hasMigrationSourceInput(
  importMethod: MigrationImportMethodId,
  source: MigrationSourceInput,
): boolean {
  if (importMethod === "store_import") return source.storeUrl.trim().length > 0;
  if (FILE_METHODS.has(importMethod)) return Boolean(source.fileName && source.fileContent);
  if (URL_METHODS.has(importMethod)) {
    return source.sourceUrls
      .split(/\r?\n/)
      .map((line) => line.trim())
      .some(Boolean);
  }
  return true;
}
