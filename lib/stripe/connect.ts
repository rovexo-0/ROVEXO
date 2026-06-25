import type Stripe from "stripe";
import { getAppBaseUrl, getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function isStripeConnectConfigured(): boolean {
  return isStripeConfigured();
}

export async function syncConnectAccountFromStripe(account: Stripe.Account): Promise<void> {
  const sellerId = account.metadata?.sellerId;
  if (!sellerId) {
    return;
  }

  const admin = createAdminClient();
  const payoutsEnabled = account.payouts_enabled ?? false;
  const detailsSubmitted = account.details_submitted ?? false;

  await admin
    .from("seller_profiles")
    .update({
      stripe_connect_account_id: account.id,
    })
    .eq("id", sellerId);

  await admin
    .from("seller_tax_profiles")
    .update({ stripe_connect_completed: payoutsEnabled && detailsSubmitted })
    .eq("seller_id", sellerId);

  await admin
    .from("withdraw_methods")
    .update({ connected: payoutsEnabled && detailsSubmitted })
    .eq("user_id", sellerId)
    .eq("provider", "stripe_connect");
}

export async function syncConnectAccountBySellerId(sellerId: string): Promise<{
  connected: boolean;
  payoutsEnabled: boolean;
}> {
  const admin = createAdminClient();
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_connect_account_id")
    .eq("id", sellerId)
    .maybeSingle();

  if (!sellerProfile?.stripe_connect_account_id || !isStripeConfigured()) {
    return { connected: false, payoutsEnabled: false };
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(sellerProfile.stripe_connect_account_id);
  await syncConnectAccountFromStripe(account);

  return {
    connected: account.details_submitted ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
  };
}

export async function createConnectAccountLink(sellerId: string): Promise<
  { url: string } | { error: string }
> {
  if (!isStripeConnectConfigured()) {
    return { error: "Stripe Connect is not configured." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", sellerId)
    .maybeSingle();

  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_connect_account_id")
    .eq("id", sellerId)
    .maybeSingle();

  const stripe = getStripeClient();
  let accountId = sellerProfile?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile?.email ?? undefined,
      metadata: { sellerId },
      capabilities: {
        transfers: { requested: true },
      },
    });

    accountId = account.id;

    await admin
      .from("seller_profiles")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", sellerId);
  }

  const baseUrl = getAppBaseUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/seller/wallet?connect=refresh`,
    return_url: `${baseUrl}/seller/wallet?connect=success`,
    type: "account_onboarding",
  });

  if (!accountLink.url) {
    return { error: "Unable to create Connect onboarding link." };
  }

  return { url: accountLink.url };
}

export async function getConnectAccountStatus(sellerId: string): Promise<{
  connected: boolean;
  payoutsEnabled: boolean;
}> {
  return syncConnectAccountBySellerId(sellerId);
}
