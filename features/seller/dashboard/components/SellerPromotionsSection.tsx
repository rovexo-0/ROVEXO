import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPromotionRemaining } from "@/lib/promotions/format";
import { getPromotionDuration } from "@/lib/promotions/config";
import type { SellerPromotionHistoryItem, SellerPromotionStats } from "@/lib/promotions/types";
import type { ActiveSellerPromotion } from "@/lib/seller/types";

type SellerPromotionsSectionProps = {
  promotions: ActiveSellerPromotion[];
  stats: SellerPromotionStats;
  history: SellerPromotionHistoryItem[];
};

function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

function statusLabel(status: SellerPromotionHistoryItem["status"]): string {
  switch (status) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function SellerPromotionsSection({
  promotions,
  stats,
  history,
}: SellerPromotionsSectionProps) {
  if (promotions.length === 0 && history.length === 0 && stats.totalSpendCents === 0) {
    return null;
  }

  return (
    <section aria-labelledby="seller-promotions-heading" className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-2">
        <h2 id="seller-promotions-heading" className="text-base font-semibold text-text-primary">
          Promotions
        </h2>
        <Link href="/seller/listings" className="text-xs font-semibold text-primary">
          Manage
        </Link>
      </div>

      <Card padding="sm" className="shadow-ds-soft">
        <div className="grid grid-cols-3 gap-ds-2 text-center">
          <div>
            <p className="text-lg font-semibold text-text-primary">{stats.activeCount}</p>
            <p className="text-xs text-text-secondary">Active</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {formatCurrency(stats.monthSpendCents)}
            </p>
            <p className="text-xs text-text-secondary">This month</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {formatCurrency(stats.totalSpendCents)}
            </p>
            <p className="text-xs text-text-secondary">All time</p>
          </div>
        </div>
      </Card>

      {promotions.length > 0 && (
        <Card padding="none" className="overflow-hidden shadow-ds-soft">
          <p className="border-b border-border px-ds-4 py-ds-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Active now
          </p>
          {promotions.map((promotion, index) => (
            <div
              key={`${promotion.productId}-${promotion.type}`}
              className={index > 0 ? "border-t border-border" : undefined}
            >
              <Link
                href={`/seller/listings/${promotion.productId}/edit`}
                className="flex items-center gap-ds-3 px-ds-4 py-ds-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                  <Image
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{promotion.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant={promotion.type === "bump" ? "success" : "warning"}>
                      {promotion.type === "bump" ? "🚀 Bumped" : "⭐ Featured"}
                    </Badge>
                    <Badge variant="default">
                      {formatPromotionRemaining(promotion.endsAt) ?? "Expiring soon"}
                    </Badge>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Card>
      )}

      {history.length > 0 && (
        <Card padding="none" className="overflow-hidden shadow-ds-soft">
          <div className="flex items-center justify-between border-b border-border px-ds-4 py-ds-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              History
            </p>
            <Link href="/seller/wallet" className="text-xs font-semibold text-primary">
              Wallet
            </Link>
          </div>
          {history.map((item, index) => {
            const duration = getPromotionDuration(item.type, item.durationId);

            return (
              <div key={item.id} className={index > 0 ? "border-t border-border" : undefined}>
                <div className="flex items-center gap-ds-3 px-ds-4 py-ds-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                    <Image
                      src={item.productImageUrl}
                      alt={item.productTitle}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {item.productTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {item.type === "bump" ? "Bump" : "Feature"} · {duration?.label ?? item.durationId} ·{" "}
                      {formatCurrency(item.amountCents)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge
                        variant={
                          item.status === "active"
                            ? "success"
                            : item.status === "failed"
                              ? "danger"
                              : "default"
                        }
                      >
                        {statusLabel(item.status)}
                      </Badge>
                      {item.status === "active" && (
                        <Badge variant="default">
                          {formatPromotionRemaining(item.endsAt) ?? "Expiring soon"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}
