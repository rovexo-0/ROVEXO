import { createClient } from "@/lib/supabase/server";
import { assertFullDemoNotDeletable } from "@/lib/full-demo/permanence";

export async function deleteUserAccount(userId: string, role: string): Promise<void> {
  if (role === "super_admin") {
    throw new Error("Super Admin accounts must be closed through platform support.");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  assertFullDemoNotDeletable(profile?.email, "delete Full Demo Certification account");

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      account_status: "deleted",
      deleted_at: deletedAt,
    })
    .eq("id", userId);

  if (error) {
    throw new Error("Unable to delete your account. Please try again or contact support.");
  }

  await supabase.auth.signOut();
}
