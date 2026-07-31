import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSecurityResetViaEmailPage } from "@/features/account/components/AccountSecurityResetViaEmailPage";

export const metadata = { title: "Reset via email" };

export default async function AccountSecurityResetViaEmailRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/security/reset-via-email");

  return <AccountSecurityResetViaEmailPage email={user.email ?? ""} />;
}
