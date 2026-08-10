import { redirect } from "next/navigation";
import { ComplianceDashboard } from "@/features/seller/compliance/ComplianceDashboard";
import {
  canAccessHmrcSellerCentre,
  resolveHmrcEligibility,
} from "@/lib/compliance/hmrc-eligibility-v1";
import { loadHmrcSellerSnapshot } from "@/lib/compliance/hmrc-seller-snapshot.server";
import { fetchProfile } from "@/lib/profile/queries";

export default async function SellerComplianceRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/seller/compliance");
  }

  // Fail closed: unauthenticated → login. Authenticated Unified Accounts may open
  // the centre (Settings LEGAL exposes HMRC to all signed-in users). Reporting
  // obligations remain seller-scoped via isReportingSubject in the snapshot engine.
  const access = resolveHmrcEligibility({
    authenticated: true,
    hasSellingActivity: Boolean(profile.capabilities?.hasSellingActivity),
    role: profile.role,
  });
  if (!canAccessHmrcSellerCentre(access)) {
    // Belt: should be unreachable after auth — never bounce authorized users to Settings.
    redirect("/account/settings?hmrc=seller_only");
  }

  const snapshot = await loadHmrcSellerSnapshot(profile);
  return <ComplianceDashboard snapshot={snapshot} />;
}
