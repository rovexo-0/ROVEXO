/**
 * ROVEXO Verified Engine v1.0 — evaluation (fail closed).
 * Uses existing tables only. No schema migrations. No admin override.
 */

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isFullDemoEmail } from "@/lib/full-demo/canonical";
import { ROVEXO_VERIFIED_ENGINE_VERSION } from "@/lib/verified/constants";
import { evaluateDataMatch } from "@/lib/verified/data-match";
import type {
  RovexoVerifiedCheck,
  RovexoVerifiedEvaluation,
  RovexoVerifiedPath,
} from "@/lib/verified/types";

function failClosed(
  userId: string,
  path: RovexoVerifiedPath,
  checks: RovexoVerifiedCheck[],
  reason: string,
): RovexoVerifiedEvaluation {
  const failedChecks = checks.filter((c) => c.required && !c.pass).map((c) => c.id);
  return {
    version: ROVEXO_VERIFIED_ENGINE_VERSION,
    userId,
    path,
    isVerified: false,
    checks,
    failedChecks,
    reason,
  };
}

function resolvePath(companyType: string | null | undefined): RovexoVerifiedPath {
  const raw = (companyType ?? "").toLowerCase();
  if (
    raw.includes("limited") ||
    raw.includes("ltd") ||
    raw.includes("company") ||
    raw === "business_company"
  ) {
    return "ltd_company";
  }
  if (
    raw.includes("sole") ||
    raw.includes("self") ||
    raw.includes("trader") ||
    raw === "business_sole_trader"
  ) {
    return "self_employed";
  }
  return "personal";
}

/**
 * Evaluates ROVEXO VERIFIED for a user. Fail closed when admin client or data is unavailable.
 */
