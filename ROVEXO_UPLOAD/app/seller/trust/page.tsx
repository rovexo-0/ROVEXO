import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SellerTrustDashboard } from "@/features/trust/components/SellerTrustDashboard";
import { getAuthContext, getUserRole, isSellerRole } from "@/lib/auth/session";
import { getTrustDashboardData } from "@/lib/trust/service";

export const metadata: Metadata = {
  title: "Seller Trust Dashboard | ROVEXO",
  description: "Monitor your trust score, history, and improvement recommendations.",
};

export default async function SellerTrustPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/seller/trust");
  }

  const role = await getUserRole(auth.user.id);
  if (!role || !isSellerRole(role)) {
    redirect("/account");
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("verified")
    .eq("id", auth.user.id)
    .maybeSingle();

  const data = await getTrustDashboardData(auth.user.id, Boolean(profile?.verified));

  return (
    <BetaAppShell showBottomNav={false}>
      <SellerTrustDashboard data={data} />
    </BetaAppShell>
  );
}
