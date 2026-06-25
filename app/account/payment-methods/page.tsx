import { Suspense } from "react";
import { PaymentMethodsPage } from "@/features/account/components/PaymentMethodsPage";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Payment Methods",
};

export default async function AccountPaymentMethodsRoute() {
  const profile = await getProfile();

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading payment methods…</div>}>
      <PaymentMethodsPage profile={profile} />
    </Suspense>
  );
}
