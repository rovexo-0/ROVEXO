import { createAdminClient } from "@/lib/supabase/admin";
import {
  compareListingSimilarity,
  isDuplicateListing,
} from "@/lib/seller/migration/duplicate/fingerprint";
import type { DuplicateAction } from "@/lib/seller/migration/types";
import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";

type SellerListingRow = {
  id: string;
  title: string;
  price: number;
  condition: string;
  color: string | null;
  size: string | null;
  sku: string | null;
};

export type DuplicateResolution = {
  listing: MigrationNormalizedListing;
  isDuplicate: boolean;
  existingProductId?: string;
  action: DuplicateAction;
};

export async function resolveDuplicates(
  sellerId: string,
  listings: MigrationNormalizedListing[],
  policy: DuplicateAction,
): Promise<DuplicateResolution[]> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("products")
    .select("id, title, price, condition, color, size, sku")
    .eq("seller_id", sellerId)
    .neq("status", "deleted")
    .limit(500);

  const sellerListings = (existing ?? []) as SellerListingRow[];

  return listings.map((listing) => {
    let bestMatch: SellerListingRow | undefined;
    let bestScore = 0;

    for (const row of sellerListings) {
      const similarity = compareListingSimilarity(listing, {
        externalId: row.id,
        title: row.title,
        price: Number(row.price),
        condition: row.condition,
        brand: listing.brand,
        colour: row.color ?? undefined,
        size: row.size ?? undefined,
        sku: row.sku ?? undefined,
      });
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = row;
      }
    }

    const duplicate = bestMatch != null && isDuplicateListing(bestScore);
    return {
      listing,
      isDuplicate: duplicate,
      existingProductId: duplicate ? bestMatch?.id : undefined,
      action: duplicate ? policy : "create_new",
    };
  });
}
