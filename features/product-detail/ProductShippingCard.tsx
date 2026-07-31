import Link from "next/link";
import { resolveShippingEstimate } from "@/lib/product-detail/format";
import type { ProductDetail } from "@/lib/products/types";
import { PRODUCT_DELIVERY_DETAILS_HREF } from "@/lib/product-detail/delivery-details-route-v1";

type ProductShippingCardProps = {
  product: ProductDetail;
};

/**
 * Product Page — Delivery card.
 * Navigates only to the canonical Delivery Details Help article (never a 404 path).
 */
export function ProductShippingCard({ product }: ProductShippingCardProps) {
  return (
    <Link
      href={PRODUCT_DELIVERY_DETAILS_HREF}
      className="pd-v1__card pd-v1__shipping"
      aria-labelledby="pd-shipping-title"
      aria-label="Delivery details"
    >
      <span className="pd-v1__shipping-copy">
        <p id="pd-shipping-title" className="pd-v1__shipping-title">
          Delivery
        </p>
        <p className="pd-v1__shipping-sub">{resolveShippingEstimate(product)}</p>
        <p className="pd-v1__shipping-sub">Tracked delivery available</p>
      </span>
    </Link>
  );
}
