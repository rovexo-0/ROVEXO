import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types/database";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export type SuperAdminUserRow = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  verified: boolean;
  accountStatus: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  entitlements: {
    premium: boolean;
    lifetimePremium: boolean;
    companyVerified: boolean;
    promotionCredits: number;
  };
  sellerProfile: {
    vacationMode: boolean;
    listingLimit: number | null;
    listingCount: number;
  } | null;
};

export type SuperAdminUserFilters = {
  query?: string;
  role?: UserRole | "all";
  status?: "all" | "active" | "suspended" | "deleted";
  limit?: number;
};

const ASSIGNABLE_ROLES: UserRole[] = ["buyer", "seller", "business"];

function mapUser(row: Record<string, unknown>): SuperAdminUserRow {
  const entitlements = (row.profile_entitlements as Record<string, unknown> | null) ?? null;
  const seller = (row.seller_profiles as Record<string, unknown> | null) ?? null;

  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    email: String(row.email),
    role: row.role as UserRole,
    verified: Boolean(row.verified),
    accountStatus: String(row.account_status ?? "active"),
    suspendedAt: row.suspended_at ? String(row.suspended_at) : null,
    suspendedReason: row.suspended_reason ? String(row.suspended_reason) : null,
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    entitlements: {
      premium: Boolean(entitlements?.premium),
      lifetimePremium: Boolean(entitlements?.lifetime_premium),
      companyVerified: Boolean(entitlements?.company_verified),
      promotionCredits: Number(entitlements?.promotion_credits ?? 0),
    },
    sellerProfile: seller
      ? {
          vacationMode: Boolean(seller.vacation_mode),
          listingLimit: seller.listing_limit == null ? null : Number(seller.listing_limit),
          listingCount: Number(seller.listing_count ?? 0),
        }
      : null,
  };
}

export async function listSuperAdminUsers(
  filters: SuperAdminUserFilters = {},
): Promise<SuperAdminUserRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      `
      *,
      profile_entitlements (*),
      seller_profiles (*)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.role && filters.role !== "all") {
    query = query.eq("role", filters.role);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("account_status", filters.status);
  }

  if (filters.query?.trim()) {
    const q = `%${filters.query.trim()}%`;
    query = query.or(`username.ilike.${q},full_name.ilike.${q},email.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
}

export async function getSuperAdminUser(userId: string): Promise<SuperAdminUserRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      `
      *,
      profile_entitlements (*),
      seller_profiles (*)
    `,
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapUser(data as Record<string, unknown>) : null;
}

async function ensureSellerProfile(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("seller_profiles").upsert({ id: userId }, { onConflict: "id" });
}

async function ensureBusinessAccount(userId: string, name: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("business_accounts").upsert(
    { id: userId, business_name: name },
    { onConflict: "id" },
  );
}

export async function updateSuperAdminUser(input: {
  actorId: string;
  userId: string;
  action:
    | "suspend"
    | "unsuspend"
    | "delete"
    | "restore"
    | "verify"
    | "unverify"
    | "set_role"
    | "set_entitlements"
    | "set_listing_limit"
    | "set_vacation_mode"
    | "reset_password";
  payload?: Record<string, unknown>;
}): Promise<SuperAdminUserRow | null> {
  const admin = createAdminClient();
  const existing = await getSuperAdminUser(input.userId);
  if (!existing) return null;

  if (existing.role === "super_admin" && input.actorId !== input.userId) {
    throw new Error("The Super Admin account cannot be modified by another session.");
  }

  switch (input.action) {
    case "suspend": {
      await admin
        .from("profiles")
        .update({
          account_status: "suspended",
          suspended_at: new Date().toISOString(),
          suspended_reason: String(input.payload?.reason ?? "Suspended by Super Admin"),
        })
        .eq("id", input.userId);
      break;
    }
    case "unsuspend": {
      await admin
        .from("profiles")
        .update({
          account_status: "active",
          suspended_at: null,
          suspended_reason: null,
        })
        .eq("id", input.userId);
      break;
    }
    case "delete": {
      await admin
        .from("profiles")
        .update({
          account_status: "deleted",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", input.userId);
      break;
    }
    case "restore": {
      await admin
        .from("profiles")
        .update({
          account_status: "active",
          deleted_at: null,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq("id", input.userId);
      break;
    }
    case "verify": {
      await admin.from("profiles").update({ verified: true }).eq("id", input.userId);
      break;
    }
    case "unverify": {
      await admin.from("profiles").update({ verified: false }).eq("id", input.userId);
      break;
    }
    case "set_role": {
      const role = String(input.payload?.role ?? "") as UserRole;
      if (!ASSIGNABLE_ROLES.includes(role)) {
        throw new Error("Only buyer, seller, or business roles can be assigned.");
      }
      await admin.from("profiles").update({ role }).eq("id", input.userId);
      if (role === "seller" || role === "business") {
        await ensureSellerProfile(input.userId);
      }
      if (role === "business") {
        await ensureBusinessAccount(input.userId, existing.fullName);
      }
      break;
    }
    case "set_entitlements": {
      const { data: existingEntitlements } = await admin
        .from("profile_entitlements")
        .select("premium, lifetime_premium, company_verified, promotion_credits")
        .eq("user_id", input.userId)
        .maybeSingle();

      await admin.from("profile_entitlements").upsert(
        {
          user_id: input.userId,
          premium:
            input.payload?.premium === undefined
              ? Boolean(existingEntitlements?.premium)
              : Boolean(input.payload.premium),
          lifetime_premium:
            input.payload?.lifetimePremium === undefined
              ? Boolean(existingEntitlements?.lifetime_premium)
              : Boolean(input.payload.lifetimePremium),
          company_verified:
            input.payload?.companyVerified === undefined
              ? Boolean(existingEntitlements?.company_verified)
              : Boolean(input.payload.companyVerified),
          promotion_credits:
            input.payload?.promotionCredits === undefined
              ? Number(existingEntitlements?.promotion_credits ?? 0)
              : Number(input.payload.promotionCredits),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      break;
    }
    case "set_listing_limit": {
      await ensureSellerProfile(input.userId);
      const listingLimit =
        input.payload?.listingLimit === null || input.payload?.listingLimit === undefined
          ? null
          : Number(input.payload.listingLimit);
      await admin
        .from("seller_profiles")
        .update({ listing_limit: listingLimit })
        .eq("id", input.userId);
      break;
    }
    case "set_vacation_mode": {
      await ensureSellerProfile(input.userId);
      await admin
        .from("seller_profiles")
        .update({ vacation_mode: Boolean(input.payload?.enabled) })
        .eq("id", input.userId);
      break;
    }
    case "reset_password": {
      await admin.auth.admin.generateLink({
        type: "recovery",
        email: existing.email,
      });
      break;
    }
    default:
      throw new Error("Unsupported user action.");
  }

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: `users.${input.action}`,
    resourceType: "profile",
    resourceId: input.userId,
    metadata: input.payload,
  });

  return getSuperAdminUser(input.userId);
}

export { ASSIGNABLE_ROLES };
