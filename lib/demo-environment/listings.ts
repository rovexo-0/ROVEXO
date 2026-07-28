import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { DemoUserRecord } from "@/lib/demo-environment/users";

/**
 * Absolute Law v5.0 — permanently forbidden.
 * Fake / demo / test marketplace inventory must never be seeded.
 * Full Demo accounts may exist; they sell only real products.
 */
export async function seedDemoListings(_input: {
  admin: SupabaseClient<Database>;
  sellers: DemoUserRecord[];
  targetCount?: number;
}): Promise<{ created: number; productIds: string[] }> {
  void _input;
  throw new Error(
    "ABSOLUTE_LAW_V5: seedDemoListings is permanently disabled. Real products only.",
  );
}
