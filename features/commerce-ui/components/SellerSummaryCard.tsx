import { Store } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatGBP } from "@/features/commerce-ui/lib/format";
import { CheckoutLineItem } from "@/features/commerce-ui/components/CheckoutLineItem";
import type { CommerceSellerGroup } from "@/features/commerce-ui/types";

type SellerSummaryCardProps = {
  group: CommerceSellerGroup;
  /** Show per-item Remove / Save actions (checkout only). */
  showActions?: boolean;
  onRemoveItem?: (itemId: string) => void;
  onToggleSaveItem?: (itemId: string, saved: boolean) => void;
  className?: string;
};

/**
 * Canonical reusable seller section: seller header, product rows and subtotal.
 * One component drives every seller group across checkout — no duplicated cards.
 */
export function SellerSummaryCard({
  group,
  showActions = false,
  onRemoveItem,
  onToggleSaveItem,
  className,
}: SellerSummaryCardProps) {
  const subtotal = group.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Card padding="lg" className={cn("flex flex-col gap-ds-3", className)}>
      <div className="flex items-center gap-ds-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          <Store className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-text-primary">{group.sellerName}</p>
      </div>

      <div className="divide-y divide-border">
        {group.items.map((item) => (
          <CheckoutLineItem
            key={item.id}
            item={item}
            showActions={showActions}
            onRemove={onRemoveItem}
            onToggleSave={onToggleSaveItem}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-ds-3 text-sm">
        <span className="text-text-secondary">Subtotal</span>
        <span className="font-semibold text-text-primary">{formatGBP(subtotal)}</span>
      </div>
    </Card>
  );
}
