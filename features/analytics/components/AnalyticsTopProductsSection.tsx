import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { formatAnalyticsCurrency } from "@/lib/analytics/utils";
import type { AnalyticsTopProduct } from "@/lib/analytics/types";

type AnalyticsTopProductsSectionProps = {
  title: string;
  products: AnalyticsTopProduct[];
};

export function AnalyticsTopProductsSection({ title, products }: AnalyticsTopProductsSectionProps) {
  return (
    <section aria-labelledby="analytics-top-products-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-top-products-heading" className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <Card padding="none" className="overflow-hidden">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={index > 0 ? "border-t border-border" : undefined}
          >
            <div className="flex min-h-[72px] items-center gap-ds-3 px-ds-4 py-ds-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{product.title}</p>
                <div className="mt-ds-1 flex flex-wrap gap-x-ds-3 gap-y-ds-1 text-xs text-text-secondary">
                  <span>{formatAnalyticsCurrency(product.revenue)} revenue</span>
                  <span>{product.orders.toLocaleString()} orders</span>
                </div>
              </div>

              <span className="shrink-0 text-sm font-bold tabular-nums text-text-muted">
                #{index + 1}
              </span>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
