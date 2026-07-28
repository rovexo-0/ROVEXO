"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Avatar } from "@/components/ui/Avatar";
import { formatListingPrice } from "@/lib/listing-card/format";
import { normalizeCondition } from "@/lib/products/utils";
import type { ProductDetail } from "@/lib/products/types";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";

type CheckoutProductSummaryProps = {
  product: ProductDetail;
};

/** Compact product summary — Blood Compact UI (~70px). */
export function CheckoutProductSummary({ product }: CheckoutProductSummaryProps) {
  const imageSrc = isRenderableImageSrc(product.imageUrl)
    ? product.imageUrl
    : "/placeholder-product.svg";

  return (
    <Link
      href={`/listing/${product.slug}`}
      className="ckt-v1__product"
      aria-label={`${product.title}. Open listing.`}
    >
      <span className="ckt-v1__product-media">
        <SafeImage src={imageSrc} alt="" fill className="object-cover" sizes="64px" />
      </span>
      <span className="ckt-v1__product-copy">
        <span className="ckt-v1__product-title">{product.title}</span>
        {product.condition ? (
          <span className="ckt-v1__product-meta">{normalizeCondition(product.condition)}</span>
        ) : null}
        <span className="ckt-v1__product-seller">
          <Avatar
            src={product.sellerAvatar}
            alt={product.sellerName}
            name={product.sellerName}
            size="sm"
            className="ckt-v1__product-avatar"
          />
          <span className="ckt-v1__product-seller-name">{product.sellerName}</span>
        </span>
        <span className="ckt-v1__product-price">{formatListingPrice(product.price)}</span>
      </span>
    </Link>
  );
}
