import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type RecentSearchesProps = {
  items: string[];
  activeIndex: number;
  navOffset: number;
  onSelect: (term: string) => void;
  onClear: () => void;
};

export function RecentSearches({
  items,
  activeIndex,
  navOffset,
  onSelect,
  onClear,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-ds-1" role="listbox" aria-label="Recent searches">
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
                "flex min-h-ds-7 w-full items-center rounded-ds-md px-ds-3 text-left text-sm text-text-primary hover:bg-secondary",
                focusRing,
                transitionFast,
                isActive && "bg-secondary",
              )}
            >
              {term}
            </button>
          </li>
        );
      })}
      <li>
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "mt-ds-2 text-sm text-text-secondary hover:text-primary",
            focusRing,
            transitionFast,
          )}
        >
          Clear history
        </button>
      </li>
    </ul>
  );
}
