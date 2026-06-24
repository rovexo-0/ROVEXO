import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_status === "suspended") {
    return null;
  }

  if (profile?.account_status === "deleted") {
    return null;
  }

  return { supabase, user };
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
  const role = await getUserRole(context.user.id);

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

  const role = await getUserRole(auth.user.id);
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

export async function requireApiSuperAdmin(): Promise<
  (AuthContext & { role: "super_admin" }) | NextResponse
> {
  return requireApiRole(["super_admin"]) as Promise<
    (AuthContext & { role: "super_admin" }) | NextResponse
  >;
}

export async function requireAdmin(): Promise<
  AuthContext & { role: "admin" | "super_admin" }
> {
  return requireRole(["admin", "super_admin"]) as Promise<
    AuthContext & { role: "admin" | "super_admin" }
  >;
}

export async function requireApiAdmin(): Promise<
  (AuthContext & { role: "admin" | "super_admin" }) | NextResponse
> {
  return requireApiRole(["admin", "super_admin"]) as Promise<
    (AuthContext & { role: "admin" | "super_admin" }) | NextResponse
  >;
}
