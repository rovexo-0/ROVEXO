import { DEMO_USERS, isDemoSeedEnabled } from "@/lib/demo-environment/config";
import {
  assertDemoEnvironmentReachable,
  getDemoAdminClient,
  hasDemoEnvironmentConfig,
} from "@/lib/demo-environment/guards";
import { seedDemoListings } from "@/lib/demo-environment/listings";
import { seedDemoMarketplaceData } from "@/lib/demo-environment/marketplace";
import { seedFullDemoMarketplaceData } from "@/lib/demo-environment/full-demo-marketplace";
import { ensureDemoUsers, type DemoUserRecord } from "@/lib/demo-environment/users";
import { FULL_DEMO_PRODUCT_TARGET } from "@/lib/full-demo/canonical";

export type DemoEnvironmentSeedReport = {
  ok: boolean;
  generatedAt: string;
  users: Array<{ key: string; email: string; role: string; id: string }>;
  fullDemoAccounts: Array<{ key: string; email: string; label: string }>;
  listings: number;
  orders: number;
  conversations: number;
  notifications: number;
  savedItems: number;
  reviews: number;
  walletTransactions: number;
  offers: number;
  counterOffers: number;
  disputes: number;
  parcels: number;
  promotions: number;
  analyticsEvents: number;
  warnings: string[];
};

export async function runDemoEnvironmentSeed(): Promise<DemoEnvironmentSeedReport> {
  if (!isDemoSeedEnabled()) {
    throw new Error(
      "Demo seed is disabled. Set DEMO_SEED_ENABLED=1 (and DEMO_ALLOW_PRODUCTION=1 on production UAT).",
    );
  }

  if (!hasDemoEnvironmentConfig()) {
    throw new Error("Supabase is not configured for demo seeding.");
  }

  await assertDemoEnvironmentReachable();

  const warnings: string[] = [];
  const admin = getDemoAdminClient();
  const users = await ensureDemoUsers(DEMO_USERS);

  const liveBuyer = users.find((user) => user.key === "live-buyer");
  const liveSeller = users.find((user) => user.key === "live-seller");

  if (!liveBuyer || !liveSeller) {
    throw new Error("Permanent Full Demo Accounts (live-buyer / live-seller) are missing from seed.");
  }

  const buyers = users.filter((user) => user.role === "buyer");
  const sellers = users.filter(
    (user) => user.role === "seller" || user.role === "business",
  ) as DemoUserRecord[];

  const { created: listings, productIds } = await seedDemoListings({
    admin,
    sellers,
  });

  // Guarantee ≥100 published listings for the permanent LIVE SELLER.
  const { created: liveSellerListings, productIds: liveSellerProductIds } = await seedDemoListings({
    admin,
    sellers: [liveSeller],
    targetCount: FULL_DEMO_PRODUCT_TARGET,
  });

  const marketplace = await seedDemoMarketplaceData({
    admin,
    buyers,
    sellers,
    productIds,
  });

  const fullDemo = await seedFullDemoMarketplaceData({
    admin,
    liveBuyer,
    liveSeller,
    productIds: liveSellerProductIds.length ? liveSellerProductIds : productIds,
  });

  const { data: superAdmins } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "super_admin");

  if ((superAdmins?.length ?? 0) > 1) {
    warnings.push("Multiple super_admin accounts detected — ROVEXO allows only one in production policy.");
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    users: users.map((user) => ({
      key: user.key,
      email: user.email,
      role: user.role,
      id: user.id,
    })),
    fullDemoAccounts: [
      { key: liveBuyer.key, email: liveBuyer.email, label: "ROVEXO LIVE BUYER" },
      { key: liveSeller.key, email: liveSeller.email, label: "ROVEXO LIVE SELLER" },
    ],
    listings: listings + liveSellerListings,
    orders: marketplace.orders + fullDemo.orders,
    conversations: marketplace.conversations + fullDemo.conversations,
    notifications: marketplace.notifications + fullDemo.notifications,
    savedItems: marketplace.savedItems + fullDemo.savedItems,
    reviews: marketplace.reviews + fullDemo.reviews,
    walletTransactions: marketplace.walletTransactions + fullDemo.walletTransactions,
    offers: fullDemo.offers,
    counterOffers: fullDemo.counterOffers,
    disputes: fullDemo.disputes,
    parcels: fullDemo.parcels,
    promotions: fullDemo.promotions,
    analyticsEvents: fullDemo.analyticsEvents,
    warnings,
  };
}
