import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SellerPerformanceDashboardView } from "@/features/seller-performance/components/SellerPerformanceDashboardView";
import { getAuthContext, getUserRole, isSellerRole } from "@/lib/auth/session";
import { getSellerPerformanceDashboard } from "@/lib/seller-performance/service";

export const metadata: Metadata = {
  title: "Seller Performance | ROVEXO",
  description: "Official ROVEXO Reputation Engine — seller score, level, and achievements.",
};

export default async function SellerPerformancePage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/seller/performance");
  }

  const role = await getUserRole(auth.user.id);
  if (!role || !isSellerRole(role)) {
    redirect("/account");
  }

  const data = await getSellerPerformanceDashboard(auth.user.id);

  return (
    <BetaAppShell showBottomNav={false}>
      <SellerPerformanceDashboardView data={data} />
    </BetaAppShell>
  );
}
