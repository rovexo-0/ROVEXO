"use client";

import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type MigrationSourceInput = {
  storeUrl: string;
  sourceUrls: string;
  fileName: string | null;
  fileContent: string | null;
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
    return (
      <div className="rounded-ds-lg border border-border bg-white px-ds-4 py-ds-3">
        <p className="text-sm text-text-secondary">
          API credentials for this method are configured in Marketplace Connectors. You can continue to preview and run the import.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-ds-3 rounded-ds-lg border border-border bg-white p-ds-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Import source</h3>
        <p className="mt-ds-1 text-xs text-text-secondary">Provide the data ROVEXO should import.</p>
      </div>

      {showStoreUrl ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="text-sm font-medium text-text-primary">Store URL</span>
          <input
            type="url"
            value={value.storeUrl}
            onChange={(event) => onChange({ storeUrl: event.target.value })}
            placeholder="https://your-store.example.com"
            className={cn("rx-input min-h-ds-7 w-full rounded-ds-sm px-ds-3 py-ds-2 text-sm", focusRing)}
          />
        </label>
      ) : null}

      {showUrls ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="text-sm font-medium text-text-primary">
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
            className={cn("rx-input w-full rounded-ds-sm px-ds-3 py-ds-2 text-sm", focusRing)}
          />
        </label>
      ) : null}

      {showFile ? (
        <label className="flex flex-col gap-ds-1.5">
          <span className="text-sm font-medium text-text-primary">Import file</span>
          <input
            type="file"
            accept={importMethod === "csv" ? ".csv" : importMethod === "xlsx" ? ".xlsx,.xls" : ".xml"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                onChange({ fileName: null, fileContent: null });
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                onChange({
                  fileName: file.name,
                  fileContent: typeof reader.result === "string" ? reader.result : null,
                });
              };
              reader.readAsText(file);
            }}
            className={cn("text-sm text-text-secondary", focusRing)}
          />
          {value.fileName ? (
            <p className="text-xs text-text-secondary">Selected: {value.fileName}</p>
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
  }

  return Object.keys(input).length > 0 ? input : undefined;
}
