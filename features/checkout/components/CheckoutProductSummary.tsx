"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Avatar } from "@/components/ui/Avatar";
import { formatListingPrice } from "@/lib/listing-card/format";
import { normalizeCondition } from "@/lib/products/utils";
import type { ProductDetail } from "@/lib/products/types";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import type { BundleCheckoutSnapshotV1 } from "@/lib/bundle/bundle-snapshot-v1";

type CheckoutProductSummaryProps = {
  product: ProductDetail;
  bundleSnapshot?: BundleCheckoutSnapshotV1 | null;
};

/** Compact product summary — Blood Compact UI. Bundle: locked lines from snapshot only. */
export function CheckoutProductSummary({
  product,
  bundleSnapshot,
}: CheckoutProductSummaryProps) {
  if (bundleSnapshot && bundleSnapshot.lines.length > 0) {
    return (
      <div className="ckt-v1__bundle-lock" data-bundle-id={bundleSnapshot.bundleId}>
        <p className="ckt-v1__product-meta" style={{ marginBottom: 8 }}>
          Bundle · {bundleSnapshot.lines.length} items · ID {bundleSnapshot.bundleId.slice(0, 8)}
        </p>
        <ul className="ckt-v1__bundle-lines" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {bundleSnapshot.lines.map((line) => {
            const imageSrc = isRenderableImageSrc(line.imageUrl)
              ? line.imageUrl
              : "/placeholder-product.svg";
            return (
              <li key={line.productId} className="ckt-v1__product" style={{ display: "flex", gap: 12 }}>
                <span className="ckt-v1__product-media">
                  <SafeImage src={imageSrc} alt="" fill className="object-cover" sizes="64px" />
                </span>
                <span className="ckt-v1__product-copy">
                  <span className="ckt-v1__product-title">{line.title}</span>
                  {line.condition ? (
                    <span className="ckt-v1__product-meta">{normalizeCondition(line.condition)}</span>
                  ) : null}
                  <span className="ckt-v1__product-meta">Qty {line.quantity}</span>
                  <span className="ckt-v1__product-price">
                    {formatListingPrice(line.unitPrice * line.quantity)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="ckt-v1__product-seller" style={{ marginTop: 10 }}>
          <span className="ckt-v1__product-seller-name">{bundleSnapshot.sellerName}</span>
        </p>
        <p className="ckt-v1__product-price" style={{ marginTop: 4 }}>
          Items {formatListingPrice(bundleSnapshot.itemPrice)}
        </p>
      </div>
    );
  }

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
