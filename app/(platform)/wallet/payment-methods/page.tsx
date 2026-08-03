import { Suspense } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { WalletPaymentMethodsPage } from "@/features/wallet/components/WalletPaymentMethodsPage";
import { listUserAddresses } from "@/lib/addresses/repository";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { CanonicalMenuRow } from "@/src/components/canonical";

export const metadata = {
  ...privatePageMetadata,
  title: "Payment Methods | Balance | ROVEXO",
  description: "Manage saved cards and wallet payment options securely with Stripe.",
};

function PaymentMethodsFallback() {
  return (
    <AccountCanonicalShell
      title="Payment Methods"
      backHref="/balance"
      backLabel="Balance"
      showHeaderTitle
    >
      <CanonicalMenuRow title="Loading…" description="Payment methods" showChevron={false} />
    </AccountCanonicalShell>
  );
}

export default async function WalletPaymentMethodsRoute() {
  const profile = await getProfile();

  let billingConfigured = false;
  try {
    const addresses = await listUserAddresses(profile.id);
    billingConfigured = addresses.length > 0;
  } catch {
    // Address / DB fail → Empty State ("Manage your billing details"), never error page
    billingConfigured = false;
  }

  return (
    <Suspense fallback={<PaymentMethodsFallback />}>
      <WalletPaymentMethodsPage profile={profile} billingConfigured={billingConfigured} />
    </Suspense>
  );
}
