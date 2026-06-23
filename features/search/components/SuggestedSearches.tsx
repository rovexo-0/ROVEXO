"use client";

import { CategoryChip } from "@/components/ui/CategoryChip";
import { defaultTrendingSearches } from "@/lib/search/defaults";

const SUGGESTED_SEARCHES = [
  "Vintage fashion",
  "iPhone",
  "Designer bags",
  "Home furniture",
  "Road bike",
  ...defaultTrendingSearches,
].slice(0, 8);

type SuggestedSearchesProps = {
  onSelect: (term: string) => void;
};

export function SuggestedSearches({ onSelect }: SuggestedSearchesProps) {
  return (
    <div className="flex flex-wrap gap-ds-2 px-ds-4 pb-ds-2">
      {SUGGESTED_SEARCHES.map((term) => (
        <CategoryChip key={term} label={term} onClick={() => onSelect(term)} />
      ))}
    </div>
  );
}
