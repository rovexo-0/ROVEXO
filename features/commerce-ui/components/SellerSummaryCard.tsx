import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalCard } from "@/src/components/canonical";
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
    <CanonicalCard variant="small" className={cn("flex w-full flex-col gap-ds-2", className)}>
      <div className="flex items-center gap-ds-2">
        <span className="ac-canonical__menu-icon text-primary" aria-hidden>
          <AccountIcon name="business" />
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

      <div className="flex items-center justify-between border-t border-border pt-ds-2 text-sm">
        <span className="text-text-secondary">Subtotal</span>
        <span className="font-semibold text-text-primary">{formatGBP(subtotal)}</span>
      </div>
    </CanonicalCard>
  );
}
