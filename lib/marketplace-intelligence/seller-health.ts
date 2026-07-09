import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTrustScoreFromFactors } from "@/lib/trust/scoring";
import { clampScore, type IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { SellerHealthReport } from "@/lib/marketplace-intelligence/types";

/** Seller Health Engine — evaluates seller performance deterministically. */
export async function evaluateSellerHealth(
  thresholds: IntelligenceThresholds,
): Promise<SellerHealthReport[]> {
  try {
    const admin = createAdminClient();
    const inactiveCutoff = new Date(
      Date.now() - thresholds.inactiveSellerDays * 24 * 60 * 60_000,
    ).toISOString();

    const { data: products } = await admin
      .from("products")
      .select(
        "seller_id, views, likes, rating, review_count, updated_at, profiles!products_seller_id_fkey(username, full_name, verified)",
      )
      .eq("status", "published")
      .limit(400);

    const sellerMap = new Map<
      string,
      {
        sellerId: string;
        username: string | null;
        sellerName: string;
        verified: boolean;
        listingCount: number;
        totalViews: number;
        totalFavorites: number;
        avgRating: number;
        reviewCount: number;
        lastActive: string;
      }
    >();

    for (const row of products ?? []) {
      const profile = row.profiles as {
        username: string | null;
        full_name: string | null;
        verified: boolean | null;
      } | null;
      const existing = sellerMap.get(row.seller_id);
      const updated = row.updated_at ?? new Date().toISOString();
      if (!existing) {
        sellerMap.set(row.seller_id, {
          sellerId: row.seller_id,
          username: profile?.username ?? null,
          sellerName: profile?.full_name ?? "Seller",
          verified: profile?.verified ?? false,
          listingCount: 1,
          totalViews: row.views ?? 0,
          totalFavorites: row.likes ?? 0,
          avgRating: Number(row.rating ?? 0),
          reviewCount: row.review_count ?? 0,
          lastActive: updated,
        });
      } else {
        existing.listingCount += 1;
        existing.totalViews += row.views ?? 0;
        existing.totalFavorites += row.likes ?? 0;
        existing.avgRating = (existing.avgRating + Number(row.rating ?? 0)) / 2;
        existing.reviewCount += row.review_count ?? 0;
        if (updated > existing.lastActive) existing.lastActive = updated;
      }
    }

    const reports: SellerHealthReport[] = [];

    for (const seller of sellerMap.values()) {
      const trustScore = calculateTrustScoreFromFactors({
        completedSales: Math.floor(seller.totalViews / 20),
        completedPurchases: 0,
        cancelledOrders: 0,
        disputesLost: 0,
        disputesWon: 0,
        refundsIssued: 0,
        positiveReviews: seller.reviewCount,
        negativeReviews: 0,
        reportsReceived: 0,
        moderationPenalties: 0,
        verificationsApproved: seller.verified ? 2 : 0,
        accountAgeDays: 90,
        profileCompletion: 70,
        onTimeShipments: seller.listingCount,
        lateShipments: 0,
        responseRate: 80,
        repeatBuyers: 0,
        chargebacks: 0,
        suspensions: 0,
        warnings: 0,
        shippingReliability: null,
        emailVerified: seller.verified,
        phoneVerified: false,
      });

      const listingQualityAvg = clampScore(
        Math.min(100, seller.listingCount * 10 + seller.totalViews * 0.1),
      );
      const activityFactor = seller.lastActive >= inactiveCutoff ? 20 : -20;
      const score = clampScore(trustScore * 0.5 + listingQualityAvg * 0.3 + activityFactor + 10);

      let status: SellerHealthReport["status"] = "stable";
      if (score >= 80 && seller.listingCount >= 5) status = "top";
      else if (score >= 65 && seller.totalViews > thresholds.minViews) status = "growing";
      else if (seller.lastActive < inactiveCutoff) status = "inactive";
      else if (score < thresholds.atRiskSellerHealthScore) status = "at_risk";

      reports.push({
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        username: seller.username,
        score,
        status,
        listingQualityAvg,
        trustScore,
        factors: {
          listings: seller.listingCount,
          views: seller.totalViews,
          favorites: seller.totalFavorites,
          rating: seller.avgRating,
          verified: seller.verified ? 100 : 0,
        },
      });
    }

    return reports.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export function filterTopSellers(reports: SellerHealthReport[]): SellerHealthReport[] {
  return reports.filter((report) => report.status === "top" || report.status === "growing").slice(0, 10);
}

export function filterAtRiskSellers(reports: SellerHealthReport[]): SellerHealthReport[] {
  return reports.filter((report) => report.status === "at_risk" || report.status === "inactive");
}
