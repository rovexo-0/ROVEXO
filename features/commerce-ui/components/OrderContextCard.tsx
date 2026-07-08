import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
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
    <Card padding="lg" className={cn("flex flex-col gap-ds-1", className)}>
      <p className="text-sm font-semibold text-text-primary">Order #{orderNumber}</p>
      <p className="text-sm text-text-secondary">
        {itemCount} {itemCount === 1 ? "Item" : "Items"} from {sellerName}
      </p>
      <Link
        href={orderHref}
        className={cn(
          "mt-ds-2 inline-flex items-center gap-ds-1 text-sm font-medium text-primary",
          focusRing,
          transitionFast,
        )}
      >
        View Order
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
