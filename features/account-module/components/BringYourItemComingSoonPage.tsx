import { CanonicalButtonLink, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";


export function BringYourItemComingSoonPage() {
  return (
    <AccountCanonicalShell title="Bring Your Item" backHref="/account">
      <CanonicalInfoBlock variant="description">
        <p className="font-medium text-text-primary">Coming Soon</p>
        <p className="mt-ds-2 cds-menu-row__title">Import from eBay</p>
        <p className="mt-ds-2">
          Bring Your Item is finishing production certification. Marketplace buying, selling,
          checkout, and orders are unaffected.
        </p>
      </CanonicalInfoBlock>
      <CanonicalButtonLink href="/account" fullWidth className="mt-ds-4">
        Back to My Account
      </CanonicalButtonLink>
    </AccountCanonicalShell>
  );
}
