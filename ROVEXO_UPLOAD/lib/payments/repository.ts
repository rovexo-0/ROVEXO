import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, getAppBaseUrl, isStripeConfigured } from "@/lib/stripe/server";

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

export async function ensureStripeCustomer(userId: string): Promise<string | null> {
  if (!isStripeConfigured()) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const existing = profile.stripe_customer_id;
  if (existing) return existing;

  const stripe = getStripeClient();
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

export async function createPaymentMethodSetupSession(userId: string): Promise<string | null> {
  const customerId = await ensureStripeCustomer(userId);
  if (!customerId) return null;

  const stripe = getStripeClient();
  const base = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${base}/account/payment-methods?setup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/account/payment-methods?setup=cancelled`,
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
