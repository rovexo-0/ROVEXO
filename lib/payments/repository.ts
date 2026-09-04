import { PaymentSetupError } from "@/lib/payments/errors";
import { getStripeClient, getAppBaseUrl, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SavedPaymentMethod = {
  id: string;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

type PaymentMethodRow = {
  id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

function mapRow(row: PaymentMethodRow): SavedPaymentMethod {
  return {
    id: row.id,
    stripePaymentMethodId: row.stripe_payment_method_id,
    brand: row.brand,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    isDefault: row.is_default,
  };
}

/**
 * Ensure a Stripe Customer exists for this ROVEXO user in the *current* Stripe mode.
 * Stale IDs (LIVE customer stored while runtime is TEST, or deleted customers) are
 * cleared and recreated — never trusted blindly from profiles.stripe_customer_id.
 */
export async function ensureStripeCustomer(userId: string): Promise<string | null> {
  if (!isStripeConfigured()) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const stripe = getStripeClient();
  const existing = typeof profile.stripe_customer_id === "string"
    ? profile.stripe_customer_id.trim()
    : "";

  if (existing) {
    try {
      const customer = await stripe.customers.retrieve(existing);
      if (!("deleted" in customer && customer.deleted)) {
        return existing;
      }
    } catch {
      // Fall through — recreate under current TEST/LIVE mode.
    }
    await admin
      .from("profiles")
      .update({ stripe_customer_id: null })
      .eq("id", userId);
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.full_name,
    metadata: { userId },
  });

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function listPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return ((data ?? []) as PaymentMethodRow[]).map(mapRow);
}

export async function syncPaymentMethodFromStripe(
  userId: string,
  paymentMethodId: string,
): Promise<SavedPaymentMethod> {
  const stripe = getStripeClient();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const card = paymentMethod.card;

  if (!card) {
    throw new Error("Only card payment methods are supported.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("payment_methods")
    .select("id")
    .eq("stripe_payment_method_id", paymentMethodId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    stripe_payment_method_id: paymentMethodId,
    brand: card.brand,
    last4: card.last4,
    exp_month: card.exp_month,
    exp_year: card.exp_year,
  };

  if (existing) {
    const { data, error } = await admin
      .from("payment_methods")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as PaymentMethodRow);
  }

  const { count } = await admin
    .from("payment_methods")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data, error } = await admin
    .from("payment_methods")
    .insert({ ...payload, is_default: (count ?? 0) === 0 })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as PaymentMethodRow);
}

export async function createPaymentMethodSetupIntent(
  userId: string,
): Promise<{ clientSecret: string; setupIntentId: string }> {
  if (!isStripeConfigured()) {
    throw new PaymentSetupError(
      "Card payments are not available right now. Stripe TEST keys are required on localhost.",
      503,
      "stripe_not_configured",
    );
  }

  let customerId: string | null;
  try {
    customerId = await ensureStripeCustomer(userId);
  } catch (error) {
    throw new PaymentSetupError(
      "Your Stripe payment profile could not be prepared. Please try again.",
      502,
      "stripe_customer_prepare_failed",
      { cause: error },
    );
  }
  if (!customerId) {
    throw new PaymentSetupError(
      "Could not create a Stripe customer for your account. Check your profile email.",
      500,
      "stripe_customer_missing",
    );
  }

  const stripe = getStripeClient();
  let setupIntent;
  try {
    setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { userId },
    });
  } catch (error) {
    // One retry after forced customer refresh (handles race / residual bad ID).
    await adminClearStripeCustomer(userId);
    const refreshed = await ensureStripeCustomer(userId);
    if (!refreshed) {
      throw new PaymentSetupError(
        "Could not create a Stripe customer for your account. Check your profile email.",
        500,
        "stripe_customer_missing",
        { cause: error },
      );
    }
    setupIntent = await stripe.setupIntents.create({
      customer: refreshed,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { userId },
    });
  }

  if (!setupIntent.client_secret) {
    throw new PaymentSetupError(
      "Stripe did not return a client secret for card setup.",
      502,
      "stripe_client_secret_missing",
    );
  }

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
}

