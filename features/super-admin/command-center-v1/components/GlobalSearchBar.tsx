"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommandCenterSection } from "@/lib/super-admin/command-center-v1/types";
import { formatCommandCenterMetric } from "@/features/super-admin/command-center-v1/lib/format-metric";

type GlobalSearchBarProps = {
  sections: CommandCenterSection[];
  quickActionLabels: string[];
};

type SearchResult = {
  id: string;
  label: string;
  value: string;
  href?: string;
  group: string;
};

export function GlobalSearchBar({ sections, quickActionLabels }: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");

  const index = useMemo<SearchResult[]>(() => {
    const metricResults = sections.flatMap((section) =>
      section.metrics.map((metric) => ({
        id: `${section.id}-${metric.id}`,
        label: metric.label,
        value: formatCommandCenterMetric(metric.value, metric.format),
        href: metric.href,
        group: section.title,
      })),
    );

    const actionResults = quickActionLabels.map((label, index) => ({
      id: `action-${index}`,
      label,
      value: "Quick action",
      group: "Quick Actions",
    }));

    return [...metricResults, ...actionResults];
  }, [sections, quickActionLabels]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return index
      .filter(
        (entry) =>
          entry.label.toLowerCase().includes(normalized) ||
          entry.group.toLowerCase().includes(normalized) ||
          entry.value.toLowerCase().includes(normalized),
      )
      .slice(0, 12);
  }, [index, query]);

  return (
    <div className="cc1-search">
      <label htmlFor="cc1-global-search" className="cc1-search__label">
        Global search
      </label>
      <input
        id="cc1-global-search"
        type="search"
        className="cc1-search__input"
        placeholder="Search users, listings, orders, metrics, logs…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {results.length > 0 ? (
        <ul className="cc1-search__results" role="listbox">
          {results.map((result) => (
            <li key={result.id}>
              {result.href ? (
                <Link href={result.href} className="cc1-search__result">
                  <span className="cc1-search__result-label">{result.label}</span>
                  <span className="cc1-search__result-meta">
                    {result.group} · {result.value}
                  </span>
                </Link>
              ) : (
                <div className="cc1-search__result">
                  <span className="cc1-search__result-label">{result.label}</span>
                  <span className="cc1-search__result-meta">{result.group}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
