import Link from "next/link";
import { CheckCircle2, ChevronRight, Package } from "lucide-react";
import { CanonicalCard } from "@/src/components/canonical";
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
      icon={<CheckCircle2 className="h-4 w-4" />}
      title="Order placed"
      description="Payment received."
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
    <CanonicalCard variant="small" className={cn("flex w-full flex-col gap-ds-1", className)}>
      <p className="text-sm font-semibold text-text-primary">Order #{meta.orderNumber}</p>
      <p className="text-sm text-text-secondary">{meta.placedAt}</p>
      {meta.invoiceHref ? (
        <Link
          href={meta.invoiceHref}
          className={cn("mt-ds-1 text-sm font-medium text-primary", focusRing, transitionFast)}
        >
          Invoice
        </Link>
      ) : null}
    </CanonicalCard>
  );
}

type OrderStatusCardProps = {
  meta: CommerceOrderMeta;
  className?: string;
};

export function OrderStatusCard({ meta, className }: OrderStatusCardProps) {
  const paid = meta.paymentStatus === "paid";

  return (
    <CanonicalCard variant="small" className={cn("flex w-full flex-col gap-ds-2", className)}>
      <div className="flex items-center justify-between gap-ds-2">
        <h2 className="text-sm font-semibold text-text-primary">Status</h2>
        {paid ? <CommerceStatusBadge tone="success">Paid</CommerceStatusBadge> : null}
      </div>

      <div className="flex items-start gap-ds-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          <Package className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">Payment confirmed</p>
          <p className="text-sm text-text-secondary">We received your payment.</p>
        </div>
      </div>
    </CanonicalCard>
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
    <CanonicalCard variant="small" className={cn("flex w-full items-center gap-ds-2", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-text-primary">Items ({totalQty})</h2>
        <div className="mt-ds-2 flex items-center gap-ds-2">
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
    </CanonicalCard>
  );
}
