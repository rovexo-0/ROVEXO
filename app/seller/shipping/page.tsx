import { CanonicalSection, CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Selling Shipping — ROVEXO manages labels; stays in Selling hub. */
export default async function SellerShippingPage() {
  await getProfile();

  return (
    <AccountCanonicalShell
      title="Shipping"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
      intro="ROVEXO creates labels and tracking for your sales."
    >
      <CanonicalSection title="Actions">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Orders"
            description="Ship and track sales"
            href="/seller/orders"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="orders" />
              </span>
            }
          />
          <CanonicalMenuRow
            title="Returns"
            description="Returns and refunds"
            href="/resolution"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="returns" />
              </span>
            }
          />
        </CanonicalCard>
      </CanonicalSection>
      <CanonicalSection title="How it works">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            Open each sold order to print labels and share tracking. No separate carrier setup required.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
