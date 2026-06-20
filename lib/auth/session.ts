import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types/database";
import type { User } from "@supabase/supabase-js";

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
  return role === "seller" || role === "business" || role === "admin";
}

export function isBusinessRole(role: UserRole): boolean {
  return role === "business" || role === "admin";
}

export async function requireAdmin(): Promise<AuthContext & { role: "admin" }> {
  return requireRole(["admin"]) as Promise<AuthContext & { role: "admin" }>;
}

export async function requireApiAdmin(): Promise<(AuthContext & { role: "admin" }) | NextResponse> {
  return requireApiRole(["admin"]) as Promise<(AuthContext & { role: "admin" }) | NextResponse>;
}
