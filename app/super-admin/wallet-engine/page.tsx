import { WalletEngineAdmin } from "@/features/super-admin/wallet-engine/WalletEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getWalletEngineSnapshot } from "@/lib/wallet-engine/reader";

export default async function SuperAdminWalletEnginePage() {
  const snapshot = await getWalletEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Wallet Engine"
        description="Enterprise digital wallet — balances, payouts, transactions, integrations, and purchase protection."
      />
      <WalletEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Wallet Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
