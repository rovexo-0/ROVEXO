import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import type { CommerceLineItem } from "@/features/commerce-ui/types";

type ParcelProductsListProps = {
  items: CommerceLineItem[];
  className?: string;
};

/**
 * Products allocated to a single parcel. Each parcel owns its product allocation.
 */
export function ParcelProductsList({ items, className }: ParcelProductsListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-ds-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Products in this parcel</p>
      <ul className="flex flex-col gap-ds-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-ds-3 rounded-ds-md border border-border bg-surface-muted p-ds-3"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-ds-md bg-surface">
              <SafeImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
              <p className="text-xs text-text-secondary">Qty × {item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
