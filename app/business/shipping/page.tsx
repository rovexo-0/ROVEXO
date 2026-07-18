import { CanonicalSection, CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { getBusinessProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Shipping — fulfilment actions stay in Business hub. */
export default async function BusinessShippingPage() {
  await getBusinessProfile();

  return (
    <AccountCanonicalShell
      title="Shipping"
      backHref="/business/dashboard"
      backLabel="Business"
      showHeaderTitle
      showBottomNav={false}
    >
      <CanonicalSection title="Fulfilment">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            ROVEXO creates labels and tracking for Business orders. Use the actions below to ship and
            track each sale.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
      <CanonicalSection title="Actions">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Business Orders"
            description="Ship and track sales"
            href="/business/orders"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="orders" />
              </span>
            }
          />
          <CanonicalMenuRow
            title="Personal Orders"
            description="Buyer & seller order hub"
            href="/orders"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="orders" />
              </span>
            }
          />
          <CanonicalMenuRow
            title="Resolution Centre"
            description="Returns, refunds, and disputes"
            href="/resolution"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="returns" />
              </span>
            }
          />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
