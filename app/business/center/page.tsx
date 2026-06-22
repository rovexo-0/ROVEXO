import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BusinessCenterPage } from "@/features/business/components/BusinessCenterPage";
import { getAuthContext } from "@/lib/auth/session";
import { getTrustScore } from "@/lib/trust/service";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Business Center | ROVEXO",
  description: "Business dashboard, verification, wholesale, analytics, and marketing tools.",
};

export default async function BusinessCenterRoute() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/business/center");

  const supabase = await createClient();
  const [{ data: businessAccount }, { data: profile }, trustScore] = await Promise.all([
    supabase
      .from("business_accounts")
      .select("business_name, verified_business, verified_wholesale, verified_manufacturer, verified_supplier, trust_score")
      .eq("id", auth.user.id)
      .maybeSingle(),
    supabase.from("profiles").select("username").eq("id", auth.user.id).maybeSingle(),
    getTrustScore(auth.user.id),
  ]);

  return (
    <BetaAppShell showBottomNav={false}>
      <BusinessCenterPage
        companyName={businessAccount?.business_name ?? "Your Business"}
        storeSlug={profile?.username ?? auth.user.id}
        verifiedBusiness={Boolean(businessAccount?.verified_business)}
        verifiedWholesale={Boolean(businessAccount?.verified_wholesale)}
        verifiedManufacturer={Boolean(businessAccount?.verified_manufacturer)}
        verifiedSupplier={Boolean(businessAccount?.verified_supplier)}
        trustScore={businessAccount?.trust_score ?? trustScore.score}
      />
    </BetaAppShell>
  );
}
