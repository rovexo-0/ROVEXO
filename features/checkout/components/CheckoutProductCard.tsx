import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { Price } from "@/components/ui/Price";
import { normalizeCondition } from "@/lib/products/utils";
import type { ProductDetail } from "@/lib/products/types";

type CheckoutProductCardProps = {
  product: ProductDetail;
};

export function CheckoutProductCard({ product }: CheckoutProductCardProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex gap-ds-3 p-ds-4">
        <ProductRowImage
          src={product.imageUrl}
          alt={product.title}
          containerClassName="h-20 w-20 shrink-0 rounded-ds-md"
          sizes="80px"
        />

        <div className="min-w-0 flex-1">
          {product.condition && (
            <Badge variant="success" className="mb-ds-2 w-fit px-ds-2 py-0.5 text-[0.6875rem]">
              {normalizeCondition(product.condition)}
            </Badge>
          )}

          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
            {product.title}
          </h2>

          <Price amount={product.price} size="md" className="mt-ds-2" />
        </div>
      </div>
    </Card>
  );
}
