import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types/database";
import {
  demoAvatarUrl,
  demoBannerUrl,
  type DemoUserDefinition,
  resolveDemoSeedPassword,
} from "@/lib/demo-environment/config";
import { getDemoAdminClient } from "@/lib/demo-environment/guards";

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

async function enrichProfile(
  admin: SupabaseClient<Database>,
  user: DemoUserDefinition,
  userId: string,
): Promise<void> {
  await admin.from("profiles").upsert(
    {
      id: userId,
      email: user.email,
      username: user.username,
      full_name: user.fullName,
      role: user.role === "admin" || user.role === "super_admin" ? "buyer" : user.role,
      verified: true,
      account_status: "active",
      avatar_url: demoAvatarUrl(user.avatarSeed),
      phone: user.phone ?? null,
    },
    { onConflict: "id" },
  );

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
  const password = resolveDemoSeedPassword();

  let userId = await findProfileIdByEmail(admin, user.email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        full_name: user.fullName,
        role: user.role === "admin" || user.role === "super_admin" ? "buyer" : user.role,
        business_name: user.businessName,
      },
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
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        full_name: user.fullName,
        role: user.role === "admin" || user.role === "super_admin" ? "buyer" : user.role,
        business_name: user.businessName,
      },
    });
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
