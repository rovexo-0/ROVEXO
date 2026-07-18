import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatCurrency } from "@/lib/wallet/utils";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function WalletPendingPage() {
  const profile = await fetchProfile();
  if (!profile) redirect("/login?next=/wallet/pending");

  const data = await fetchWalletData();

  return (
    <AccountCanonicalShell
      title="Pending"
      backHref="/wallet"
      backLabel="Wallet"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Pending funds">
        <CanonicalInfoBlock variant="description">
          Funds held during the protection period before withdrawal.
        </CanonicalInfoBlock>

        <CanonicalSection title="Balance">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Pending" value={formatCurrency(data.pendingBalance)} showChevron={false} />
            {data.pendingAvailableAt ? (
              <CanonicalMenuRow
                title="Available from"
                value={new Date(data.pendingAvailableAt).toLocaleDateString("en-GB")}
                showChevron={false}
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Pending Funds | ROVEXO",
    robots: { index: false, follow: false },
  };
}
