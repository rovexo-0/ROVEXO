import type Stripe from "stripe";
import { UK_DEFAULT_COUNTRY, UK_DEFAULT_COUNTRY_CODE } from "@/lib/i18n/uk-first";
import { getAppBaseUrl, getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import {
  mapV2RecipientStatus,
  V2_CONNECT_STATUS_INCLUDES,
} from "@/lib/stripe/connect-v2-recipient-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import {
  connectAccountColumn,
  connectCapabilityColumns,
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

type SellerConnectRow = {
  stripe_connect_account_id: string | null;
  stripe_connect_account_id_individual: string | null;
  stripe_connect_account_id_business: string | null;
};

const CONNECT_SELECT =
  "stripe_connect_account_id, stripe_connect_account_id_individual, stripe_connect_account_id_business" as const;

export function isStripeConnectConfigured(): boolean {
  return isStripeConfigured();
}

export function resolveConnectIdentityCountry(raw?: string | null): string {
  const value = (raw || "").trim();
  if (!value || value === UK_DEFAULT_COUNTRY) return UK_DEFAULT_COUNTRY_CODE;
  if (/^united\s+kingdom$/i.test(value) || /^uk$/i.test(value) || /^gb$/i.test(value)) {
    return UK_DEFAULT_COUNTRY_CODE;
  }
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  return UK_DEFAULT_COUNTRY_CODE;
}

/** Never maps Individual Connect onto Business, or the reverse. */
export function resolveConnectAccountIdForContext(
  row: SellerConnectRow | null | undefined,
  context: SellerContext,
): string | null {
  if (!row) return null;
  const normalized = normalizeSellerContext(context);
  const contextual =
    normalized === "business"
      ? row.stripe_connect_account_id_business
      : row.stripe_connect_account_id_individual;
  const trimmed = contextual?.trim() || "";
  if (trimmed) return trimmed;
  if (normalized === "individual") {
    return row.stripe_connect_account_id?.trim() || null;
  }
  return null;
}

export type ConnectAccountLinkOptions = {
  returnUrl?: string;
  refreshUrl?: string;
};

export function extractConnectAccountIdFromEvent(
  event: Pick<Stripe.Event, "account" | "data">,
): string | null {
  const object = event.data?.object as { id?: unknown } | undefined;
  if (object && typeof object.id === "string" && object.id.trim()) {
    return object.id.trim();
  }
  if (typeof event.account === "string" && event.account.trim()) {
    return event.account.trim();
  }
  return null;
}

function contextFromAccountMetadata(account: Stripe.V2.Core.Account): SellerContext {
  const raw = account.metadata?.sellerContext ?? account.metadata?.seller_context;
  return normalizeSellerContext(raw);
}

async function persistWithdrawMethod(
  admin: ReturnType<typeof createAdminClient>,
  sellerId: string,
  context: SellerContext,
  connected: boolean,
): Promise<void> {
  const existing = await admin
    .from("withdraw_methods")
    .select("id")
    .eq("user_id", sellerId)
    .eq("provider", "stripe_connect")
    .eq("seller_context", context)
    .maybeSingle();
  if (existing.data) {
    await admin
      .from("withdraw_methods")
      .update({ connected })
      .eq("user_id", sellerId)
      .eq("provider", "stripe_connect")
      .eq("seller_context", context);
    return;
  }
  await admin.from("withdraw_methods").insert({
    user_id: sellerId,
    provider: "stripe_connect",
    seller_context: context,
    connected,
    label: "Stripe Connect",
    last_digits: "****",
  });
}

export async function syncConnectAccountFromStripe(
  account: Stripe.V2.Core.Account,
  context: SellerContext = "individual",
): Promise<void> {
  const sellerId = account.metadata?.sellerId;
  if (!sellerId) {
    return;
  }

  const admin = createAdminClient();
  const status = mapV2RecipientStatus(account);
  const normalized = normalizeSellerContext(context);
  const idCol = connectAccountColumn(context);
  const caps = connectCapabilityColumns(normalized);
  const methodConnected = status.payoutsEnabled && status.connected;
  const verified = methodConnected;

  if (context === "individual") {
    const stripe_connect_account_id = account.id;
    await admin
      .from("seller_profiles")
      .update({
        stripe_connect_account_id,
        stripe_connect_account_id_individual: account.id,
        stripe_connect_payouts_enabled_individual: status.payoutsEnabled,
        stripe_connect_details_submitted_individual: status.connected,
        stripe_connect_charges_enabled_individual: status.chargesEnabled,
      })
      .eq("id", sellerId);
  }
  if (context === "business") {
    const stripe_connect_account_id_business = account.id;
    if (stripe_connect_account_id_business === account.id) {
      await admin
        .from("seller_profiles")
        .update({
          stripe_connect_account_id_business,
          stripe_connect_payouts_enabled_business: status.payoutsEnabled,
          stripe_connect_details_submitted_business: status.connected,
          stripe_connect_charges_enabled_business: status.chargesEnabled,
        })
        .eq("id", sellerId);
    }
  }
  void idCol;
  void caps;

  await admin
    .from("seller_tax_profiles")
    .update({ stripe_connect_completed: status.connected && status.payoutsEnabled })
    .eq("seller_id", sellerId);

  if (normalized === "business") {
    await admin
      .from("business_accounts")
      .update({ verified_business: verified })
      .eq("id", sellerId);
  }

  await persistWithdrawMethod(admin, sellerId, normalized, methodConnected);
}

export async function syncConnectAccountFromStripeAccountId(accountId: string): Promise<void> {
  if (!accountId || !isStripeConfigured()) return;
  const stripe = getStripeClient();
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: [...V2_CONNECT_STATUS_INCLUDES],
  });
  await syncConnectAccountFromStripe(account, contextFromAccountMetadata(account));
}

