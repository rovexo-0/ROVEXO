import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { SearchStore } from "@/features/search/types";

type StoreResultsProps = {
  items: SearchStore[];
  activeIndex: number;
  navOffset: number;
  onHoverIndex: (index: number) => void;
};

export function StoreResults({
  items,
  activeIndex,
  navOffset,
  onHoverIndex,
}: StoreResultsProps) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-ds-1" role="listbox" aria-label="Stores">
      {items.map((store, index) => {
        const navIndex = navOffset + index;
        const isActive = activeIndex === navIndex;

        return (
          <li key={store.id}>
            <Link
              href={store.href}
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => onHoverIndex(navIndex)}
              className={cn(
                "flex min-h-ds-7 flex-col justify-center rounded-ds-md px-ds-3 py-ds-2 hover:bg-secondary",
                focusRing,
                transitionFast,
                isActive && "bg-secondary",
              )}
            >
              <span className="text-sm font-medium text-text-primary">{store.name}</span>
              <span className="text-xs text-text-secondary">{store.description}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
