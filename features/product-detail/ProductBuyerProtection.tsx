import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { ChevronRightIcon, ShieldIcon } from "@/features/product-detail/icons";
import { calculateProtectedFee } from "@/lib/orders/pricing";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type ProductBuyerProtectionProps = {
  itemPrice: number;
};

export function ProductBuyerProtection({ itemPrice }: ProductBuyerProtectionProps) {
  const protectionFee = calculateProtectedFee(itemPrice);

  return (
    <Link
      href="/help/buying-buyer-protection"
      className={cn("block rounded-ds-lg", transitionFast, focusRing)}
      aria-label={`Buyer protection fee ${protectionFee} pounds — view details`}
    >
      <Card padding="sm" className="flex items-center gap-ds-3 shadow-ds-soft">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-success/10 text-success">
          <ShieldIcon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text-primary">Buyer Protection</span>
          <span className="block text-xs text-text-secondary">
            Protection fee <Price amount={protectionFee} size="sm" className="inline font-semibold" /> at checkout
          </span>
        </span>

        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
      </Card>
    </Link>
  );
}
