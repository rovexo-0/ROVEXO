import Link from "next/link";
import { SellerReportDialog } from "@/features/product-detail/SellerReportDialog";
import { isVerifiedStore } from "@/lib/product-detail/format";
import type { ProductDetail } from "@/lib/products/types";

type ProductStoreSectionProps = {
  product: ProductDetail;
};

export function ProductStoreSection({ product }: ProductStoreSectionProps) {
  const profileHref = product.sellerUsername
    ? `/user/${product.sellerUsername}`
    : `/search?seller=${encodeURIComponent(product.sellerId)}`;
  const verified = isVerifiedStore(product);
  const followers = product.sellerFollowerCount ?? 0;
  const rating = product.rating > 0 ? product.rating.toFixed(1) : "—";
  const reviews =
    product.reviewCount > 0 ? ` (${product.reviewCount.toLocaleString("en-GB")})` : "";

  return (
    <section className="pd-v1__card pd-v1__store" aria-labelledby="pd-store-name">
      <div className="pd-v1__store-top">
        <div className="pd-v1__store-meta">
          <div className="pd-v1__store-name-row">
            <h2 id="pd-store-name" className="pd-v1__store-name">
              {product.sellerName}
            </h2>
            {verified ? (
              <span className="pd-v1__badge pd-v1__badge--verified">
                <span aria-hidden>✓</span> Verified Store
              </span>
            ) : null}
          </div>
          <p className="pd-v1__store-stats">
            ★ {rating}
            {reviews}
            {followers > 0 ? ` · ${followers.toLocaleString("en-GB")} followers` : ""}
          </p>
        </div>
      </div>

      <Link href={profileHref} className="pd-v1__visit-store">
        Visit Store
      </Link>

      <div className="pd-v1__report-row">
        <SellerReportDialog sellerId={product.sellerId} sellerName={product.sellerName} />
      </div>
    </section>
  );
}
