"use client";

import {
  countPreviewIssues,
  type InlineImportPreview,
} from "@/lib/bring-your-item/inline-import-engine";
import { MigrationValidationList } from "@/features/seller/migration/components/inline/MigrationValidationList";

type MigrationInlinePreviewPanelProps = {
  preview: InlineImportPreview | null;
  isLoading: boolean;
  error: string | null;
};

export function MigrationInlinePreviewPanel({
  preview,
  isLoading,
  error,
}: MigrationInlinePreviewPanelProps) {
  if (isLoading) {
    return (
      <div className="byi-connect-card" role="status" aria-live="polite">
        <div className="flex items-center gap-ds-2">
          <span className="byi-empty-pulse" aria-hidden />
          <p className="text-sm font-medium text-text-primary">Previewing import source…</p>
        </div>
        <p className="mt-ds-1 text-xs text-text-secondary">Validating format and sample listings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="byi-alert" role="alert">
        <p className="byi-alert__title">Preview failed</p>
        <p className="byi-alert__message">{error}</p>
      </div>
    );
  }

  if (!preview) return null;

  const counts = countPreviewIssues(preview);

  return (
    <section className="byi-connect-card" aria-labelledby="byi-inline-preview-title">
      <div className="flex flex-wrap items-center justify-between gap-ds-2">
        <h3 id="byi-inline-preview-title" className="text-sm font-semibold text-text-primary">
          Inline preview
        </h3>
        {preview.sourceLabel ? (
          <span className="byi-badge byi-badge--connected">{preview.sourceLabel}</span>
        ) : null}
      </div>

      {preview.preview.length > 0 ? (
        <ul className="mt-ds-3 flex flex-col gap-ds-2" aria-label="Preview listings">
          {preview.preview.map((listing) => (
            <li
              key={listing.externalId}
              className="rounded-ds-md border border-border bg-white px-ds-3 py-ds-2"
            >
              <p className="truncate text-sm font-medium text-text-primary">{listing.title}</p>
              <p className="mt-ds-1 text-xs text-text-secondary">
                {listing.price > 0 ? `£${listing.price.toFixed(2)}` : "Price from source"}
                {listing.imageUrls?.length ? ` · ${listing.imageUrls.length} image(s)` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-ds-2 text-xs text-text-secondary">
          Source is ready. Full listing data loads during import.
        </p>
      )}

      <dl className="byi-stat-grid mt-ds-3">
        <div>
          <dt className="byi-stat__label">Total rows</dt>
          <dd className="byi-stat__value">{counts.total}</dd>
        </div>
        <div>
          <dt className="byi-stat__label">Valid sample</dt>
          <dd className="byi-stat__value">{counts.valid}</dd>
        </div>
        <div>
          <dt className="byi-stat__label">Issues</dt>
          <dd className="byi-stat__value">{counts.invalid}</dd>
        </div>
      </dl>

      {preview.validation.length > 0 ? (
        <div className="mt-ds-3">
          <MigrationValidationList validation={preview.validation} compact />
        </div>
      ) : null}
    </section>
  );
}
