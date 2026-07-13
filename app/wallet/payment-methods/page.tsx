import { Suspense } from "react";
import { WalletPaymentMethodsPage } from "@/features/wallet/components/WalletPaymentMethodsPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Payment Methods | Wallet | ROVEXO",
  description: "Manage saved cards, bank account, and payment options.",
};

export default async function WalletPaymentMethodsRoute() {
  const profile = await getProfile();

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading payment methods…</div>}>
      <WalletPaymentMethodsPage profile={profile} />
    </Suspense>
  );
}