export async function syncConnectAccountBySellerId(
  sellerId: string,
  context: SellerContext = "individual",
): Promise<{
  connected: boolean;
  payoutsEnabled: boolean;
  chargesEnabled?: boolean;
  accountId?: string | null;
}> {
  const normalized = normalizeSellerContext(context);
  const admin = createAdminClient();
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select(CONNECT_SELECT)
    .eq("id", sellerId)
    .maybeSingle();

  const accountId = resolveConnectAccountIdForContext(sellerProfile, normalized);
  if (!accountId || !isStripeConfigured()) {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, accountId: null };
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: [...V2_CONNECT_STATUS_INCLUDES],
    });
    await syncConnectAccountFromStripe(account, normalized);
    const status = mapV2RecipientStatus(account);
    return {
      connected: status.connected,
      payoutsEnabled: status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      accountId,
    };
  } catch {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, accountId };
  }
}

export async function createConnectAccountLink(
  sellerId: string,
  context: SellerContext = "individual",
  options?: ConnectAccountLinkOptions,
): Promise<{ url: string } | { error: string; code?: string }> {
  if (!isStripeConnectConfigured()) {
    return { error: "Stripe Connect is not configured." };
  }

  const normalized = normalizeSellerContext(context);
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", sellerId)
    .maybeSingle();

  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select(CONNECT_SELECT)
    .eq("id", sellerId)
    .maybeSingle();

  let accountId = resolveConnectAccountIdForContext(sellerProfile, normalized);
  const stripe = getStripeClient();

  if (!accountId) {
    const taxProfile = await getSellerTaxProfile(sellerId).catch(() => null);
    const identityCountry = resolveConnectIdentityCountry(
      taxProfile?.country || UK_DEFAULT_COUNTRY,
    );

    const requestedRecipientCapability = "stripe_balance.stripe_transfers";
    void requestedRecipientCapability;
    const defaults = {
      currency: "gbp" as const,
      responsibilities: {
        fees_collector: "application" as const,
        losses_collector: "application" as const,
      },
    };

    const account = await stripe.v2.core.accounts.create({
      contact_email: profile?.email ?? undefined,
      metadata: { sellerId, sellerContext: normalized },
      identity: {
        country: identityCountry,
        ...(normalized === "business" ? { entity_type: "company" as const } : {}),
      },
      dashboard: "express",
      defaults,
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
    });
    accountId = account.id;

    await admin
      .from("seller_profiles")
      .update(
        normalized === "business"
          ? { stripe_connect_account_id_business: accountId }
          : {
              stripe_connect_account_id: accountId,
              stripe_connect_account_id_individual: accountId,
            },
      )
      .eq("id", sellerId);
  }

  const baseUrl = await getAppBaseUrl();
  const defaultReturn =
    normalized === "business"
      ? `${baseUrl}/wallet/bank-accounts?sellerContext=business&connect=success`
      : `${baseUrl}/wallet/bank-accounts?connect=success`;
  const defaultRefresh =
    normalized === "business"
      ? `${baseUrl}/wallet/bank-accounts?sellerContext=business&connect=refresh`
      : `${baseUrl}/wallet/bank-accounts?connect=refresh`;

  const accountLink = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: options?.refreshUrl?.trim() || defaultRefresh,
        return_url: options?.returnUrl?.trim() || defaultReturn,
      },
    },
  });

  const url = accountLink.url;
  if (!url) {
    return { error: "Unable to create Connect onboarding link." };
  }
  return { url };
}

export async function createConnectManageLink(
  sellerId: string,
  context: SellerContext = "individual",
): Promise<{ url: string } | { error: string; code?: string }> {
  const status = await syncConnectAccountBySellerId(sellerId, context);
  if (!status.accountId) {
    return createConnectAccountLink(sellerId, context);
  }
  if (!isStripeConnectConfigured()) {
    return { error: "Stripe Connect is not configured.", code: "stripe_not_configured" };
  }
  const stripe = getStripeClient();
  const baseUrl = await getAppBaseUrl();
  const normalized = normalizeSellerContext(context);
  const accountLink = await stripe.v2.core.accountLinks.create({
    account: status.accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url:
          normalized === "business"
            ? `${baseUrl}/wallet/bank-accounts?sellerContext=business&connect=refresh`
            : `${baseUrl}/wallet/bank-accounts?connect=refresh`,
        return_url:
          normalized === "business"
            ? `${baseUrl}/wallet/bank-accounts?sellerContext=business&connect=success`
            : `${baseUrl}/wallet/bank-accounts?connect=success`,
      },
    },
  });
  if (!accountLink.url) {
    return { error: "Unable to create Stripe management link.", code: "stripe_manage_link_missing" };
  }
  return { url: accountLink.url };
}

export async function getConnectAccountStatus(
  sellerId: string,
  context: SellerContext = "individual",
): Promise<{
  connected: boolean;
  payoutsEnabled: boolean;
  chargesEnabled?: boolean;
  accountId?: string | null;
}> {
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  if (!tryCreateAdminClient()) {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, accountId: null };
  }
  try {
    return await syncConnectAccountBySellerId(sellerId, normalizeSellerContext(context));
  } catch {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, accountId: null };
  }
}