export async function evaluateRovexoVerified(userId: string): Promise<RovexoVerifiedEvaluation> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return failClosed(userId, "personal", [], "Verification service unavailable.");
  }

  const [
    profileResult,
    verificationsResult,
    paymentsResult,
    payoutMethodsResult,
    businessResult,
    connectResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email, phone, verified")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("trust_verifications")
      .select("verification_type, status")
      .eq("user_id", userId)
      .eq("status", "approved"),
    admin
      .from("payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("withdraw_methods")
      .select("id, provider, account_holder_name, connected, seller_context")
      .eq("user_id", userId)
      .eq("connected", true)
      .in("provider", ["bank_account", "stripe_connect"]),
    admin
      .from("business_accounts")
      .select("business_name, company_type, verified_business")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("seller_tax_profiles")
      .select("stripe_connect_completed")
      .eq("seller_id", userId)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    return failClosed(userId, "personal", [], "Profile not found.");
  }

  // Permanent Full Demo contract — always ROVEXO VERIFIED.
  if (isFullDemoEmail(profile.email)) {
    return {
      version: ROVEXO_VERIFIED_ENGINE_VERSION,
      userId,
      path: "personal",
      isVerified: true,
      checks: [],
      failedChecks: [],
      reason: null,
    };
  }

  let emailConfirmed = false;
  try {
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    emailConfirmed = Boolean(authData.user?.email_confirmed_at);
  } catch {
    emailConfirmed = false;
  }

  const approved = new Set(
    ((verificationsResult.data ?? []) as Array<{ verification_type: string }>).map(
      (row) => row.verification_type,
    ),
  );

  const path = resolvePath(businessResult.data?.company_type);
  const hasPaymentMethods = (paymentsResult.count ?? 0) > 0;
  const payoutMethods = (payoutMethodsResult.data ?? []) as Array<{
    provider: string;
    account_holder_name: string | null;
    connected: boolean;
    seller_context: string | null;
  }>;

  const isIndividualContext = (ctx: string | null) =>
    ctx == null || ctx === "" || ctx === "individual";

  const individualMethods = payoutMethods.filter((m) => isIndividualContext(m.seller_context));
  const businessMethods = payoutMethods.filter((m) => m.seller_context === "business");

  const hasIndividualBank = individualMethods.some((m) => m.provider === "bank_account");
  const hasIndividualConnect = individualMethods.some((m) => m.provider === "stripe_connect");
  const hasBusinessBank = businessMethods.some((m) => m.provider === "bank_account");
  const hasBusinessConnect = businessMethods.some((m) => m.provider === "stripe_connect");

  const hasBank = hasIndividualBank || hasIndividualConnect;
  const bankHolder =
    individualMethods.find((m) => m.provider === "bank_account" && m.account_holder_name)
      ?.account_holder_name ?? null;
  /** Stripe Connect collects bank identity — use profile name for data-match when Connect-ready. */
  const accountHolderName =
    bankHolder ?? (hasIndividualConnect ? profile.full_name : null);

  const emailPass =
    Boolean(profile.email?.includes("@")) && (emailConfirmed || approved.has("email"));
  const phonePass = Boolean(profile.phone?.trim()) && approved.has("phone");
  const paymentPass = hasPaymentMethods;
  const bankPass = hasBank;
  const identityPass = approved.has("identity");
  const stripeConnectOk =
    Boolean(connectResult.data?.stripe_connect_completed) ||
    hasIndividualConnect ||
    hasBusinessConnect;
  const kycPass = identityPass && approved.has("payment") && (stripeConnectOk || hasBank);
  const companyPass = Boolean(businessResult.data?.verified_business);
  const directorPass = identityPass;
  const businessBankPass = (hasBusinessBank || hasBusinessConnect) && companyPass;

  const dataMatch = evaluateDataMatch({
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    accountHolderName,
    businessName: businessResult.data?.business_name,
    companyName: businessResult.data?.business_name,
  });

  let checks: RovexoVerifiedCheck[] = [];

  if (path === "ltd_company") {
    checks = [
      { id: "company_verification", label: "Company Verification", pass: companyPass, required: true },
      { id: "director_verification", label: "Director Verification", pass: directorPass, required: true },
      { id: "business_bank_account", label: "Business Bank Account", pass: businessBankPass, required: true },
      { id: "payment_methods", label: "Payment Methods", pass: paymentPass, required: true },
      { id: "data_match", label: "Data Match", pass: dataMatch.pass, required: true },
    ];
  } else if (path === "self_employed") {
    checks = [
      { id: "identity", label: "Identity", pass: identityPass, required: true },
      { id: "payment_methods", label: "Payment Methods", pass: paymentPass, required: true },
      { id: "bank_account", label: "Personal Bank Account", pass: bankPass, required: true },
      { id: "data_match", label: "Data Match", pass: dataMatch.pass, required: true },
    ];
  } else {
    checks = [
      { id: "email", label: "Email", pass: emailPass, required: true },
      { id: "phone", label: "Phone", pass: phonePass, required: true },
      { id: "payment_methods", label: "Payment Methods", pass: paymentPass, required: true },
      { id: "bank_account", label: "Bank Account", pass: bankPass, required: true },
      { id: "identity", label: "Identity", pass: identityPass, required: true },
      { id: "data_match", label: "Data Match", pass: dataMatch.pass, required: true },
      { id: "kyc", label: "KYC", pass: kycPass, required: true },
    ];
  }

  const failed = checks.filter((c) => c.required && !c.pass);
  if (failed.length > 0) {
    return failClosed(
      userId,
      path,
      checks,
      `Verification incomplete: ${failed.map((c) => c.label).join(", ")}.`,
    );
  }

  return {
    version: ROVEXO_VERIFIED_ENGINE_VERSION,
    userId,
    path,
    isVerified: true,
    checks,
    failedChecks: [],
    reason: null,
  };
}

/** Lightweight business-verified flag for Smart Visibility (existing business_accounts). */
export async function isBusinessVerifiedAccount(userId: string): Promise<boolean> {
  const admin = tryCreateAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from("business_accounts")
    .select("verified_business")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.verified_business);
}

/** Read-only: whether profiles.verified is currently true (display cache). */
export async function readCachedRovexoVerified(userId: string): Promise<boolean> {
  try {
    const admin = tryCreateAdminClient();
    if (!admin) return false;
    const { data } = await admin.from("profiles").select("verified").eq("id", userId).maybeSingle();
    return Boolean(data?.verified);
  } catch {
    return false;
  }
}
