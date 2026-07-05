import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { WalletOverview } from "@/features/wallet/components/WalletOverview";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const params = await searchParams;
  if (params.connect === "success" || params.connect === "refresh") {
    await syncConnectAccountBySellerId(profile.id);
  }

  const data = await fetchWalletData();

  return (
    <BetaAppShell showBottomNav={false}>
      <WalletOverview
        data={data}
        backHref="/seller/dashboard"
        connectMessage={
          params.connect === "success"
            ? "Bank account setup saved. Payouts will be sent automatically after each hold period."
            : params.connect === "refresh"
              ? "Finish setting up your bank account to receive automatic payouts."
              : undefined
        }
      />
    </BetaAppShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
