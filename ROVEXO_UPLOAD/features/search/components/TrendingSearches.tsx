import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type TrendingSearchesProps = {
  items: string[];
  activeIndex: number;
  navOffset: number;
  onSelect: (term: string) => void;
};

export function TrendingSearches({
  items,
  activeIndex,
  navOffset,
  onSelect,
}: TrendingSearchesProps) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-ds-2" role="listbox" aria-label="Trending searches">
      {items.map((term, index) => {
        const navIndex = navOffset + index;
        const isActive = activeIndex === navIndex;

        return (
          <li key={term}>
            <button
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(term)}
              className={cn(
                "inline-flex min-h-ds-7 items-center rounded-ds-full bg-secondary px-ds-4 text-sm font-medium text-text-primary hover:bg-primary/10 hover:text-primary",
                focusRing,
                transitionFast,
                isActive && "bg-primary/10 text-primary",
              )}
            >
              {term}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
