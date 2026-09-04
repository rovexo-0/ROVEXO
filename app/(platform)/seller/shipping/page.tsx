import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { SellerShippingSettingsForm } from "@/features/seller/components/SellerShippingSettingsForm";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Selling Shipping — defaults form + ROVEXO label actions. */
export default async function SellerShippingPage() {
  await getProfile();

  return (
    <AccountCanonicalShell
      title="Shipping"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
      intro="Set defaults once. ROVEXO creates labels and tracking on each sale."
    >
      <SellerShippingSettingsForm />

      <CanonicalSection title="Actions">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Seller setup"
            description="Payouts, shipping and store checklist"
            href="/seller/setup"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="sell" />
              </span>
            }
          />
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
            Open each sold order to print labels and share tracking. Carrier defaults above are
            applied automatically — no separate carrier account setup.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
