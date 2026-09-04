/**
 * ROVEXO Business onboarding + reversible seller_context switch.
 *
 * One ROVEXO Account. Stripe Connect is the only Business verification authority.
 * Never marks verified from Business Information form submit.
 * Never creates a second user, listings, checkout, wallet, or shipping engine.
 *
 * Client UI must import schema/types from `business-onboarding-contract-v1.ts`.
 */

import "server-only";

import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import {
  createUserAddress,
  getDefaultAddress,
  listUserAddresses,
  updateUserAddress,
  type UserAddress,
} from "@/lib/addresses/repository";
import { ADDRESS_SCOPE_TO_STORAGE } from "@/lib/addresses/canonical";
import {
  isSellerContext,
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";
import {
  createConnectAccountLink,
  syncConnectAccountBySellerId,
} from "@/lib/stripe/connect";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertSellerTaxProfile, getSellerTaxProfile } from "@/lib/seller/tax/service";
import type { SellerRegistrationType } from "@/lib/seller/tax/types";
import { getWalletData } from "@/lib/wallet/store";
import { getInventoryOverview } from "@/lib/business/inventory";
import { getSellerAnalyticsData } from "@/lib/analytics/store";
import { resolveBusinessConnectAppBase } from "@/lib/business/business-connect-runtime-origin-v1";
import {
  type BusinessConnectSurface,
  type BusinessInformationInput,
  type BusinessProfilePayload,
  type BusinessRegistrationType,
  type BusinessStatusSnapshot,
  type BusinessStripeStatus,
  BUSINESS_ONBOARDING_ENGINE,
  deriveBusinessStripeState,
  isBusinessRegistrationType,
  resolveBusinessNextStep,
} from "@/lib/business/business-onboarding-contract-v1";

export { resolveBusinessConnectAppBase } from "@/lib/business/business-connect-runtime-origin-v1";

export {
  BUSINESS_ONBOARDING_ENGINE,
  BUSINESS_TYPE_OPTIONS,
  accountBusinessEntryHref,
  businessInformationSchema,
  businessOnboardingHref,
  deriveBusinessStripeState,
  isBusinessRegistrationType,
  isStripeBusinessVerified,
  resolveBusinessNextStep,
} from "@/lib/business/business-onboarding-contract-v1";
export type {
  BusinessConnectSurface,
  BusinessInformationInput,
  BusinessOnboardingStep,
  BusinessProfilePayload,
  BusinessRegistrationType,
  BusinessStatusSnapshot,
  BusinessStripeState,
  BusinessStripeStatus,
} from "@/lib/business/business-onboarding-contract-v1";

function toRegistrationType(type: BusinessRegistrationType): SellerRegistrationType {
  return type;
}

function mapCompanyType(raw: string | null | undefined): BusinessRegistrationType | null {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "business_company" || value.includes("limited") || value.includes("ltd") || value.includes("company")) {
    return "business_company";
  }
  if (
    value === "business_sole_trader" ||
    value.includes("sole") ||
    value.includes("trader") ||
    value.includes("self")
  ) {
    return "business_sole_trader";
  }
  return isBusinessRegistrationType(raw) ? raw : null;
}

async function ensureSellerProfileRow(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("seller_profiles").upsert(
    {
      id: userId,
      active_seller_context: "individual",
    } as never,
    { onConflict: "id", ignoreDuplicates: true },
  );
}

