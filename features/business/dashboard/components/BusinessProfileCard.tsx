import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { VerifiedIcon } from "@/features/product-detail/icons";
import type { BusinessCompanyInfo } from "@/lib/business/types";

type BusinessProfileCardProps = {
  company: BusinessCompanyInfo;
};

export function BusinessProfileCard({ company }: BusinessProfileCardProps) {
  return (
    <Card padding="md" className="shadow-ds-soft">
      <div className="flex items-start gap-ds-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-ds-lg bg-surface-muted">
          <Image
            src={company.companyLogoUrl}
            alt={`${company.companyName} logo`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">
            {company.companyName}
          </h2>

          <Badge variant="success" className="mt-ds-2 gap-ds-1">
            <VerifiedIcon className="h-3.5 w-3.5" />
            Verified Business
          </Badge>

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
