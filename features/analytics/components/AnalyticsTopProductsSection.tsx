import { SafeImage } from "@/components/ui/SafeImage";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatAnalyticsCurrency } from "@/lib/analytics/utils";
import type { AnalyticsTopProduct } from "@/lib/analytics/types";

type AnalyticsTopProductsSectionProps = {
  title: string;
  products: AnalyticsTopProduct[];
};

export function AnalyticsTopProductsSection({ title, products }: AnalyticsTopProductsSectionProps) {
  return (
    <CanonicalSection title={title}>
      <CanonicalCard variant="list">
        {products.length === 0 ? (
          <CanonicalMenuRow title="No products yet" showChevron={false} />
        ) : (
          products.map((product, index) => (
            <CanonicalMenuRow
              key={product.id}
              title={product.title}
              description={`${formatAnalyticsCurrency(product.revenue)} · ${product.orders.toLocaleString()} orders`}
              value={`#${index + 1}`}
              showChevron={false}
              icon={
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg" aria-hidden>
                  <SafeImage
                    src={product.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </span>
              }
            />
          ))
        )}
      </CanonicalCard>
    </CanonicalSection>
  );
}
