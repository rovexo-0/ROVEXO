import { AccountCanonicalShell } from "@/features/account-canonical";
import { getProfile } from "@/lib/profile/data";
import { fetchBusinessDashboard } from "@/lib/business/queries";
import { BusinessDashboardPage } from "@/features/business/dashboard/components/BusinessDashboardPage";
import { CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business · ROVEXO",
};

/**
 * Business — always opens Business (PO). Unverified users see Verification CTA,
 * never My Account.
 */
export default async function BusinessDashboardRoute() {
  const profile = await getProfile();

  if (!profile.capabilities.hasBusinessVerification) {
    return (
      <AccountCanonicalShell title="Business" backHref="/account" backLabel="My Account" showHeaderTitle>
        <CanonicalInfoBlock variant="description">
          Verify your business to unlock Store, Orders, Wallet, and Analytics.
        </CanonicalInfoBlock>
        <div className="cds-section">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              id="business-verify-cta"
              href="/business/verification"
              title="Verification"
              description="Start business verification"
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="verification" />
                </span>
              }
            />
          </CanonicalCard>
        </div>
      </AccountCanonicalShell>
    );
  }

  const data = await fetchBusinessDashboard(profile.id);
  return <BusinessDashboardPage data={data} />;
}
