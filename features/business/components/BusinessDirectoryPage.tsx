import { Avatar } from "@/components/ui/Avatar";
import { BusinessBadge, resolveBusinessBadgeKinds } from "@/components/ui/BusinessBadge";
import { Badge } from "@/components/ui/Badge";
import type { BusinessDirectoryEntry } from "@/lib/business/directory";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type BusinessDirectoryPageProps = {
  companies: BusinessDirectoryEntry[];
};

export function BusinessDirectoryPage({ companies }: BusinessDirectoryPageProps) {
  return (
    <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
      <CanonicalSection
        title="Directory"
        intro="Verified companies, manufacturers, suppliers, and wholesale partners."
      >
        {companies.length ? (
          <CanonicalCard variant="list">
            {companies.map((company) => {
              const badges = resolveBusinessBadgeKinds({
                verifiedBusiness: company.verifiedBusiness,
                verifiedWholesale: company.verifiedWholesale,
                verifiedManufacturer: company.verifiedManufacturer,
                verifiedSupplier: company.verifiedSupplier,
              });

              return (
                <CanonicalMenuRow
                  key={company.id}
                  href={`/store/${company.username}`}
                  title={company.companyName}
                  description={
                    company.description
                      ? `@${company.username} · ${company.description}`
                      : `@${company.username}`
                  }
                  icon={
                    <Avatar
                      src={company.avatarUrl ?? undefined}
                      alt={company.companyName}
                      size="sm"
                    />
                  }
                  trailing={
                    <span className="flex flex-wrap items-center justify-end gap-ds-1">
                      {badges.map((kind) => (
                        <BusinessBadge key={kind} kind={kind} compact />
                      ))}
                      <Badge>Trust {company.trustScore}</Badge>
                    </span>
                  }
                />
              );
            })}
          </CanonicalCard>
        ) : (
          <CanonicalInfoBlock variant="description">
            No business profiles are listed yet.
          </CanonicalInfoBlock>
        )}
      </CanonicalSection>
    </div>
  );
}
