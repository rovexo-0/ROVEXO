import { CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

/**
 * About ROVEXO — shared informational page.
 * Links only to existing Help / Legal / Support surfaces. No invented claims.
 */
export function AboutPage() {
  return (
    <AccountCanonicalShell title="About ROVEXO" backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <div className="fw-engine__stack" data-full-width-surface="about">
        <CanonicalInfoBlock variant="description">BUY · SELL · GROW</CanonicalInfoBlock>

        <CanonicalSection title="About ROVEXO">
          <CanonicalInfoBlock variant="description">
            ROVEXO is a UK marketplace for buying and selling. One account can buy and sell. Independent
            sellers remain responsible for their listings, pricing, and dispatch under ROVEXO policies and
            applicable UK law.
          </CanonicalInfoBlock>
        </CanonicalSection>

        <CanonicalSection title="How ROVEXO Works">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Help Centre" description="Guides for buying, selling, and account" href="/help" />
            <CanonicalMenuRow title="Search" description="Find listings on the marketplace" href="/search" />
            <CanonicalMenuRow title="Sell" description="Publish a listing" href="/sell" />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Buyer Protection">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Buying help"
              description="Checkout, offers, and purchase help"
              href="/help/buying-buyer-protection"
            />
            <CanonicalMenuRow
              title="Buyer Protection (Legal)"
              description="Official buyer protection document"
              href="/legal/buyer-protection"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Seller Protection">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Selling help" description="Listings, payouts, and seller tools" href="/help/category/seller" />
            <CanonicalMenuRow
              title="Seller Protection (Legal)"
              description="Official seller protection document"
              href="/legal/seller-protection"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Trust & Safety">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Safety" description="Scams, reporting, and staying on-platform" href="/help/category/safety" />
            <CanonicalMenuRow title="Trust Centre" description="Trust and verification information" href="/trust" />
            <CanonicalMenuRow
              title="Community Guidelines"
              description="Expected behaviour on ROVEXO"
              href="/legal/community-guidelines"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Payments">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Payments & Wallet"
              description="Checkout, Balance, and fees"
              href="/help/category/payments"
            />
            <CanonicalMenuRow
              title="Platform Fee Policy"
              description="Official fee document"
              href="/legal/platform-fee-policy"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Shipping">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Shipping help" description="Delivery options and tracking" href="/help/category/shipping" />
            <CanonicalMenuRow title="Shipping Policy" description="Official shipping document" href="/legal/shipping-policy" />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Contact">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Contact Support" description="Submit a support request" href="/support" />
            <CanonicalMenuRow title="Privacy Policy" description="How ROVEXO uses personal data" href="/legal/privacy-policy" />
            <CanonicalMenuRow
              title="Privacy Settings"
              description="Manage privacy controls on your account"
              href="/account/privacy"
            />
            <CanonicalMenuRow title="Legal Centre" description="Official ROVEXO legal documents" href="/legal" />
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
