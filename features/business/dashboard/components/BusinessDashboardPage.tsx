import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessMenuSections } from "@/features/business/dashboard/components/BusinessMenuSections";
import type { BusinessDashboardData } from "@/lib/business/types";

type BusinessDashboardPageProps = {
  data: BusinessDashboardData;
};

/** Business hub — Master Menu (PO). Bottom nav visible. */
export function BusinessDashboardPage({ data }: BusinessDashboardPageProps) {
  return (
    <AccountCanonicalShell
      title="Business"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
    >
      <BusinessMenuSections storeSlug={data.company.storeSlug} />
    </AccountCanonicalShell>
  );
}
