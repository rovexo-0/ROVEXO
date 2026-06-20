import { getBusinessDashboardData } from "@/lib/business/dashboard";
import { getBusinessProfile } from "@/lib/profile/data";
import { listInventoryItems } from "@/lib/business/inventory";
import type { BusinessInventoryData } from "@/lib/business/types";
import { createClient } from "@/lib/supabase/server";

export async function fetchBusinessDashboard(userId?: string) {
  return getBusinessDashboardData(userId);
}

export async function fetchBusinessInventory(): Promise<BusinessInventoryData> {
  const profile = await getBusinessProfile();
  const supabase = await createClient();
  const { data: businessAccount } = await supabase
    .from("business_accounts")
    .select("business_name")
    .eq("id", profile.id)
    .maybeSingle();

  return {
    profile,
    company: { companyName: businessAccount?.business_name ?? profile.fullName },
    items: await listInventoryItems(profile.id),
  };
}
