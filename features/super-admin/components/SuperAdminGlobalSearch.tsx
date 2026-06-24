"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { SuperAdminSearchResult } from "@/lib/super-admin/search";

export function SuperAdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuperAdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const response = await fetch(`/api/super-admin/search?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as { results?: SuperAdminSearchResult[] };
    setResults(payload.results ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void search(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users, listings, businesses, orders, reports, messages…"
          className="premium-input min-h-ds-7 w-full rounded-ds-md px-ds-3 text-sm"
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
