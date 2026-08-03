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

  // Fail closed for pure buyers — seller-only HMRC Reporting Centre.
  const access = resolveHmrcEligibility({
    authenticated: true,
    hasSellingActivity: Boolean(profile.capabilities?.hasSellingActivity),
    role: profile.role,
  });
  if (!canAccessHmrcSellerCentre(access)) {
    redirect("/account/settings?hmrc=seller_only");
  }

  const snapshot = await loadHmrcSellerSnapshot(profile);
  return <ComplianceDashboard snapshot={snapshot} />;
}
