import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { BusinessDirectoryEntry } from "@/lib/business/directory";

type BusinessDirectoryPageProps = {
  companies: BusinessDirectoryEntry[];
};

export function BusinessDirectoryPage({ companies }: BusinessDirectoryPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8 px-ds-4 py-ds-6">
      <section>
        <Link href="/business/center" className="text-sm font-medium text-primary hover:underline">
          ← Business Center
        </Link>
        <h1 className="mt-ds-3 text-3xl font-bold text-text-primary">Business Directory</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Verified companies, manufacturers, suppliers, and wholesale partners.
        </p>
      </section>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.length ? (
          companies.map((company) => (
            <Link key={company.id} href={`/store/${company.username}`}>
              <Card padding="md" interactive className="h-full">
                <div className="flex items-start gap-ds-3">
                  <Avatar src={company.avatarUrl ?? undefined} alt={company.companyName} size="md" />
                  <div>
                    <p className="font-semibold text-text-primary">{company.companyName}</p>
                    <p className="text-sm text-text-secondary">@{company.username}</p>
                  </div>
                </div>
                {company.description ? (
                  <p className="mt-ds-3 line-clamp-2 text-sm text-text-secondary">{company.description}</p>
                ) : null}
                <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                  {company.verifiedBusiness ? <Badge>Verified Business</Badge> : null}
                  {company.verifiedWholesale ? <Badge>Wholesale</Badge> : null}
                  {company.verifiedManufacturer ? <Badge>Manufacturer</Badge> : null}
                  {company.verifiedSupplier ? <Badge>Supplier</Badge> : null}
                  <Badge>Trust {company.trustScore}</Badge>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card padding="lg" className="col-span-full">
            <p className="text-sm text-text-secondary">No business profiles are listed yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
