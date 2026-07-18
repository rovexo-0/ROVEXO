import { AccountCanonicalShell } from "@/features/account-canonical";
import { formatCurrency } from "@/lib/wallet/utils";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";
import { CanonicalCard, CanonicalInfoBlock } from "@/src/components/canonical";

export default async function WalletPendingPage() {
  const profile = await fetchProfile();
  if (!profile) redirect("/login?next=/wallet/pending");

  const data = await fetchWalletData();

  return (
    <AccountCanonicalShell
      title="Pending Funds"
      backHref="/wallet"
      backLabel="Personal Wallet"
      showHeaderTitle
    >
      <CanonicalCard variant="list" className="px-ds-4 py-ds-4">
        <CanonicalInfoBlock variant="description">
          Funds held during the UK marketplace protection period before they become available to withdraw.
        </CanonicalInfoBlock>
        <p className="mt-ds-3 text-sm text-text-secondary">Pending</p>
        <p className="text-lg font-semibold text-text-primary">{formatCurrency(data.pendingBalance)}</p>
        {data.pendingAvailableAt ? (
          <p className="mt-ds-2 text-sm text-text-secondary">
            Available from {new Date(data.pendingAvailableAt).toLocaleDateString("en-GB")}
          </p>
        ) : null}
      </CanonicalCard>
    </AccountCanonicalShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Pending Funds | ROVEXO",
    robots: { index: false, follow: false },
  };
}
