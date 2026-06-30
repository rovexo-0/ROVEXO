import { createAdminClient } from "@/lib/supabase/admin";

export type BusinessDirectoryEntry = {
  id: string;
  companyName: string;
  username: string;
  avatarUrl: string | null;
  verifiedBusiness: boolean;
  verifiedWholesale: boolean;
  verifiedManufacturer: boolean;
  verifiedSupplier: boolean;
  trustScore: number;
  website: string | null;
  description: string;
};

export async function listBusinessDirectory(limit = 48): Promise<BusinessDirectoryEntry[]> {
  try {
    const admin = createAdminClient();
    const { data: businesses } = await admin
      .from("business_accounts")
      .select(
        "id, business_name, website, description, trust_score, verified_business, verified_wholesale, verified_manufacturer, verified_supplier",
      )
      .order("trust_score", { ascending: false })
      .limit(limit);

    const rows = businesses ?? [];
    if (!rows.length) return [];

    const ids = rows.map((row) => row.id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, avatar_url, role")
      .in("id", ids)
      .eq("role", "business");

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return rows
      .map((row) => {
        const profile = profileById.get(row.id);
        if (!profile) return null;
        return {
          id: row.id,
          companyName: row.business_name,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          verifiedBusiness: row.verified_business,
          verifiedWholesale: row.verified_wholesale,
          verifiedManufacturer: row.verified_manufacturer,
          verifiedSupplier: row.verified_supplier,
          trustScore: row.trust_score,
          website: row.website,
          description: row.description,
        };
      })
      .filter((entry): entry is BusinessDirectoryEntry => entry !== null);
  } catch {
    return [];
  }
}
