import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { resolveWalletBalanceView } from "@/lib/wallet/money-states";
import { formatCurrency } from "@/lib/wallet/utils";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { redirect } from "next/navigation";

export default async function WalletLockedPage() {
  const profile = await fetchProfile();
  if (!profile) redirect(`/login?next=${WALLET_ROUTES.locked}`);

  const data = await fetchWalletData("individual");
  const balances = resolveWalletBalanceView(data);
  const hasLocked = balances.locked > 0;

  return (
    <AccountCanonicalShell
      title="Locked"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Locked funds">
        <CanonicalInfoBlock variant="description">
          Funds held for open disputes, claims, or security locks. Locked money cannot be withdrawn
          until the case is resolved.
        </CanonicalInfoBlock>

        <CanonicalSection title="Amount">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Locked Balance"
              value={formatCurrency(balances.locked)}
              showChevron={false}
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Disputes">
          <div className="fw-engine__group">
            {hasLocked ? (
              <CanonicalMenuRow
                title="Open Resolution Centre"
                description="Review disputes and claims linked to locked funds."
                href="/resolution?type=dispute"
              />
            ) : (
              <CanonicalMenuRow title="No locked funds from disputes." showChevron={false} />
            )}
          </div>
        </CanonicalSection>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Locked | Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
