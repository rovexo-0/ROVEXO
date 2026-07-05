import { DEMO_USERS, isDemoSeedEnabled } from "@/lib/demo-environment/config";
import {
  assertDemoEnvironmentReachable,
  getDemoAdminClient,
  hasDemoEnvironmentConfig,
} from "@/lib/demo-environment/guards";
import { seedDemoListings } from "@/lib/demo-environment/listings";
import { seedDemoMarketplaceData } from "@/lib/demo-environment/marketplace";
import { ensureDemoUsers, type DemoUserRecord } from "@/lib/demo-environment/users";

export type DemoEnvironmentSeedReport = {
  ok: boolean;
  generatedAt: string;
  users: Array<{ key: string; email: string; role: string; id: string }>;
  listings: number;
  orders: number;
  conversations: number;
  notifications: number;
  savedItems: number;
  reviews: number;
  walletTransactions: number;
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

  const buyers = users.filter((user) => user.role === "buyer");
  const sellers = users.filter(
    (user) => user.role === "seller" || user.role === "business",
  ) as DemoUserRecord[];

  const { created: listings, productIds } = await seedDemoListings({
    admin,
    sellers,
  });

  const marketplace = await seedDemoMarketplaceData({
    admin,
    buyers,
    sellers,
    productIds,
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
    listings,
    ...marketplace,
    warnings,
  };
}
