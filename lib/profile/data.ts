import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchCurrentProfile } from "@/lib/profile/repository";
import type { UserProfile } from "@/lib/profile/types";
import { BUSINESS_VERIFICATION_ROUTE } from "@/lib/business/access";
import {
  businessOnboardingHref,
  loadBusinessStatus,
} from "@/lib/business/business-onboarding-v1";

export async function getProfile(): Promise<UserProfile> {
  const profile = await fetchCurrentProfile();

  if (!profile) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/auth/signout?error=profile_missing");
    }

    // Session cookies may still exist when the server cannot resolve the user.
    redirect("/auth/signout");
  }

  return profile;
}

/**
 * Business surface profile. Never redirects to My Account.
 * Unverified users stay in Business → Information or Stripe Connect.
 * Stripe is the only verification authority — not ROVEXO KYC capability.
 */
export async function getBusinessProfile(): Promise<UserProfile> {
  const profile = await getProfile();
  const status = await loadBusinessStatus(profile.id);

  if (!status.stripe.verified) {
    redirect(
      status.nextStep === "information"
        ? businessOnboardingHref("information")
        : BUSINESS_VERIFICATION_ROUTE,
    );
  }

  return profile;
}
