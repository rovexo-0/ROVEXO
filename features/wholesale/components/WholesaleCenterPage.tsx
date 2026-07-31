import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { RfqSubmitForm } from "@/features/wholesale/components/RfqSubmitForm";
import { WholesalePricingManager } from "@/features/wholesale/components/WholesalePricingManager";
import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { RfqRequest, WholesaleAccount } from "@/lib/wholesale/types";
import { WHOLESALE_FEATURES } from "@/lib/wholesale/types";

type WholesaleCenterPageProps = {
  account: WholesaleAccount | null;
  rfqs: RfqRequest[];
};

const QUICK_LINKS = [
  { href: "/seller/listings", label: "Bulk pricing" },
  { href: "/plans", label: "Wholesale plans" },
  { href: "/help/category/wholesale", label: "Wholesale help" },
  { href: "/account/verification", label: "Verification" },
  { href: "/seller", label: "Selling" },
] as const;

export function WholesaleCenterPage({ account, rfqs }: WholesaleCenterPageProps) {
  return (
    <AccountCanonicalShell
      title="Wholesale"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      showBottomNav={false}
      intro="MOQ, bulk pricing, RFQ."
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
        <CanonicalSection title="Links">
          <CanonicalCard variant="list">
            {QUICK_LINKS.map((link) => (
              <CanonicalMenuRow key={link.href} title={link.label} href={link.href} />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Account">
          <CanonicalCard variant="list">
            {account ? (
              <>
                <CanonicalMenuRow title="Company" value={account.companyName} showChevron={false} />
                <CanonicalMenuRow title="Type" value={account.accountType} showChevron={false} />
                <CanonicalMenuRow title="Default MOQ" value={String(account.moqDefault)} showChevron={false} />
                <CanonicalMenuRow
                  title="Verified"
                  value={account.verified ? "Yes" : "No"}
                  showChevron={false}
                />
                <CanonicalMenuRow
                  title="Bulk pricing"
                  value={account.bulkPricingEnabled ? "On" : "Off"}
                  showChevron={false}
                />
                <CanonicalMenuRow title="RFQ" value={account.rfqEnabled ? "On" : "Off"} showChevron={false} />
              </>
            ) : (
              <CanonicalInfoBlock variant="description">
                <p className="font-medium text-text-primary">No wholesale account</p>
                <CanonicalButtonLink href="/account/verification" variant="secondary" className="mt-ds-3">
                  Complete verification
                </CanonicalButtonLink>
              </CanonicalInfoBlock>
            )}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Bulk pricing" card>
          {account?.bulkPricingEnabled ? (
            <WholesalePricingManager />
          ) : (
            <CanonicalInfoBlock variant="description">
              <p className="text-sm text-text-secondary">
                Enable bulk pricing from{" "}
                <Link href="/seller/listings" className="text-primary underline">
                  your listings
                </Link>
                .
              </p>
            </CanonicalInfoBlock>
          )}
        </CanonicalSection>

        <CanonicalSection title="Features">
          <CanonicalCard variant="list">
            {WHOLESALE_FEATURES.map((feature) => (
              <CanonicalMenuRow key={feature.id} title={feature.title} showChevron={false} />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Submit RFQ" card>
          <RfqSubmitForm />
        </CanonicalSection>

        <CanonicalSection title="Open RFQs">
          <CanonicalCard variant="list">
            {rfqs.length ? (
              rfqs.map((rfq) => (
                <CanonicalMenuRow
                  key={rfq.id}
                  title={rfq.title}
                  description={rfq.description}
                  value={rfq.premium ? "Premium" : `Qty ${rfq.quantity}`}
                  showChevron={false}
                />
              ))
            ) : (
              <CanonicalMenuRow title="No open RFQs" showChevron={false} disabled />
            )}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