async function adminClearStripeCustomer(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("profiles").update({ stripe_customer_id: null }).eq("id", userId);
}

/** Stripe Customer Portal — manage/update/remove cards on Stripe-hosted UI. */
export async function createPaymentMethodsBillingPortalSession(
  userId: string,
): Promise<{ url: string }> {
  if (!isStripeConfigured()) {
    throw new PaymentSetupError(
      "Card payments are not available right now.",
      503,
      "stripe_not_configured",
    );
  }

  const customerId = await ensureStripeCustomer(userId);
  if (!customerId) {
    throw new PaymentSetupError(
      "Could not open Stripe card management for your account.",
      500,
      "stripe_customer_missing",
    );
  }

  const stripe = getStripeClient();
  const base = await getAppBaseUrl();
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/wallet/payment-methods`,
    });
    if (!session.url) {
      throw new PaymentSetupError(
        "Stripe did not return a card management link.",
        502,
        "stripe_portal_url_missing",
      );
    }
    return { url: session.url };
  } catch (error) {
    if (error instanceof PaymentSetupError) throw error;
    throw new PaymentSetupError(
      "Stripe card management is not available yet. You can still add a card here.",
      502,
      "stripe_portal_unavailable",
      { cause: error },
    );
  }
}

export async function completePaymentMethodSetupIntent(
  userId: string,
  setupIntentId: string,
): Promise<SavedPaymentMethod> {
  const stripe = getStripeClient();
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

  if (setupIntent.metadata?.userId && setupIntent.metadata.userId !== userId) {
    throw new PaymentSetupError("This card setup session belongs to another account.", 403, "forbidden");
  }

  if (setupIntent.status !== "succeeded") {
    throw new PaymentSetupError(
      `Card setup is not complete (${setupIntent.status ?? "unknown"}).`,
      400,
      "setup_incomplete",
    );
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id ?? null;

  if (!paymentMethodId) {
    throw new PaymentSetupError("Stripe did not return a saved payment method.", 400, "payment_method_missing");
  }

  const customerId = await ensureStripeCustomer(userId);
  if (customerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch(() => undefined);
  }

  return syncPaymentMethodFromStripe(userId, paymentMethodId);
}

export async function createPaymentMethodSetupSession(userId: string): Promise<string | null> {
  const customerId = await ensureStripeCustomer(userId);
  if (!customerId) return null;

  const stripe = getStripeClient();
  const base = await getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${base}/wallet/payment-methods?setup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/wallet/payment-methods?setup=cancelled`,
  });

  return session.url;
}

export async function completePaymentMethodSetup(
  userId: string,
  sessionId: string,
): Promise<SavedPaymentMethod | null> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["setup_intent"],
  });

  if (session.customer == null || session.mode !== "setup") {
    return null;
  }

  const setupIntent = session.setup_intent;
  const paymentMethodId =
    typeof setupIntent === "object" && setupIntent && "payment_method" in setupIntent
      ? typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id
      : null;

  if (!paymentMethodId) return null;

  const customerId = await ensureStripeCustomer(userId);
  if (customerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  return syncPaymentMethodFromStripe(userId, paymentMethodId);
}

export async function deletePaymentMethod(userId: string, methodId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: method } = await admin
    .from("payment_methods")
    .select("*")
    .eq("id", methodId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!method) {
    throw new Error("Payment method not found.");
  }

  if (isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.paymentMethods.detach(method.stripe_payment_method_id).catch(() => undefined);
  }

  await admin.from("payment_methods").delete().eq("id", methodId).eq("user_id", userId);
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("payment_methods").update({ is_default: false }).eq("user_id", userId);
  const { error } = await admin
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", methodId)
    .eq("user_id", userId);

  if (error) throw error;

  const customerId = await ensureStripeCustomer(userId);
  const { data: method } = await admin
    .from("payment_methods")
    .select("stripe_payment_method_id")
    .eq("id", methodId)
    .maybeSingle();

  if (customerId && method && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: method.stripe_payment_method_id },
    });
  }
}
