import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types/database";
import {
  demoAvatarUrl,
  demoBannerUrl,
  type DemoUserDefinition,
  resolveDemoSeedPassword,
  resolveDemoUserPassword,
} from "@/lib/demo-environment/config";
import { getDemoAdminClient } from "@/lib/demo-environment/guards";
import {
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  isFullDemoAccountKey,
} from "@/lib/full-demo/canonical";

export type DemoUserRecord = DemoUserDefinition & {
  id: string;
  password: string;
};

function formatError(error: unknown): string {
  if (!error) return "unknown error";
  if (error instanceof Error) {
    const name = error.name && error.name !== "Error" ? `${error.name}: ` : "";
    const message = error.message?.trim();
    if (message && message !== "{}") return `${name}${message}`;
    const status = (error as Error & { status?: number }).status;
    if (status) return `${name}HTTP ${status} from Supabase Auth`;
    return `${name}${error.message || "unknown auth error"}`;
  }
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message && record.message !== "{}") {
      return record.message;
    }
    if (typeof record.error_description === "string") return record.error_description;
    if (typeof record.status === "number") return `HTTP ${record.status} from Supabase Auth`;
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      return String(error);
    }
    return "Supabase Auth returned an empty error (often HTTP 500 from handle_new_user trigger or pending migrations)";
  }
  return String(error);
}

async function findAuthUserIdByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function findProfileIdByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

async function ensureDemoWalletFloor(
  admin: SupabaseClient<Database>,
  userId: string,
  targetBalance: number,
): Promise<void> {
  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (!wallet) {
    await admin.from("wallets").insert({
      user_id: userId,
      available_balance: targetBalance,
      pending_balance: 0,
    });
    return;
  }

  if (Number(wallet.available_balance) < targetBalance) {
    await admin
      .from("wallets")
      .update({ available_balance: targetBalance })
      .eq("id", wallet.id);
  }
}

async function bootstrapStaffRole(admin: SupabaseClient<Database>, userId: string, role: UserRole) {
  if (role !== "admin" && role !== "super_admin") return;

  const { error } = await admin.rpc(
    "bootstrap_demo_platform_role" as "generate_order_number",
    {
      p_user_id: userId,
      p_target_role: role,
    } as never,
  );

  if (error) {
    throw new Error(`bootstrap_demo_platform_role failed for ${role}: ${formatError(error)}`);
  }
}

async function ensureFullDemoCompletionAssets(
  admin: SupabaseClient<Database>,
  userId: string,
  user: DemoUserDefinition,
): Promise<void> {
  const paymentId = `pm_demo_full_${user.key}`;
  const { data: existingPayment } = await admin
    .from("payment_methods")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!existingPayment) {
    const { error: paymentError } = await admin.from("payment_methods").upsert(
      {
        user_id: userId,
        stripe_payment_method_id: paymentId,
        brand: "visa",
        last4: "4242",
        exp_month: 12,
        exp_year: 2030,
        is_default: true,
      },
      { onConflict: "stripe_payment_method_id" },
    );
    if (paymentError) {
      throw new Error(
        `Failed to seed Full Demo payment method for ${user.email}: ${formatError(paymentError)}`,
      );
    }
  }

  const { data: existingBank } = await admin
    .from("withdraw_methods")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "bank_account")
    .eq("connected", true)
    .limit(1)
    .maybeSingle();

  if (!existingBank) {
    const { error: bankError } = await admin.from("withdraw_methods").insert({
      user_id: userId,
      provider: "bank_account",
      label: `${user.fullName} — Full Demo bank`,
      last_digits: "0001",
      connected: true,
      is_default: true,
    });
    if (bankError) {
      throw new Error(
        `Failed to seed Full Demo bank account for ${user.email}: ${formatError(bankError)}`,
      );
    }
  }
}

