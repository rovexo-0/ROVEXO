"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ZeroResultRecovery } from "@/lib/organic-growth/zero-results";

type SearchResultsEmptyProps = {
  variant: "idle" | "no-results";
  query?: string;
  resultCount?: number;
  /** What was being searched, for per-scope messaging (e.g. "products", "sellers"). */
  entity?: string;
};

function SearchIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function SearchResultsEmpty({ variant, query, resultCount = 0, entity = "results" }: SearchResultsEmptyProps) {
  const [recovery, setRecovery] = useState<ZeroResultRecovery | null>(null);

  useEffect(() => {
    if (variant !== "no-results" || !query) return;
    const params = new URLSearchParams({ q: query, count: String(resultCount) });
    fetch(`/api/marketplace-intelligence/zero-results?${params.toString()}`)
      .then((response) => response.json())
      .then((payload: { recovery: ZeroResultRecovery }) => setRecovery(payload.recovery))
      .catch(() => setRecovery(null));
  }, [variant, query, resultCount]);

  if (variant === "idle") {
    return (
      <EmptyState
        icon={<SearchIcon />}
        title="Search ROVEXO"
        description="Find products, sellers, stores, and categories. Try trending searches or browse popular categories below."
        actionLabel="Browse categories"
        actionHref="/categories"
        className="mx-ds-4 border-none bg-transparent shadow-none"
      />
    );
  }

  const label = entity === "results" ? "results" : entity;
  const title = `No ${label} found`;
  const description = query
    ? `We couldn't find any ${label} for "${query}". Try these alternatives instead.`
    : "Try another keyword — check the spelling or use fewer words.";

  return (
    <div className="mx-ds-4 space-y-ds-4">
      <EmptyState
        icon={<SearchIcon />}
        title={title}
        description={description}
        suggestions={recovery?.recoveryLinks.slice(0, 3).map((link) => link.label) ?? ["Try a different keyword", "Check your spelling", "Remove filters"]}
        actionLabel="Browse categories"
        actionHref="/categories"
        className="border-none bg-transparent shadow-none"
      />

      {recovery && recovery.recoveryLinks.length > 0 && (
        <div className="rounded-ds-lg border border-border bg-surface p-ds-4">
          <h3 className="text-sm font-semibold text-text-primary">You might also like</h3>
          <ul className="mt-ds-3 flex flex-wrap gap-ds-2">
            {recovery.recoveryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-border px-ds-3 py-ds-1 text-sm text-text-secondary hover:border-primary hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
