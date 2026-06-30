"use client";

import type { ReactNode } from "react";

type SuperAdminSearchToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  actions?: ReactNode;
  resultCount?: number;
};

export function SuperAdminSearchToolbar({
  query,
  onQueryChange,
  placeholder = "Search…",
  actions,
  resultCount,
}: SuperAdminSearchToolbarProps) {
  return (
    <div className="sa-premium-toolbar">
      <input
        type="search"
        className="sa-premium-input"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {typeof resultCount === "number" ? (
        <span className="text-xs text-text-muted">{resultCount} results</span>
      ) : null}
      {actions}
    </div>
  );
}
