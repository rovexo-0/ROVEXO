import { loadDotEnvFiles } from "./playwright-env.mjs";
import { createAdminClient } from "@/lib/supabase/admin";

loadDotEnvFiles();

const TARGET_EMAIL = (process.env.ROVEXO_SUPER_ADMIN_EMAIL ?? "Palademihaita88@gmail.com").trim();

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function restoreSuperAdminAccess(email = TARGET_EMAIL): Promise<{
  email: string;
  userId: string;
  previousRole: string | null;
  role: "super_admin";
}> {
  const admin = createAdminClient();
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    throw new Error(`No auth user found for ${email}`);
  }

  const { data: profileBefore } = await admin
    .from("profiles")
    .select("role, account_status, verified, email")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await admin.rpc(
    "bootstrap_demo_platform_role" as "generate_order_number",
    {
      p_user_id: userId,
      p_target_role: "super_admin",
    } as never,
  );

  if (error) {
    throw new Error(`bootstrap_demo_platform_role failed: ${error.message}`);
  }

  const { data: profileAfter } = await admin
    .from("profiles")
    .select("role, account_status, verified, email")
    .eq("id", userId)
    .single();

  if (profileAfter?.role !== "super_admin") {
    throw new Error(`Role restoration failed — expected super_admin, got ${profileAfter?.role ?? "null"}`);
  }

  return {
    email: profileAfter.email ?? email,
    userId,
    previousRole: profileBefore?.role ?? null,
    role: "super_admin",
  };
}

async function main(): Promise<void> {
  const result = await restoreSuperAdminAccess();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
