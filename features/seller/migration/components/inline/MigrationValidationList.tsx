"use client";

import type { InlinePreviewValidation } from "@/lib/bring-your-item/inline-import-engine";

type MigrationValidationListProps = {
  validation: InlinePreviewValidation[];
  compact?: boolean;
};

export function MigrationValidationList({ validation, compact = false }: MigrationValidationListProps) {
  const issues = validation.filter((entry) => !entry.valid);
  if (issues.length === 0) {
    return (
      <p className="text-xs font-medium text-success" role="status">
        Validation passed for preview sample.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-ds-2" aria-label="Validation issues">
      {issues.slice(0, compact ? 3 : 8).map((entry) => (
        <li key={entry.externalId} className="rounded-ds-md border border-warning/30 bg-warning/5 px-ds-3 py-ds-2">
          <p className="text-xs font-semibold text-text-primary">{entry.externalId}</p>
          {entry.errors.map((issue) => (
            <p key={`${issue.field}-${issue.message}`} className="mt-ds-1 text-xs text-warning">
              {issue.field}: {issue.message}
            </p>
          ))}
        </li>
      ))}
      {issues.length > (compact ? 3 : 8) ? (
        <li className="text-xs text-text-secondary">+{issues.length - (compact ? 3 : 8)} more issues</li>
      ) : null}
    </ul>
  );
}
