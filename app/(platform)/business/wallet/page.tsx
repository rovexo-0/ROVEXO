import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { isBusinessVerifiedAccount } from "@/lib/verified/evaluate";

type BusinessWalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

/** Business Wallet — separate financial context (wallet_context=business). */
export default async function BusinessWalletPage({
  searchParams,
}: BusinessWalletRouteProps) {
  const profile = await getBusinessProfile();
  const params = await searchParams;

  if (params.connect === "success" || params.connect === "refresh") {
    await syncConnectAccountBySellerId(profile.id, "business");
  }

  const [data, isBusinessVerified] = await Promise.all([
    fetchWalletData("business"),
    isBusinessVerifiedAccount(profile.id).catch(() => false),
  ]);
  return (
    <WalletPage
      data={data}
      userId={profile.id}
      variant="business"
      backHref="/business/menu"
      isBusinessVerified={isBusinessVerified}
      connectMessage={
        params.connect === "success"
          ? "Business bank account setup saved. Payouts will be sent automatically after each hold period."
          : params.connect === "refresh"
            ? "Finish setting up your business bank account to receive automatic payouts."
            : undefined
      }
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Business Balance | ROVEXO",
    robots: { index: false, follow: false },
  };
}
