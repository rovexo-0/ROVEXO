import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  createConnectAccountLink,
  createConnectManageLink,
  resolveConnectAccountIdForContext,
} from "@/lib/stripe/connect";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";

/**
 * Stripe Connect management / onboarding for the authenticated ROVEXO user.
 * Unified account: any authenticated user may manage their own Connect context.
 * seller_context is authoritative — Business never resolves to Individual.
 */
export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  let context: "individual" | "business" = "individual";
  let intent: "onboard" | "manage" = "manage";
  try {
    const body = (await request.json().catch(() => ({}))) as {
      context?: string;
      intent?: string;
      /** Client must never supply Stripe account ids — ignored if present. */
      stripeAccountId?: unknown;
      accountId?: unknown;
    };
    void body.stripeAccountId;
    void body.accountId;
    context = normalizeSellerContext(body.context);
    intent = body.intent === "onboard" ? "onboard" : "manage";
  } catch {
    context = "individual";
    intent = "manage";
  }

  if (context === "business") {
    const status = await loadBusinessStatus(auth.user.id).catch(() => null);
    const admin = createAdminClient();
    const { data: sellerProfile } = await admin
      .from("seller_profiles")
      .select(
        "stripe_connect_account_id, stripe_connect_account_id_individual, stripe_connect_account_id_business",
      )
      .eq("id", auth.user.id)
      .maybeSingle();
    const businessAccountId = resolveConnectAccountIdForContext(sellerProfile, "business");

    // Fail closed: Business context requires Business onboarding eligibility or an
    // existing Business Connect account. Never fall back to Individual.
    if (!businessAccountId && !status?.stripe?.verified && status?.nextStep === "information") {
      return NextResponse.json(
        {
          success: false,
          error: "Complete Business Information before connecting a business payout account.",
          code: "business_information_required",
          actionable: "retry",
          context,
        },
        { status: 400 },
      );
    }
  }

  const result =
    intent === "onboard"
      ? await createConnectAccountLink(auth.user.id, context)
      : await createConnectManageLink(auth.user.id, context);

  if ("error" in result) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        code: "code" in result ? result.code : "stripe_connect_link_failed",
        actionable: "resolve_on_stripe",
        context,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    context,
    intent: "intent" in result ? result.intent : intent,
  });
}
