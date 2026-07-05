import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import type { UserRole } from "@/lib/supabase/types/database";
import type { User } from "@supabase/supabase-js";
import {
  isAdmin,
  isSeller,
  isSuperAdmin,
  type ProfileAuthFields,
} from "@/lib/auth/roles";

export {
  isAdmin,
  isAuthenticated,
  isSeller,
  isSuperAdmin,
  type ProfileAuthFields,
} from "@/lib/auth/roles";

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  /** Role loaded alongside account_status in the same query to avoid a second round-trip. */
  role: UserRole | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Fetch account_status and role together: role is needed by requireRole/
  // requireApiRole, and issuing it here removes a second profiles round-trip.
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_status === "suspended") {
    return null;
  }

  if (profile?.account_status === "deleted") {
    return null;
  }

  return { supabase, user, role: (profile?.role as UserRole | null) ?? null };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    throw new AuthError("Unauthorized", 401);
  }
  return context;
}

export async function requireApiAuth():
  Promise<AuthContext | NextResponse> {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return context;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role ?? null;
}

export async function requireRole(
  allowed: UserRole[],
): Promise<AuthContext & { role: UserRole }> {
  const context = await requireAuthContext();
  const role = context.role ?? (await getUserRole(context.user.id));

  if (!role || !allowed.includes(role)) {
    throw new AuthError("Forbidden", 403);
  }

  return { ...context, role };
}

export async function requireApiRole(
  allowed: UserRole[],
): Promise<(AuthContext & { role: UserRole }) | NextResponse> {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const role = auth.role ?? (await getUserRole(auth.user.id));
  if (!role || !allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { ...auth, role };
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function isSellerRole(role: UserRole): boolean {
  return isSeller(role);
}

export function isBusinessRole(role: UserRole): boolean {
  return role === "business" || isAdmin(role);
}

export function isSuperAdminRole(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export function isPlatformAdminRole(role: UserRole): boolean {
  return isAdmin(role);
}

export async function getProfileAuthFields(userId: string): Promise<ProfileAuthFields | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.role) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
  };
}

export async function requireSuperAdmin(): Promise<AuthContext & { role: "super_admin" }> {
  return requireRole(["super_admin"]) as Promise<AuthContext & { role: "super_admin" }>;
}

export async function requireApiSuperAdmin(
  request?: Request,
): Promise<(AuthContext & { role: "super_admin" }) | NextResponse> {
  const auth = await requireApiRole(["super_admin"]);
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (request) {
    const blocked = validateMutationOrigin(request);
    if (blocked) return blocked;
  }

  return auth as AuthContext & { role: "super_admin" };
}

export async function requireAdmin(): Promise<
  AuthContext & { role: "admin" | "super_admin" }
> {
  return requireRole(["admin", "super_admin"]) as Promise<
    AuthContext & { role: "admin" | "super_admin" }
  >;
}

export async function requireApiListingRole(): Promise<
  (AuthContext & { role: UserRole }) | NextResponse
> {
  return requireApiRole(["buyer", "seller", "business", "admin", "super_admin"]);
}

/** Any authenticated account may connect marketplace OAuth (unified buy/sell model). */
export async function requireApiMarketplaceOAuth(): Promise<
  (AuthContext & { role: UserRole }) | NextResponse
> {
  return requireApiListingRole();
}

export async function requireApiAdmin(): Promise<
  (AuthContext & { role: "admin" | "super_admin" }) | NextResponse
> {
  return requireApiRole(["admin", "super_admin"]) as Promise<
    (AuthContext & { role: "admin" | "super_admin" }) | NextResponse
  >;
}

export type StaffAuthContext = AuthContext & {
  staffId: string;
  staffRoleIds: string[];
};

/** Active staff member linked to auth profile, or super admin with implicit full access. */
export async function requireApiStaff(
  request?: Request,
): Promise<StaffAuthContext | NextResponse> {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "super_admin") {
    const { loadStaffRoleIdsByProfileId } = await import("@/lib/staff-enterprise/permissions");
    const linked = await loadStaffRoleIdsByProfileId(auth.user.id);
    return {
      ...auth,
      role: auth.role,
      staffId: linked.staffId ?? auth.user.id,
      staffRoleIds: linked.roleIds.length ? linked.roleIds : ["super_admin"],
    };
  }

  const { loadStaffRoleIdsByProfileId } = await import("@/lib/staff-enterprise/permissions");
  const linked = await loadStaffRoleIdsByProfileId(auth.user.id);
  if (!linked.staffId || !linked.roleIds.length) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  if (request) {
    const blocked = validateMutationOrigin(request);
    if (blocked) return blocked;
  }

  return {
    ...auth,
    staffId: linked.staffId,
    staffRoleIds: linked.roleIds,
  };
}
