import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";

export function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}) },
    { status },
  );
}

export async function requireMfaSessionUser(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return jsonError("Authentication required.", 401, "auth_required");
  }

  return { supabase, user };
}

export async function resolveVerifiedTotpFactorId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const assurance = await readMfaAssurance(supabase);
  return assurance.verifiedTotpFactorId;
}

/** Remove unverified TOTP factors so enroll always starts clean. */
export async function purgeUnverifiedTotpFactors(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { data } = await supabase.auth.mfa.listFactors();
  const unverified = (data?.all ?? []).filter(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  );
  for (const factor of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
}

export async function adminDeleteAllTotpFactors(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) {
    throw new Error("Unable to list MFA factors.");
  }
  for (const factor of data?.factors ?? []) {
    if (factor.factor_type !== "totp") continue;
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
      userId,
      id: factor.id,
    });
    if (deleteError) {
      throw new Error("Unable to remove MFA factor.");
    }
  }
}

export function enrollFriendlyName(): string {
  return MFA_TOTP_V1.friendlyName;
}
