import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CanonicalCard } from "@/src/components/canonical";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type OrderContextCardProps = {
  orderNumber: string;
  itemCount: number;
  sellerName: string;
  orderHref: string;
  className?: string;
};

/** Order context header on the Tracking screen — links back to Order Details. */
export function OrderContextCard({
  orderNumber,
  itemCount,
  sellerName,
  orderHref,
  className,
}: OrderContextCardProps) {
  return (
    <CanonicalCard variant="small" className={cn("flex w-full flex-col gap-ds-1", className)}>
      <p className="text-sm font-semibold text-text-primary">Order #{orderNumber}</p>
      <p className="text-sm text-text-secondary">
        {itemCount} {itemCount === 1 ? "item" : "items"} · {sellerName}
      </p>
      <Link
        href={orderHref}
        className={cn(
          "mt-ds-1 inline-flex items-center gap-ds-1 text-sm font-medium text-primary",
          focusRing,
          transitionFast,
        )}
      >
        View order
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </CanonicalCard>
  );
}
