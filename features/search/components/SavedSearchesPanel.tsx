"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type SavedSearch = {
  id: string;
  query: string;
};

type SavedSearchesPanelProps = {
  currentQuery: string;
  onSelect: (query: string) => void;
};

export function SavedSearchesPanel({ currentQuery, onSelect }: SavedSearchesPanelProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/saved-searches")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { searches?: SavedSearch[] } | null) => setSearches(payload?.searches ?? []))
      .catch(() => setSearches([]));
  }, []);

  const save = async () => {
    const query = currentQuery.trim();
    if (!query) return;
    setBusy(true);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { search: SavedSearch };
      setSearches((items) => [payload.search, ...items.filter((item) => item.id !== payload.search.id)]);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    setSearches((items) => items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-ds-2">
      <div className="flex items-center justify-between gap-ds-3">
        <p className="text-sm font-semibold text-text-primary">Saved searches</p>
        <Button variant="secondary" disabled={busy || !currentQuery.trim()} onClick={() => void save()}>
          Save search
        </Button>
      </div>
      {searches.length ? (
        <ul className="space-y-ds-1">
          {searches.slice(0, 6).map((search) => (
            <li key={search.id} className="flex items-center justify-between gap-ds-2 text-sm">
              <button type="button" className="text-left text-primary hover:underline" onClick={() => onSelect(search.query)}>
                {search.query}
              </button>
              <button type="button" className="text-text-muted hover:text-text-primary" onClick={() => void remove(search.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">Save frequent searches for quick access.</p>
      )}
    </div>
  );
}