async function enrichProfile(
  admin: SupabaseClient<Database>,
  user: DemoUserDefinition,
  userId: string,
): Promise<void> {
  const desiredRole =
    user.role === "admin" || user.role === "super_admin" ? "buyer" : user.role;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  // prevent_profile_role_escalation blocks non-Super-Admin role changes.
  // Only send role when inserting or when the value is unchanged.
  const profilePayload: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role?: UserRole;
    verified: boolean;
    account_status: "active";
    avatar_url: string;
    phone: string | null;
  } = {
    id: userId,
    email: user.email,
    username: user.username,
    full_name: user.fullName,
    verified: true,
    account_status: "active",
    avatar_url: demoAvatarUrl(user.avatarSeed),
    phone: user.phone ?? null,
  };

  if (!existingProfile || existingProfile.role === desiredRole) {
    profilePayload.role = desiredRole;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError) {
    throw new Error(
      `Failed to enrich demo profile for ${user.email}: ${formatError(profileError)}`,
    );
  }

  if (user.role === "seller" || user.role === "business" || user.role === "admin" || user.role === "super_admin") {
    await admin.from("seller_profiles").upsert(
      {
        id: userId,
        bio: `${user.fullName} — ROVEXO demo seller profile for QA and certification.`,
        rating: 4.7,
        review_count: 24,
        follower_count: 128,
        listing_count: 0,
        sales_count: 18,
      },
      { onConflict: "id" },
    );
  }

  if (user.role === "business") {
    await admin.from("business_accounts").upsert(
      {
        id: userId,
        business_name: user.businessName ?? user.fullName,
        tax_id: "GB123456789",
        website: `https://${user.username}.demo.rovexo.co.uk`,
        description: `${user.businessName ?? user.fullName} — verified demo business account.`,
        verified_business: true,
        verification_level: "verified",
        company_type: "limited_company",
        trust_score: 92,
      },
      { onConflict: "id" },
    );

    await admin.from("profile_entitlements").upsert(
      {
        user_id: userId,
        company_verified: true,
        premium: true,
      },
      { onConflict: "user_id" },
    );
  }

  await admin.from("shipping_addresses").delete().eq("user_id", userId).eq("postcode", "SW1A 1AA");
  await admin.from("shipping_addresses").insert({
    user_id: userId,
    recipient_name: user.fullName,
    address_line: "10 Demo Street",
    city: "London",
    postcode: "SW1A 1AA",
    country: "United Kingdom",
    is_default: true,
  });

  /** Permanent Full Demo Accounts — fully verified + £50,000 virtual funds. */
  if (isFullDemoAccountKey(user.key)) {
    await ensureFullDemoCompletionAssets(admin, userId, user);

    const { error: sellerProfileError } = await admin.from("seller_profiles").upsert(
      {
        id: userId,
        bio: `${user.fullName} — permanent Full Demo Certification account.`,
        rating: 4.95,
        review_count: 128,
        follower_count: 512,
        listing_count: 0,
        sales_count: 96,
      },
      { onConflict: "id" },
    );
    if (sellerProfileError) {
      throw new Error(
        `Failed to enrich Full Demo seller profile for ${user.email}: ${formatError(sellerProfileError)}`,
      );
    }

    if (user.key === "live-seller") {
      const { error: businessError } = await admin.from("business_accounts").upsert(
        {
          id: userId,
          business_name: user.businessName ?? "ROVEXO LIVE SELLER Ltd",
          tax_id: "GB999000001",
          website: "https://live-seller.demo.rovexo.co.uk",
          description: "Fully verified Full Demo Seller — business + trust certified.",
          verified_business: true,
          verification_level: "premium",
          company_type: "limited_company",
          trust_score: 98,
        },
        { onConflict: "id" },
      );
      if (businessError) {
        throw new Error(
          `Failed to enrich Full Demo business account for ${user.email}: ${formatError(businessError)}`,
        );
      }

      const { error: entitlementError } = await admin.from("profile_entitlements").upsert(
        {
          user_id: userId,
          company_verified: true,
          premium: true,
        },
        { onConflict: "user_id" },
      );
      if (entitlementError) {
        throw new Error(
          `Failed to enrich Full Demo entitlements for ${user.email}: ${formatError(entitlementError)}`,
        );
      }
    }

    await ensureDemoWalletFloor(admin, userId, FULL_DEMO_VIRTUAL_FUNDS_GBP);

    const { data: verifiedProfile, error: verifiedError } = await admin
      .from("profiles")
      .select("verified, account_status")
      .eq("id", userId)
      .single();
    if (verifiedError) {
      throw new Error(
        `Failed to confirm Full Demo profile for ${user.email}: ${formatError(verifiedError)}`,
      );
    }
    if (verifiedProfile?.verified !== true || verifiedProfile.account_status !== "active") {
      throw new Error(
        `Full Demo account ${user.email} must remain verified and active after seed ` +
          `(verified=${verifiedProfile?.verified}, account_status=${verifiedProfile?.account_status}).`,
      );
    }
  }

  if (user.role === "admin" || user.role === "super_admin") {
    try {
      await bootstrapStaffRole(admin, userId, user.role);
    } catch (error) {
      if (user.role === "super_admin") {
        throw error;
      }
    }
  }
}

export async function ensureDemoUser(user: DemoUserDefinition): Promise<DemoUserRecord> {
  const admin = getDemoAdminClient();
  const password = resolveDemoUserPassword(user);
  const userMetadata = {
    username: user.username,
    full_name: user.fullName,
    role: user.role === "admin" || user.role === "super_admin" ? "buyer" : user.role,
    business_name: user.businessName,
  };

  let userId = await findProfileIdByEmail(admin, user.email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      userId = await findAuthUserIdByEmail(admin, user.email);
      if (!userId) {
        throw new Error(
          [
            `Failed to create demo user ${user.email}: ${formatError(error)}`,
            "Run npm run db:push to apply bootstrap_demo_platform_role migration.",
            "Confirm SUPABASE_SERVICE_ROLE_KEY is the service role secret from Supabase Dashboard → Settings → API.",
          ].join(" "),
        );
      }
    } else {
      userId = data.user.id;
    }
  }

  // Always sync canonical password + email confirmation (covers unconfirmed public signups
  // and auth users found without a profile row).
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (updateError) {
    throw new Error(
      `Failed to sync demo user credentials for ${user.email}: ${formatError(updateError)}`,
    );
  }

  await enrichProfile(admin, user, userId);

  return { ...user, id: userId, password };
}

export async function ensureDemoUsers(users: DemoUserDefinition[]): Promise<DemoUserRecord[]> {
  const records: DemoUserRecord[] = [];
  for (const user of users) {
    records.push(await ensureDemoUser(user));
  }
  return records;
}

export function demoStoreBannerNote(user: DemoUserDefinition): string {
  return `<!--rovexo-demo-banner:${demoBannerUrl(user.avatarSeed)}-->`;
}
