import { WalletPage, resolveWalletShowStatements } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  const profile = await fetchProfile();

  if (!profile) {
    redirect("/login?next=/wallet");
  }

  // Buyers manage saved cards only — seller wallet hub is for selling funds.
  if (!profile.isSeller) {
    redirect(WALLET_ROUTES.paymentMethods);
  }

  const params = await searchParams;
  if (params.connect === "success" || params.connect === "refresh") {
    await syncConnectAccountBySellerId(profile.id);
  }

  const data = await fetchWalletData();
  const showStatements = await resolveWalletShowStatements(profile.id);

  return (
    <WalletPage
      data={data}
      backHref="/account"
      showStatements={showStatements}
      connectMessage={
        params.connect === "success"
          ? "Bank account setup saved. Payouts will be sent automatically after each hold period."
          : params.connect === "refresh"
            ? "Finish setting up your bank account to receive automatic payouts."
            : undefined
      }
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