function composeRegisteredAddress(input: {
  addressLine: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
}): string {
  return [input.addressLine, input.addressLine2, input.city, input.postcode, input.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export async function persistBusinessInformation(
  userId: string,
  input: BusinessInformationInput,
): Promise<{ profile: BusinessProfilePayload }> {
  const admin = createAdminClient();
  await ensureSellerProfileRow(userId);

  const existing = await admin
    .from("business_accounts")
    .select("id, verified_business")
    .eq("id", userId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await admin
      .from("business_accounts")
      .update({
        business_name: input.businessName,
        company_type: input.businessType,
      } as never)
      .eq("id", userId);
    if (error) {
      throw new Error("Unable to save business information.");
    }
  } else {
    const { error } = await admin.from("business_accounts").insert({
      id: userId,
      business_name: input.businessName,
      company_type: input.businessType,
      description: "",
      verified_business: false,
    } as never);
    if (error) {
      throw new Error("Unable to save business information.");
    }
  }

  const existingTax = await getSellerTaxProfile(userId).catch(() => null);
  const tax = await upsertSellerTaxProfile({
    sellerId: userId,
    registrationType: toRegistrationType(input.businessType),
    fullName: input.businessName,
    email: input.contactEmail,
    addressLine1: input.addressLine,
    addressLine2: input.addressLine2 || undefined,
    city: input.city,
    postcode: input.postcode,
    country: "GB",
    phone: existingTax?.phone ?? undefined,
    nino: existingTax?.nino ?? undefined,
    utr: existingTax?.utr ?? undefined,
    companyName: input.businessName,
    companyNumber: existingTax?.companyNumber ?? undefined,
    registeredAddress: composeRegisteredAddress(input),
    vatNumber: input.vatNumber || existingTax?.vatNumber || undefined,
    directorName: existingTax?.directorName ?? undefined,
    stripeConnectCompleted: existingTax?.stripeConnectCompleted ?? false,
  });
  if (!tax) {
    throw new Error("Unable to save tax profile.");
  }

  const addressInput = {
    recipientName: input.businessName,
    addressLine: input.addressLine,
    addressLine2: input.addressLine2 || "",
    city: input.city,
    postcode: input.postcode,
    country: input.country,
    addressType: ADDRESS_SCOPE_TO_STORAGE.business,
    isDefault: true as const,
  };

  const existingBilling = await getDefaultAddress(userId, ADDRESS_SCOPE_TO_STORAGE.business).catch(
    () => null,
  );
  if (existingBilling) {
    await updateUserAddress(userId, existingBilling.id, addressInput);
  } else {
    const billing = await listUserAddresses(userId, ADDRESS_SCOPE_TO_STORAGE.business).catch(
      () => [] as UserAddress[],
    );
    if (billing[0]) {
      await updateUserAddress(userId, billing[0].id, addressInput);
    } else {
      try {
        await createUserAddress(userId, addressInput);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("already saved")) {
          throw error;
        }
      }
    }
  }

  return {
    profile: {
      businessName: input.businessName,
      contactEmail: input.contactEmail,
      businessType: input.businessType,
      addressLine: input.addressLine,
      addressLine2: input.addressLine2 ?? "",
      city: input.city,
      postcode: input.postcode,
      country: input.country,
      vatNumber: input.vatNumber || null,
    },
  };
}

async function readStripeRequirementCounts(accountId: string | null): Promise<{
  currentlyDueCount: number;
  eventuallyDueCount: number;
  disabledReason: string | null;
}> {
  if (!accountId || !isStripeConfigured()) {
    return { currentlyDueCount: 0, eventuallyDueCount: 0, disabledReason: null };
  }
  try {
    const stripe = getStripeClient();
    const account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: ["requirements"],
    });
    const entries = account.requirements?.entries ?? [];
    const currentlyDueCount = entries.filter(
      (entry) => entry.minimum_deadline?.status === "currently_due",
    ).length;
    const eventuallyDueCount = entries.filter(
      (entry) => entry.minimum_deadline?.status === "eventually_due",
    ).length;
    return {
      currentlyDueCount,
      eventuallyDueCount,
      disabledReason: null,
    };
  } catch {
    return { currentlyDueCount: 0, eventuallyDueCount: 0, disabledReason: null };
  }
}

