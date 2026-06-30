"use client";

import Link from "next/link";
import { memo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { BusinessDirectoryEntry } from "@/lib/business/directory";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type BusinessSpotlightSectionProps = {
  businesses: BusinessDirectoryEntry[];
  hideWhenEmpty?: boolean;
};

export const BusinessSpotlightSection = memo(function BusinessSpotlightSection({
  businesses,
  hideWhenEmpty = true,
}: BusinessSpotlightSectionProps) {
  if (hideWhenEmpty && businesses.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="business-spotlight-heading" className="rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <div>
          <h2 id="business-spotlight-heading" className="rx-section__title text-text-primary">
            Business Spotlight
          </h2>
          <p className="rx-section__subtitle">Verified companies, wholesalers & suppliers</p>
        </div>
        <Link href="/business/directory" className={cn("text-sm font-semibold text-primary hover:opacity-80", focusRing)}>
          View all →
        </Link>
      </div>

      <div
        className={cn(
          "rx-business-spotlight -mx-ds-4 px-ds-4 pb-ds-1",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="group"
        aria-roledescription="carousel"
        aria-label="Business spotlight"
      >
        {businesses.map((company) => (
          <Link
            key={company.id}
            href={`/store/${company.username}`}
            className={cn("rx-business-spotlight__card", focusRing)}
          >
            <Card padding="md" interactive className="h-full">
              <div className="flex items-start gap-ds-3">
                <Avatar src={company.avatarUrl ?? undefined} alt={company.companyName} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{company.companyName}</p>
                  <p className="truncate text-sm text-text-secondary">@{company.username}</p>
                </div>
              </div>
              {company.description ? (
                <p className="mt-ds-3 line-clamp-2 text-sm text-text-secondary">{company.description}</p>
              ) : null}
              <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                {company.verifiedBusiness ? <Badge>Verified</Badge> : null}
                {company.verifiedWholesale ? <Badge>Wholesale</Badge> : null}
                {company.verifiedManufacturer ? <Badge>Manufacturer</Badge> : null}
                <Badge>Trust {company.trustScore}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
});
