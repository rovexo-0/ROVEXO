"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import type { SuperAdminSearchResult } from "@/lib/super-admin/search";

export function SuperAdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SuperAdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const runSearch = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/super-admin/search?q=${encodeURIComponent(debouncedQuery.trim())}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const payload = (await response.json()) as { results?: SuperAdminSearchResult[] };
        setResults(payload.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void runSearch();
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery]);

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users, listings, businesses, orders, reports, messages…"
          className="rx-input min-h-ds-7 w-full rounded-ds-md px-ds-3 text-sm"
          autoFocus
        />
      </Card>

      {loading ? <p className="text-sm text-text-secondary">Searching…</p> : null}

      <div className="space-y-ds-2">
        {results.map((result) => (
          <Link key={`${result.type}-${result.id}`} href={result.href}>
            <Card padding="md" className="bg-white transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-ds-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{result.type}</p>
                  <p className="font-semibold text-text-primary">{result.title}</p>
                  <p className="text-sm text-text-secondary">{result.subtitle}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
