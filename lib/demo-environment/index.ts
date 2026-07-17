export {
  DEMO_DEFAULT_PASSWORD,
  DEMO_EMAIL_DOMAIN,
  DEMO_LISTING_TARGET,
  DEMO_USERS,
  demoAvatarUrl,
  demoBannerUrl,
  demoProductImageUrl,
  isDemoSeedEnabled,
  resolveDemoSeedPassword,
  resolveDemoUserPassword,
  type DemoUserDefinition,
} from "@/lib/demo-environment/config";

export {
  assertDemoEnvironmentReachable,
  assertDemoEnvironmentReady,
  getDemoAdminClient,
  hasDemoEnvironmentConfig,
} from "@/lib/demo-environment/guards";
export { ensureDemoUser, ensureDemoUsers, demoStoreBannerNote, type DemoUserRecord } from "@/lib/demo-environment/users";
export { seedDemoListings } from "@/lib/demo-environment/listings";
export { seedDemoMarketplaceData } from "@/lib/demo-environment/marketplace";
export { seedFullDemoMarketplaceData } from "@/lib/demo-environment/full-demo-marketplace";
export { runDemoEnvironmentSeed, type DemoEnvironmentSeedReport } from "@/lib/demo-environment/seed";
export { runDemoEnvironmentVerification, type DemoEnvironmentVerificationReport } from "@/lib/demo-environment/verify";
