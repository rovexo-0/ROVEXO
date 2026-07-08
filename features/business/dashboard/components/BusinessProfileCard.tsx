import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BusinessBadge, resolveBusinessBadgeKinds } from "@/components/ui/BusinessBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import type { BusinessCompanyInfo } from "@/lib/business/types";

type BusinessProfileCardProps = {
  company: BusinessCompanyInfo;
};

export function BusinessProfileCard({ company }: BusinessProfileCardProps) {
  const badgeKinds = resolveBusinessBadgeKinds({
    verifiedBusiness: company.verifiedBusiness,
    verifiedWholesale: company.verifiedWholesale,
    verifiedManufacturer: company.verifiedManufacturer,
    verifiedSupplier: company.verifiedSupplier,
  });

  return (
    <Card padding="md" className="">
      <div className="flex items-start gap-ds-3">
        <Avatar
          src={company.companyLogoUrl}
          alt={`${company.companyName} logo`}
          name={company.companyName}
          size="lg"
          className="shrink-0 rounded-ds-lg"
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">
            {company.companyName}
          </h2>

          {badgeKinds.length > 0 ? (
            <div className="mt-ds-2 flex flex-wrap gap-1">
              {badgeKinds.map((kind) => (
                <BusinessBadge key={kind} kind={kind} compact />
              ))}
            </div>
          ) : null}

          <div className="mt-ds-2">
            <Rating value={company.rating} reviewCount={company.reviewCount} size="sm" />
          </div>

          <p className="mt-ds-2 text-xs text-text-secondary">
            {company.activeListings} Active Listings
          </p>
        </div>
      </div>

      <Link href={`/store/${company.storeSlug}`} className="mt-ds-4 block">
        <Button variant="outline" fullWidth size="md" className="min-h-ds-7 rounded-ds-lg">
          View Store
        </Button>
      </Link>
    </Card>
  );
}
