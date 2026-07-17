import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  FULL_DEMO_ACCOUNTS,
  FULL_DEMO_BUYER_QUOTAS,
  FULL_DEMO_SELLER_QUOTAS,
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  type FullDemoAccountDefinition,
} from "@/lib/full-demo/canonical";
import {
  getDemoAdminClient,
  hasDemoEnvironmentConfig,
  hasDemoPublicConfig,
} from "@/lib/demo-environment/guards";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type FullDemoLiveCheck = {
  id: string;
  pass: boolean;
  actual?: number | string | boolean | null;
  required?: number | string | boolean;
};

export type FullDemoLiveVerificationReport = {
  checkedAt: string;
  passed: boolean;
  deploymentBlocked: boolean;
  mode: "service_role" | "demo_session";
  checks: FullDemoLiveCheck[];
};

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

async function verifyPassword(email: string, password: string): Promise<boolean> {
  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;
  await client.auth.signOut();
  return true;
}

function addCheck(
  checks: FullDemoLiveCheck[],
  id: string,
  actual: number | string | boolean | null,
  required: number | string | boolean,
  pass: boolean,
): void {
  checks.push({ id, actual, required, pass });
}

async function createDemoSessionClient(
  email: string,
  password: string,
): Promise<{ client: SupabaseClient; userId: string } | null> {
  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session?.user?.id) return null;
  return { client, userId: data.session.user.id };
}

async function runAccountChecksAdmin(
  admin: ReturnType<typeof getDemoAdminClient>,
  checks: FullDemoLiveCheck[],
  definition: FullDemoAccountDefinition,
  profile: {
    id: string;
    email: string | null;
    role: string | null;
    verified: boolean | null;
    account_status: string | null;
  } | undefined,
): Promise<void> {
  addCheck(checks, `${definition.key}.exists`, Boolean(profile?.id), true, Boolean(profile?.id));
  addCheck(
    checks,
    `${definition.key}.active`,
    profile?.account_status ?? null,
    "active",
    profile?.account_status === "active",
  );
  addCheck(
    checks,
    `${definition.key}.verified`,
    profile?.verified ?? false,
    true,
    profile?.verified === true,
  );
  const loginWorks = await verifyPassword(definition.email, definition.password ?? "");
  addCheck(checks, `${definition.key}.login`, loginWorks, true, loginWorks);

  if (profile?.id) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const confirmed = Boolean(authUser.user?.email_confirmed_at);
    const banned = Boolean(authUser.user?.banned_until);
    addCheck(checks, `${definition.key}.email_confirmed`, confirmed, true, confirmed);
    addCheck(checks, `${definition.key}.not_banned`, banned, false, !banned);
  }
}

/**
 * Admin-path LIVE verification (service role). Used on Vercel builds where
 * Sensitive env vars are injected into process.env.
 */
