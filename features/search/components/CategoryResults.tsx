import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import type { SearchCategory } from "@/features/search/types";

type CategoryResultsProps = {
  items: SearchCategory[];
  activeIndex: number;
  navOffset: number;
  onHoverIndex: (index: number) => void;
};

export function CategoryResults({
  items,
  activeIndex,
  navOffset,
  onHoverIndex,
}: CategoryResultsProps) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-ds-2" role="listbox" aria-label="Categories">
      {items.map((category, index) => {
        const navIndex = navOffset + index;
        const isActive = activeIndex === navIndex;

        return (
          <li key={category.href}>
            <CategoryChip
              label={category.name}
              href={category.href}
              className={cn(isActive && "bg-primary/10 text-primary")}
              onMouseEnter={() => onHoverIndex(navIndex)}
            />
          </li>
        );
      })}
    </ul>
  );
}
