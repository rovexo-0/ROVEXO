import { DEMO_USERS, isDemoSeedEnabled } from "@/lib/demo-environment/config";
import {
  assertDemoEnvironmentReachable,
  getDemoAdminClient,
  hasDemoEnvironmentConfig,
} from "@/lib/demo-environment/guards";
import { ensureDemoUsers } from "@/lib/demo-environment/users";

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

/**
 * Absolute Law v5.0 — accounts only.
 * Never seeds fake/demo/test marketplace listings.
 */
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

  const warnings: string[] = [
    "Absolute Law v5.0: listing / marketplace fake inventory seed permanently disabled. Real products only.",
  ];
  const admin = getDemoAdminClient();
  const users = await ensureDemoUsers(DEMO_USERS);

  const liveBuyer = users.find((user) => user.key === "live-buyer");
  const liveSeller = users.find((user) => user.key === "live-seller");

  if (!liveBuyer || !liveSeller) {
    throw new Error("Permanent Full Demo Accounts (live-buyer / live-seller) are missing from seed.");
  }

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
    listings: 0,
    orders: 0,
    conversations: 0,
    notifications: 0,
    savedItems: 0,
    reviews: 0,
    walletTransactions: 0,
    offers: 0,
    counterOffers: 0,
    disputes: 0,
    parcels: 0,
    promotions: 0,
    analyticsEvents: 0,
    warnings,
  };
}