export async function loadBusinessStripeStatus(
  userId: string,
  options?: { refresh?: boolean },
): Promise<BusinessStripeStatus> {
  const refresh = options?.refresh === true;
  const admin = createAdminClient();
  const { data: seller } = await admin
    .from("seller_profiles")
    .select(
      "stripe_connect_account_id_business, stripe_connect_details_submitted_business, stripe_connect_payouts_enabled_business, stripe_connect_charges_enabled_business",
    )
    .eq("id", userId)
    .maybeSingle();

  const cachedAccountId =
    (seller as { stripe_connect_account_id_business?: string | null } | null)
      ?.stripe_connect_account_id_business ?? null;
  const cachedDetailsSubmitted = Boolean(
    (seller as { stripe_connect_details_submitted_business?: boolean | null } | null)
      ?.stripe_connect_details_submitted_business,
  );
  const cachedPayouts = Boolean(
    (seller as { stripe_connect_payouts_enabled_business?: boolean | null } | null)
      ?.stripe_connect_payouts_enabled_business,
  );
  const cachedCharges = Boolean(
    (seller as { stripe_connect_charges_enabled_business?: boolean | null } | null)
      ?.stripe_connect_charges_enabled_business,
  );

  const live = refresh
    ? await syncConnectAccountBySellerId(userId, "business")
    : {
        connected: cachedDetailsSubmitted || cachedCharges,
        payoutsEnabled: cachedPayouts,
        chargesEnabled: cachedCharges,
        accountId: cachedAccountId,
      };

  const accountId = live.accountId ?? cachedAccountId;
  const detailsSubmitted = Boolean(live.connected || cachedDetailsSubmitted);
  const requirements = refresh
    ? await readStripeRequirementCounts(accountId)
    : { currentlyDueCount: 0, eventuallyDueCount: 0, disabledReason: null };
  const state = deriveBusinessStripeState({
    accountIdPresent: Boolean(accountId),
    connected: Boolean(live.connected),
    payoutsEnabled: Boolean(live.payoutsEnabled),
    currentlyDueCount: requirements.currentlyDueCount,
  });

  if (refresh) {
    await admin
      .from("business_accounts")
      .update({ verified_business: state === "verified" } as never)
      .eq("id", userId);
  }

  return {
    state,
    verified: state === "verified",
    connected: Boolean(live.connected),
    payoutsEnabled: Boolean(live.payoutsEnabled),
    chargesEnabled: Boolean(live.chargesEnabled),
    detailsSubmitted,
    accountIdPresent: Boolean(accountId),
    currentlyDueCount: requirements.currentlyDueCount,
    eventuallyDueCount: requirements.eventuallyDueCount,
    disabledReason: requirements.disabledReason,
  };
}

async function loadBusinessProfile(userId: string): Promise<BusinessProfilePayload | null> {
  const admin = createAdminClient();
  const [{ data: business }, tax, billing] = await Promise.all([
    admin
      .from("business_accounts")
      .select("business_name, company_type")
      .eq("id", userId)
      .maybeSingle(),
    getSellerTaxProfile(userId).catch(() => null),
    getDefaultAddress(userId, ADDRESS_SCOPE_TO_STORAGE.business).catch(() => null),
  ]);

  const businessName = (business?.business_name ?? tax?.companyName ?? "").trim();
  const businessType = mapCompanyType(business?.company_type ?? tax?.registrationType);
  if (!businessName || !businessType) {
    return null;
  }

  return {
    businessName,
    contactEmail: tax?.email ?? "",
    businessType,
    addressLine: billing?.addressLine ?? tax?.addressLine1 ?? "",
    addressLine2: billing?.addressLine2 ?? tax?.addressLine2 ?? "",
    city: billing?.city ?? tax?.city ?? "",
    postcode: billing?.postcode ?? tax?.postcode ?? "",
    country: billing?.country ?? UK_DEFAULT_COUNTRY,
    vatNumber: tax?.vatNumber ?? null,
  };
}

export async function loadActiveSellerContext(userId: string): Promise<SellerContext> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("seller_profiles")
    .select("active_seller_context")
    .eq("id", userId)
    .maybeSingle();
  const raw = (data as { active_seller_context?: string | null } | null)?.active_seller_context;
  return normalizeSellerContext(raw);
}

