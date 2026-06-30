import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PlansPage } from "@/features/monetization/components/PlansPage";
import { getAuthContext } from "@/lib/auth/session";
import { getProfile } from "@/lib/profile/data";
import { getUserSubscription, listMonetizationPlans } from "@/lib/monetization/service";
import { MONETIZATION_PRODUCTS } from "@/lib/monetization/types";

export const metadata: Metadata = {
  title: "Plans & Premium | ROVEXO",
  description: "Seller, business, and wholesale subscriptions plus promotions and premium features.",
};

export default async function PlansRoute() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/plans");

  const [plans, subscription, profile] = await Promise.all([
    listMonetizationPlans(),
    getUserSubscription(auth.user.id),
    getProfile(),
  ]);

  return (
    <BetaAppShell showBottomNav={false}>
      <PlansPage
        plans={plans}
        products={MONETIZATION_PRODUCTS}
        subscription={subscription}
        profile={profile}
      />
    </BetaAppShell>
  );
}
