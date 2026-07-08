import Link from "next/link";
import { resolveShippingEstimate } from "@/lib/product-detail/format";
import type { ProductDetail } from "@/lib/products/types";

type ProductShippingCardProps = {
  product: ProductDetail;
};

export function ProductShippingCard({ product }: ProductShippingCardProps) {
  return (
    <Link href="/help/shipping" className="pd-v1__card pd-v1__shipping" aria-labelledby="pd-shipping-title">
      <span className="pd-v1__shipping-copy">
        <p id="pd-shipping-title" className="pd-v1__shipping-title">
          Shipping
        </p>
        <p className="pd-v1__shipping-sub">{resolveShippingEstimate(product)}</p>
      </span>
    </Link>
  );
}
