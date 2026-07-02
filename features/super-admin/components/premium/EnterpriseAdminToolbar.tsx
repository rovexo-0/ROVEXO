"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type EnterpriseAdminToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  sortLabel?: string;
  onExport?: () => void;
  onImport?: () => void;
  savedViews?: Array<{ id: string; label: string }>;
  activeView?: string;
  onViewChange?: (viewId: string) => void;
  bulkActions?: ReactNode;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
};

export function EnterpriseAdminToolbar({
  query,
  onQueryChange,
  placeholder = "Search…",
  resultCount,
  sortLabel,
  onExport,
  onImport,
  savedViews,
  activeView,
  onViewChange,
  bulkActions,
  page = 1,
  pageCount = 1,
  onPageChange,
}: EnterpriseAdminToolbarProps) {
  return (
    <div className="ea-toolbar" role="toolbar" aria-label="Module toolbar">
      <input
        type="search"
        className="ea-input"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {typeof resultCount === "number" ? (
        <span className="ea-toolbar__meta">{resultCount} results</span>
      ) : null}
      {sortLabel ? <span className="ea-toolbar__meta">Sort: {sortLabel}</span> : null}
      {savedViews && savedViews.length > 0 ? (
        <select
          className="ea-select"
          value={activeView}
          onChange={(event) => onViewChange?.(event.target.value)}
          aria-label="Saved views"
        >
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>{view.label}</option>
          ))}
        </select>
      ) : null}
      {bulkActions}
      {onExport ? (
        <Button type="button" size="sm" variant="secondary" onClick={onExport}>Export</Button>
      ) : null}
      {onImport ? (
        <Button type="button" size="sm" variant="secondary" onClick={onImport}>Import</Button>
      ) : null}
      {pageCount > 1 && onPageChange ? (
        <div className="ea-pagination" aria-label="Pagination">
          <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <span className="ea-toolbar__meta">{page} / {pageCount}</span>
          <Button type="button" size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
