import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

type SellerWalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function SellerWalletRoute({ searchParams }: SellerWalletRouteProps) {
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
    <WalletPage
      profile={profile}
      data={data}
      connectMessage={
        params.connect === "success"
          ? "Stripe Connect setup saved. Payouts will transfer automatically after each hold period."
          : params.connect === "refresh"
            ? "Continue Stripe Connect setup to receive automatic payouts."
            : undefined
      }
    />
  );
}
