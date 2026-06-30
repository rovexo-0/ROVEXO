import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { TrustCenterPage } from "@/features/trust/components/TrustCenterPage";
import { getAuthContext } from "@/lib/auth/session";
import { getTrustDashboardData } from "@/lib/trust/service";

export const metadata: Metadata = {
  title: "Trust Center | ROVEXO",
  description: "Trust score, verification, buyer and seller protection, disputes, and community safety.",
};

export default async function TrustPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/trust");
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("verified")
    .eq("id", auth.user.id)
    .maybeSingle();

  const data = await getTrustDashboardData(auth.user.id, Boolean(profile?.verified));

  return (
    <BetaAppShell showBottomNav={false}>
      <TrustCenterPage data={data} />
    </BetaAppShell>
  );
}