export async function switchSellerContext(
  userId: string,
  next: SellerContext,
): Promise<{ activeSellerContext: SellerContext }> {
  if (!isSellerContext(next)) {
    const error = new Error("Invalid seller context.");
    error.name = "INVALID_SELLER_CONTEXT";
    throw error;
  }
  await ensureSellerProfileRow(userId);

  const current = await loadActiveSellerContext(userId);
  if (next === "business") {
    const [profile, cachedStripe] = await Promise.all([
      loadBusinessProfile(userId),
      loadBusinessStripeStatus(userId, { refresh: false }),
    ]);
    if (!profile) {
      const error = new Error("BUSINESS_INFORMATION_REQUIRED");
      error.name = "BUSINESS_INFORMATION_REQUIRED";
      throw error;
    }
    const stripe = cachedStripe.verified
      ? cachedStripe
      : await loadBusinessStripeStatus(userId, { refresh: true });
    if (!stripe.verified) {
      const error = new Error("STRIPE_VERIFICATION_REQUIRED");
      error.name = "STRIPE_VERIFICATION_REQUIRED";
      throw error;
    }
  }

  if (current === next) {
    return { activeSellerContext: next };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seller_profiles")
    .update({ active_seller_context: next } as never)
    .eq("id", userId)
    .select("id, active_seller_context")
    .maybeSingle();
  const saved = normalizeSellerContext(
    (data as { active_seller_context?: string | null } | null)?.active_seller_context,
  );
  if (error || !data || saved !== next) {
    const failed = new Error("Seller context could not be saved.");
    failed.name = "SELLER_CONTEXT_WRITE_FAILED";
    throw failed;
  }
  return { activeSellerContext: next };
}

export async function startBusinessStripeConnect(
  userId: string,
  options?: {
    surface?: BusinessConnectSurface;
    returnUrl?: string;
    refreshUrl?: string;
    appBase?: string;
  },
): Promise<{ url: string }> {
  const profile = await loadBusinessProfile(userId);
  if (!profile) {
    const error = new Error("BUSINESS_INFORMATION_REQUIRED");
    error.name = "BUSINESS_INFORMATION_REQUIRED";
    throw error;
  }
  await ensureSellerProfileRow(userId);

  const { getAppBaseUrl } = await import("@/lib/stripe/server");
  const base = resolveBusinessConnectAppBase({
    runtimeOrigin: options?.appBase,
    fallbackBase: await getAppBaseUrl(),
  });
  const surface = options?.surface === "pwa" ? "pwa" : "native";
  const returnUrl =
    options?.returnUrl?.trim() ||
    (surface === "pwa"
      ? `${base}/business/connect/return?status=success`
      : `${base}/api/business/connect/return?status=success`);
  const refreshUrl =
    options?.refreshUrl?.trim() ||
    (surface === "pwa"
      ? `${base}/business/connect/return?status=refresh`
      : `${base}/api/business/connect/return?status=refresh`);
  const result = await createConnectAccountLink(userId, "business", {
    returnUrl,
    refreshUrl,
  });
  if ("error" in result) {
    throw new Error(result.error);
  }
  return { url: result.url };
}

export async function loadBusinessStatus(
  userId: string,
  options?: { refresh?: boolean; lite?: boolean },
): Promise<BusinessStatusSnapshot> {
  const lite = options?.lite === true;
  const admin = createAdminClient();
  const [profile, stripe, activeSellerContext, userResult, sellerResult] = await Promise.all([
    loadBusinessProfile(userId),
    loadBusinessStripeStatus(userId, options),
    loadActiveSellerContext(userId),
    admin
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("seller_profiles")
      .select("rating, review_count, sales_count")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const userRow = userResult.data;
  const sellerRow = sellerResult.data;

  let wallet: BusinessStatusSnapshot["wallet"] = null;
  if (!lite) {
    try {
      const data = await getWalletData(userId, "business");
      wallet = {
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
      };
    } catch {
      wallet = null;
    }
  }

  const reviewCount = Number(sellerRow?.review_count ?? 0);
  let positivePercent = 0;
  if (!lite && reviewCount > 0) {
    const { data: reviews } = await admin
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", userId);
    const rows = reviews ?? [];
    const positive = rows.filter((row) => Number(row.rating ?? 0) >= 4).length;
    positivePercent = rows.length > 0 ? Math.round((positive / rows.length) * 100) : 0;
  }

  const nextStep = resolveBusinessNextStep({
    hasBusinessProfile: Boolean(profile),
    stripeState: stripe.state,
  });

  return {
    engine: BUSINESS_ONBOARDING_ENGINE,
    activeSellerContext,
    hasBusinessProfile: Boolean(profile),
    profile,
    stripe,
    nextStep,
    identity: {
      businessName: profile?.businessName ?? null,
      avatarUrl: userRow?.avatar_url ?? null,
      username: userRow?.username ?? null,
      verified: stripe.verified,
      rating: Number(sellerRow?.rating ?? 0),
      reviewCount,
      positivePercent,
      soldCount: Number(sellerRow?.sales_count ?? 0),
    },
    wallet,
  };
}

export async function loadBusinessHomeExtras(userId: string) {
  const [inventory, analytics] = await Promise.all([
    getInventoryOverview(userId).catch(() => null),
    getSellerAnalyticsData(userId, "30d", "business").catch(() => null),
  ]);
  return { inventory, analytics };
}
