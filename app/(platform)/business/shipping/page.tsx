import { CanonicalSection, CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { PWA_BUSINESS_ACTION_EMOJI } from "@/lib/business/pwa-business-menu-v1";
import { getBusinessProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Shipping — fulfilment actions stay in Business hub. */
export default async function BusinessShippingPage() {
  await getBusinessProfile();

  return (
    <AccountCanonicalShell
      title="Shipping"
      backHref="/business/menu"
      backLabel="Business Menu"
      showHeaderTitle
      showBottomNav={false}
    >
      <CanonicalSection title="📦 Fulfilment">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            ROVEXO creates labels and tracking for Business orders. Use the actions below to ship and
            track each sale.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
      <CanonicalSection title="🧳 Actions">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Business Orders"
            description="Ship and track sales"
            href="/business/orders"
            showChevron={false}
            trailing={<span aria-hidden>›</span>}
            icon={
              <span className="ac-canonical__menu-emoji" aria-hidden>
                {PWA_BUSINESS_ACTION_EMOJI.orders}
              </span>
            }
          />
          <CanonicalMenuRow
            title="Personal Orders"
            description="Buyer & seller order hub"
            href="/orders"
            showChevron={false}
            trailing={<span aria-hidden>›</span>}
            icon={
              <span className="ac-canonical__menu-emoji" aria-hidden>
                {PWA_BUSINESS_ACTION_EMOJI.orders}
              </span>
            }
          />
          <CanonicalMenuRow
            title="Resolution Centre"
            description="Returns, refunds, and disputes"
            href="/resolution"
            showChevron={false}
            trailing={<span aria-hidden>›</span>}
            icon={
              <span className="ac-canonical__menu-emoji" aria-hidden>
                {PWA_BUSINESS_ACTION_EMOJI.resolution}
              </span>
            }
          />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
