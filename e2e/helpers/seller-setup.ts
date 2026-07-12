import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";

/** Seeds a connected bank account so first-publish gate passes (profile-completion). */
export async function seedSellerBankAccount(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await admin.from("withdraw_methods").insert({
    user_id: userId,
    provider: "bank_account",
    connected: true,
    is_default: true,
    label: "E2E Test Bank",
    last_digits: "1234",
    account_holder_name: "E2E Seller",
    sort_code: "00-00-00",
    account_number: "12345678",
  });

  if (error) {
    throw new Error(`withdraw_methods insert failed: ${error.message}`);
  }
}
