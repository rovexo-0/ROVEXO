import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { SellerTrustDashboard } from "@/features/trust/components/SellerTrustDashboard";
import { getAuthContext } from "@/lib/auth/session";
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

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("verified")
    .eq("id", auth.user.id)
    .maybeSingle();

  const data = await getTrustDashboardData(auth.user.id, Boolean(profile?.verified));

  return (
    <AccountCanonicalShell
      title="Seller Trust"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
    >
      <SellerTrustDashboard data={data} />
    </AccountCanonicalShell>
  );
}
