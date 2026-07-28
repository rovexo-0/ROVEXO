import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { recalculateRovexoVerified } from "@/lib/verified/recalculate";

/**
 * Syncs profiles.verified from ROVEXO Verified Engine v1.0 (fail closed).
 * Called after profile / payment / bank / verification changes.
 */
export async function syncAutoVerifiedProfile(userId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  await recalculateRovexoVerified(userId);
}
