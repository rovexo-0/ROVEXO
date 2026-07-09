import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ListingCard } from "@/components/ui/ListingCard";
import type { Product } from "@/lib/products/types";
import { InternalLinksSection } from "@/features/seo/components/InternalLinksSection";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import type { FaqItem } from "@/lib/seo/engine/faq";
import { SeoFaqSection } from "@/features/seo/components/SeoFaqSection";

type SeoLandingPageViewProps = {
  title: string;
  description: string;
  products: Product[];
  total: number;
  breadcrumbs: { name: string; href: string }[];
  internalLinkGroups?: InternalLinkGroup[];
  faqItems?: FaqItem[];
  indexable?: boolean;
};

export function SeoLandingPageView({
  title,
  description,
  products,
  total,
  breadcrumbs,
  internalLinkGroups = [],
  faqItems = [],
  indexable = true,
}: SeoLandingPageViewProps) {
  return (
    <main className="mx-auto max-w-6xl px-ds-4 py-ds-6">
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href}>
            {index > 0 && " / "}
            {index < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="text-primary">
                {crumb.name}
              </Link>
            ) : (
              <span>{crumb.name}</span>
            )}
          </span>
        ))}
      </nav>

      <h1 className="mt-ds-4 text-2xl font-bold">{title}</h1>
      <p className="mt-ds-2 max-w-3xl text-sm text-text-secondary">{description}</p>
      <p className="mt-ds-2 text-xs text-text-muted">
        {total} listings{!indexable && total > 0 ? " · limited inventory" : ""}
      </p>

      {products.length ? (
        <div className="mt-ds-6 rx-listing-grid">
          {products.map((product) => (
            <ListingCard key={product.id} product={product} variant="grid" surface="category" />
          ))}
        </div>
      ) : (
        <Card className="mt-ds-6 p-ds-6 text-sm text-text-secondary">
          No listings match this page yet.{" "}
          <Link href="/sell" className="font-medium text-primary">
            Be the first to sell
          </Link>
        </Card>
      )}

      <InternalLinksSection groups={internalLinkGroups} />
      <SeoFaqSection items={faqItems} />
    </main>
  );
}
