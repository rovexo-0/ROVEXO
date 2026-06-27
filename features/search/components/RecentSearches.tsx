import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type RecentSearchesProps = {
  items: string[];
  activeIndex: number;
  navOffset: number;
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
};

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function RecentSearches({
  items,
  activeIndex,
  navOffset,
  onSelect,
  onRemove,
  onClear,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-ds-2">
      <ul className="flex flex-col gap-ds-1" role="listbox" aria-label="Recent searches">
        {items.map((term, index) => {
          const navIndex = navOffset + index;
          const isActive = activeIndex === navIndex;

          return (
            <li key={term} className="min-h-[44px]">
              <div
                className={cn(
                  "flex min-h-[44px] items-center gap-ds-1 rounded-ds-md pr-ds-1",
                  isActive && "bg-secondary",
                )}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelect(term)}
                  className={cn(
                    "flex min-h-[44px] min-w-0 flex-1 items-center rounded-ds-md px-ds-3 text-left text-sm text-text-primary hover:bg-secondary",
                    focusRing,
                    transitionFast,
                  )}
                >
                  {term}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${term}`}
                  onClick={() => onRemove(term)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-full text-text-muted hover:bg-secondary hover:text-text-primary",
                    focusRing,
                    transitionFast,
                  )}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "self-start text-sm text-text-secondary hover:text-primary",
          focusRing,
          transitionFast,
        )}
      >
        Clear history
      </button>
    </div>
  );
}
