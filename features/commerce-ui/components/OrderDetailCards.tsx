import Link from "next/link";
import { CheckCircle2, ChevronRight, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { CommerceStatusBadge } from "@/features/commerce-ui/components/CommerceStatusBadge";
import { InfoBannerCard } from "@/features/commerce-ui/components/InfoBannerCard";
import type { CommerceLineItem, CommerceOrderMeta } from "@/features/commerce-ui/types";

type OrderPlacedBannerProps = {
  className?: string;
};

export function OrderPlacedBanner({ className }: OrderPlacedBannerProps) {
  return (
    <InfoBannerCard
      tone="success"
      icon={<CheckCircle2 className="h-5 w-5" />}
      title="Order Placed Successfully"
      description="Thank you! Your order has been received."
      className={className}
    />
  );
}

type OrderInfoCardProps = {
  meta: CommerceOrderMeta;
  className?: string;
};

export function OrderInfoCard({ meta, className }: OrderInfoCardProps) {
  return (
    <Card padding="lg" className={cn("flex flex-col gap-ds-1", className)}>
      <p className="text-sm font-semibold text-text-primary">Order #{meta.orderNumber}</p>
      <p className="text-sm text-text-secondary">{meta.placedAt}</p>
      {meta.invoiceHref ? (
        <Link
          href={meta.invoiceHref}
          className={cn("mt-ds-2 text-sm font-medium text-primary", focusRing, transitionFast)}
        >
          View Invoice
        </Link>
      ) : null}
    </Card>
  );
}

type OrderStatusCardProps = {
  meta: CommerceOrderMeta;
  className?: string;
};

export function OrderStatusCard({ meta, className }: OrderStatusCardProps) {
  const paid = meta.paymentStatus === "paid";

  return (
    <Card padding="lg" className={cn("flex flex-col gap-ds-4", className)}>
      <div className="flex items-center justify-between gap-ds-3">
        <h2 className="text-base font-semibold text-text-primary">Order Status</h2>
        {paid ? <CommerceStatusBadge tone="success">Paid</CommerceStatusBadge> : null}
      </div>

      <div className="flex items-start gap-ds-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          <Package className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">Payment confirmed</p>
          <p className="mt-ds-1 text-sm text-text-secondary">We&apos;ve received your payment.</p>
        </div>
      </div>
    </Card>
  );
}

type OrderItemsPreviewCardProps = {
  items: CommerceLineItem[];
  className?: string;
};

export function OrderItemsPreviewCard({ items, className }: OrderItemsPreviewCardProps) {
  const visible = items.slice(0, 3);
  const overflow = items.length - visible.length;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card padding="lg" className={cn("flex items-center gap-ds-3", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-text-primary">Items ({totalQty})</h2>
        <div className="mt-ds-3 flex items-center gap-ds-2">
          {visible.map((item) => (
            <div
              key={item.id}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted"
            >
              <SafeImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
            </div>
          ))}
          {overflow > 0 ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-md bg-surface-muted text-xs font-semibold text-text-secondary">
              +{overflow}
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
    </Card>
  );
}
