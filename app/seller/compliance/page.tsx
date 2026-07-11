import { redirect } from "next/navigation";
import { ComplianceDashboard } from "@/features/seller/compliance/ComplianceDashboard";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import { buildAnnualStatementsForUser } from "@/lib/wallet/monthly-statements";
import { fetchProfile } from "@/lib/profile/queries";

export default async function SellerComplianceRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/seller/compliance");
  }

  const [taxProfile, annualStatements] = await Promise.all([
    getSellerTaxProfile(profile.id),
    buildAnnualStatementsForUser(profile.id),
  ]);

  return <ComplianceDashboard taxProfile={taxProfile} annualStatements={annualStatements} />;
}
