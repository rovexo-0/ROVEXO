"use client";

import { useRouter } from "next/navigation";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import type { SearchFilterScope } from "@/features/search/types";
import { SEARCH_FILTER_SCOPES } from "@/features/search/types";

type SearchScopeChipsProps = {
  active: SearchFilterScope;
  onChange?: (scope: SearchFilterScope) => void;
  query?: string;
  className?: string;
};

export function SearchScopeChips({ active, onChange, query = "", className }: SearchScopeChipsProps) {
  const router = useRouter();

  function handleSelect(scope: SearchFilterScope) {
    onChange?.(scope);

    if (scope === "products" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div
      className={cn("flex flex-wrap gap-ds-2", className)}
      role="group"
      aria-label="Search filters"
    >
      {SEARCH_FILTER_SCOPES.map((scope) => (
        <CategoryChip
          key={scope.id}
          label={scope.label}
          active={active === scope.id}
          aria-pressed={active === scope.id}
          onClick={() => handleSelect(scope.id)}
          className="min-h-[36px]"
        />
      ))}
    </div>
  );
}
