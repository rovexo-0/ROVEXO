import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type BreadcrumbsProps = {
  items: CategoryBreadcrumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-ds-1 text-text-secondary">
        <li>
          <Link href="/" className={cn("hover:text-primary", transitionFast, focusRing)}>
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-ds-1">
              <span aria-hidden className="text-text-muted">
                /
              </span>
              {isLast ? (
                <span aria-current="page" className="font-medium text-text-primary">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className={cn("hover:text-primary", transitionFast, focusRing)}>
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