async function runFullDemoLiveVerificationAdmin(): Promise<FullDemoLiveVerificationReport> {
  const admin = getDemoAdminClient();
  const checks: FullDemoLiveCheck[] = [];
  const [buyerDef, sellerDef] = FULL_DEMO_ACCOUNTS;

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, email, role, verified, account_status")
    .in("email", [buyerDef.email, sellerDef.email]);
  if (profileError) throw new Error(profileError.message);

  const buyer = profiles?.find((profile) => profile.email === buyerDef.email);
  const seller = profiles?.find((profile) => profile.email === sellerDef.email);

  await runAccountChecksAdmin(admin, checks, buyerDef, buyer);
  await runAccountChecksAdmin(admin, checks, sellerDef, seller);

  if (buyer?.id) {
    const { data: wallet } = await admin
      .from("wallets")
      .select("available_balance")
      .eq("user_id", buyer.id)
      .maybeSingle();
    const balance = Number(wallet?.available_balance ?? 0);
    addCheck(
      checks,
      "buyer.wallet",
      balance,
      FULL_DEMO_VIRTUAL_FUNDS_GBP,
      balance >= FULL_DEMO_VIRTUAL_FUNDS_GBP,
    );

    for (const [bucket, target] of [
      ["COMPLETED", FULL_DEMO_BUYER_QUOTAS.completedOrders],
      ["CANCELLED", FULL_DEMO_BUYER_QUOTAS.cancelledOrders],
      ["REFUNDED", FULL_DEMO_BUYER_QUOTAS.refundedOrders],
      ["DELIVERED", FULL_DEMO_BUYER_QUOTAS.deliveredOrders],
      ["DISPUTED", FULL_DEMO_BUYER_QUOTAS.disputes],
    ] as const) {
      const count = await countRows(
        admin
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", buyer.id)
          .like("order_number", `FULLDEMO-${bucket}-%`),
      );
      addCheck(checks, `buyer.orders.${bucket.toLowerCase()}`, count, target, count >= target);
    }

    const notificationCount = await countRows(
      admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", buyer.id),
    );
    addCheck(
      checks,
      "buyer.notifications",
      notificationCount,
      FULL_DEMO_BUYER_QUOTAS.notifications,
      notificationCount >= FULL_DEMO_BUYER_QUOTAS.notifications,
    );
  }

  if (seller?.id) {
    const { data: wallet } = await admin
      .from("wallets")
      .select("available_balance")
      .eq("user_id", seller.id)
      .maybeSingle();
    const balance = Number(wallet?.available_balance ?? 0);
    addCheck(
      checks,
      "seller.wallet",
      balance,
      FULL_DEMO_VIRTUAL_FUNDS_GBP,
      balance >= FULL_DEMO_VIRTUAL_FUNDS_GBP,
    );

    const productCount = await countRows(
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller.id)
        .eq("status", "published"),
    );
    addCheck(
      checks,
      "seller.products",
      productCount,
      FULL_DEMO_SELLER_QUOTAS.products,
      productCount >= FULL_DEMO_SELLER_QUOTAS.products,
    );

    const offerCount = await countRows(
      admin
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller.id),
    );
    addCheck(
      checks,
      "seller.offers",
      offerCount,
      FULL_DEMO_SELLER_QUOTAS.offers,
      offerCount >= FULL_DEMO_SELLER_QUOTAS.offers,
    );

    const promotionCount = await countRows(
      admin
        .from("listing_promotions")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller.id),
    );
    addCheck(
      checks,
      "seller.promotions",
      promotionCount,
      FULL_DEMO_SELLER_QUOTAS.promotions,
      promotionCount >= FULL_DEMO_SELLER_QUOTAS.promotions,
    );
  }

  const passed = checks.length > 0 && checks.every((check) => check.pass);
  return {
    checkedAt: new Date().toISOString(),
    passed,
    deploymentBlocked: !passed,
    mode: "service_role",
    checks,
  };
}

/**
 * Demo-session LIVE verification — no service role required.
 * Uses public anon key + official Full Demo passwords under RLS.
 * Validates Production safely without Vercel CLI Sensitive-secret extraction.
 */
async function runFullDemoLiveVerificationDemoSessions(): Promise<FullDemoLiveVerificationReport> {
  const checks: FullDemoLiveCheck[] = [];
  const [buyerDef, sellerDef] = FULL_DEMO_ACCOUNTS;

  for (const definition of [buyerDef, sellerDef]) {
    const session = await createDemoSessionClient(definition.email, definition.password ?? "");
    addCheck(checks, `${definition.key}.login`, Boolean(session), true, Boolean(session));
    if (!session) {
      addCheck(checks, `${definition.key}.exists`, false, true, false);
      continue;
    }

    const { client, userId } = session;
    addCheck(checks, `${definition.key}.exists`, true, true, true);

    const { data: profile } = await client
      .from("profiles")
      .select("id, verified, account_status")
      .eq("id", userId)
      .maybeSingle();

    addCheck(
      checks,
      `${definition.key}.active`,
      profile?.account_status ?? null,
      "active",
      profile?.account_status === "active",
    );
    addCheck(
      checks,
      `${definition.key}.verified`,
      profile?.verified ?? false,
      true,
      profile?.verified === true,
    );
    // Successful password login implies confirmed email and not banned.
    addCheck(checks, `${definition.key}.email_confirmed`, true, true, true);
    addCheck(checks, `${definition.key}.not_banned`, false, false, true);

    if (definition.key === "live-buyer") {
      const { data: wallet } = await client
        .from("wallets")
        .select("available_balance")
        .eq("user_id", userId)
        .maybeSingle();
      const balance = Number(wallet?.available_balance ?? 0);
      addCheck(
        checks,
        "buyer.wallet",
        balance,
        FULL_DEMO_VIRTUAL_FUNDS_GBP,
        balance >= FULL_DEMO_VIRTUAL_FUNDS_GBP,
      );

      for (const [bucket, target] of [
        ["COMPLETED", FULL_DEMO_BUYER_QUOTAS.completedOrders],
        ["CANCELLED", FULL_DEMO_BUYER_QUOTAS.cancelledOrders],
        ["REFUNDED", FULL_DEMO_BUYER_QUOTAS.refundedOrders],
        ["DELIVERED", FULL_DEMO_BUYER_QUOTAS.deliveredOrders],
        ["DISPUTED", FULL_DEMO_BUYER_QUOTAS.disputes],
      ] as const) {
        const count = await countRows(
          client
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("buyer_id", userId)
            .like("order_number", `FULLDEMO-${bucket}-%`),
        );
        addCheck(checks, `buyer.orders.${bucket.toLowerCase()}`, count, target, count >= target);
      }

      const notificationCount = await countRows(
        client
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      );
      addCheck(
        checks,
        "buyer.notifications",
        notificationCount,
        FULL_DEMO_BUYER_QUOTAS.notifications,
        notificationCount >= FULL_DEMO_BUYER_QUOTAS.notifications,
      );
    }

    if (definition.key === "live-seller") {
      const { data: wallet } = await client
        .from("wallets")
        .select("available_balance")
        .eq("user_id", userId)
        .maybeSingle();
      const balance = Number(wallet?.available_balance ?? 0);
      addCheck(
        checks,
        "seller.wallet",
        balance,
        FULL_DEMO_VIRTUAL_FUNDS_GBP,
        balance >= FULL_DEMO_VIRTUAL_FUNDS_GBP,
      );

      const productCount = await countRows(
        client
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "published"),
      );
      addCheck(
        checks,
        "seller.products",
        productCount,
        FULL_DEMO_SELLER_QUOTAS.products,
        productCount >= FULL_DEMO_SELLER_QUOTAS.products,
      );

      const offerCount = await countRows(
        client
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId),
      );
      addCheck(
        checks,
        "seller.offers",
        offerCount,
        FULL_DEMO_SELLER_QUOTAS.offers,
        offerCount >= FULL_DEMO_SELLER_QUOTAS.offers,
      );

      const promotionCount = await countRows(
        client
          .from("listing_promotions")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId),
      );
      addCheck(
        checks,
        "seller.promotions",
        promotionCount,
        FULL_DEMO_SELLER_QUOTAS.promotions,
        promotionCount >= FULL_DEMO_SELLER_QUOTAS.promotions,
      );
    }

    await client.auth.signOut();
  }

  const passed = checks.length > 0 && checks.every((check) => check.pass);
  return {
    checkedAt: new Date().toISOString(),
    passed,
    deploymentBlocked: !passed,
    mode: "demo_session",
    checks,
  };
}

/**
 * Runtime Full Demo LIVE verification.
 *
 * Prefer service-role (Vercel build / real local secrets).
 * Fall back to demo-session mode when only public URL+anon are available
 * (Vercel CLI cannot read Sensitive service-role keys).
 */
export async function runFullDemoLiveVerification(): Promise<FullDemoLiveVerificationReport> {
  if (hasDemoEnvironmentConfig()) {
    return runFullDemoLiveVerificationAdmin();
  }
  if (hasDemoPublicConfig()) {
    return runFullDemoLiveVerificationDemoSessions();
  }

  throw new Error(
    "Full Demo LIVE verification requires either (1) SUPABASE_SERVICE_ROLE_KEY in process.env " +
      "(available automatically during Vercel buildCommand), or (2) NEXT_PUBLIC_SUPABASE_URL + " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY for demo-session mode. " +
      "Vercel CLI Sensitive redaction is not evidence that Production secrets are missing.",
  );
}

export async function assertFullDemoLiveVerificationPassed(): Promise<void> {
  const report = await runFullDemoLiveVerification();
  if (!report.passed) {
    const failures = report.checks.filter((check) => !check.pass);
    throw new Error(
      `[FULL DEMO LIVE VERIFICATION FAILED] Deployment blocked.\n${failures
        .map((check) => `${check.id}: actual=${check.actual} required=${check.required}`)
        .join("\n")}`,
    );
  }
}
