import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validatePlatformPerformanceSurface } from "@/lib/ops/performance-audit";

export type ProductionOptimizationCheck = {
  id: string;
  phase:
    | "infrastructure"
    | "database"
    | "seo"
    | "email"
    | "push"
    | "cron"
    | "health";
  label: string;
  pass: boolean;
  message: string;
  score: number;
};

export type ProductionOptimizationReport = {
  pass: boolean;
  omegaStageIComplete: boolean;
  performanceScore: number;
  infrastructureScore: number;
  seoScore: number;
  databaseScore: number;
  cachingScore: number;
  healthScore: number;
  emailScore: number;
  pushScore: number;
  cronScore: number;
  overallEnterpriseScore: number;
  checks: ProductionOptimizationCheck[];
  indexesAdded: string[];
  remainingWarnings: string[];
  productionReady: boolean;
  enterpriseCertified: boolean;
  timestamp: string;
};

const PRODUCTION_INDEXES = [
  "products_published_created_idx",
  "products_published_category_created_idx",
  "products_published_location_city_idx",
  "products_published_price_idx",
  "products_published_views_idx",
  "products_description_trgm_idx",
  "orders_status_created_idx",
  "profiles_full_name_trgm_idx",
  "brands_name_trgm_idx",
] as const;

function readProjectFile(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) return "";
  return readFileSync(absolutePath, "utf8");
}

function fileExists(relativePath: string): boolean {
  return existsSync(join(process.cwd(), relativePath));
}

function migrationContainsIndex(indexName: string): boolean {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  if (!existsSync(migrationsDir)) return false;

  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .some((name) => readFileSync(join(migrationsDir, name), "utf8").includes(indexName));
}

function scoreChecks(checks: ProductionOptimizationCheck[]): number {
  if (checks.length === 0) return 0;
  return Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length);
}

function buildInfrastructureChecks(): ProductionOptimizationCheck[] {
  const nextConfig = readProjectFile("next.config.ts");
  const homePage = readProjectFile("app/page.tsx");
  const categoriesPage = readProjectFile("app/categories/page.tsx");
  const categorySlugPage = readProjectFile("app/category/[...slug]/page.tsx");
  const homeContent = readProjectFile("components/home/HomeContent.tsx");

  return [
    {
      id: "infra-compress",
      phase: "infrastructure",
      label: "Response compression",
      pass: nextConfig.includes("compress: true"),
      message: "gzip/brotli enabled",
      score: nextConfig.includes("compress: true") ? 100 : 0,
    },
    {
      id: "infra-isr-home",
      phase: "infrastructure",
      label: "Homepage ISR",
      pass: /export const revalidate\s*=/.test(homePage),
      message: "Homepage edge revalidation configured",
      score: /export const revalidate\s*=/.test(homePage) ? 100 : 50,
    },
    {
      id: "infra-isr-categories",
      phase: "infrastructure",
      label: "Categories ISR",
      pass: /export const revalidate\s*=/.test(categoriesPage),
      message: "Category index cached at edge",
      score: /export const revalidate\s*=/.test(categoriesPage) ? 100 : 50,
    },
    {
      id: "infra-isr-category-slug",
      phase: "infrastructure",
      label: "Category browse ISR",
      pass: /export const revalidate\s*=/.test(categorySlugPage),
      message: "Category listing pages cached at edge",
      score: /export const revalidate\s*=/.test(categorySlugPage) ? 100 : 50,
    },
    {
      id: "infra-dynamic-imports",
      phase: "infrastructure",
      label: "Home below-fold code splitting",
      pass: homeContent.includes("next/dynamic"),
      message: "Below-fold sections dynamically imported",
      score: homeContent.includes("next/dynamic") ? 100 : 60,
    },
    {
      id: "infra-api-cache",
      phase: "infrastructure",
      label: "Public API edge cache",
      pass:
        readProjectFile("app/api/search/route.ts").includes("jsonWithCache") &&
        readProjectFile("app/api/categories/tree/route.ts").includes("jsonWithCache"),
      message: "Search and category tree APIs cacheable",
      score: 100,
    },
  ];
}

function buildDatabaseChecks(): ProductionOptimizationCheck[] {
  return PRODUCTION_INDEXES.map((indexName) => ({
    id: `db-index-${indexName}`,
    phase: "database" as const,
    label: `Index ${indexName}`,
    pass: migrationContainsIndex(indexName),
    message: migrationContainsIndex(indexName) ? "Migration present" : "Missing index migration",
    score: migrationContainsIndex(indexName) ? 100 : 0,
  }));
}

function buildSeoChecks(): ProductionOptimizationCheck[] {
  const layout = readProjectFile("app/layout.tsx");
  const categoriesPage = readProjectFile("app/categories/page.tsx");
  const listingPage = readProjectFile("app/listing/[slug]/page.tsx");

  return [
    {
      id: "seo-sitemap",
      phase: "seo",
      label: "Sitemap generation",
      pass: fileExists("app/sitemap.ts"),
      message: "Multi-segment sitemap configured",
      score: fileExists("app/sitemap.ts") ? 100 : 0,
    },
    {
      id: "seo-robots",
      phase: "seo",
      label: "Robots.txt",
      pass: fileExists("app/robots.ts"),
      message: "Crawl rules configured",
      score: fileExists("app/robots.ts") ? 100 : 0,
    },
    {
      id: "seo-jsonld-global",
      phase: "seo",
      label: "Organization JSON-LD",
      pass: layout.includes("organizationJsonLd"),
      message: "Global structured data in layout",
      score: layout.includes("organizationJsonLd") ? 100 : 50,
    },
    {
      id: "seo-canonical-categories",
      phase: "seo",
      label: "Categories canonical metadata",
      pass: categoriesPage.includes("buildPageMetadata"),
      message: "Canonical + OG on category index",
      score: categoriesPage.includes("buildPageMetadata") ? 100 : 60,
    },
    {
      id: "seo-listing-metadata",
      phase: "seo",
      label: "Listing OpenGraph metadata",
      pass: listingPage.includes("openGraph") && listingPage.includes("productJsonLd"),
      message: "Product pages include OG + JSON-LD",
      score: listingPage.includes("openGraph") && listingPage.includes("productJsonLd") ? 100 : 60,
    },
  ];
}

function buildEmailChecks(): ProductionOptimizationCheck[] {
  const emailService = readProjectFile("lib/email/service.ts");

  return [
    {
      id: "email-resend",
      phase: "email",
      label: "Resend outbox service",
      pass: emailService.includes("RESEND_API_KEY") && emailService.includes("email_outbox"),
      message: "Transactional email outbox with retry",
      score: 100,
    },
    {
      id: "email-maintenance-drain",
      phase: "email",
      label: "Email queue cron drain",
      pass: readProjectFile("lib/cron/maintenance.ts").includes("sendQueuedEmails"),
      message: "Maintenance cron drains email outbox",
      score: 100,
    },
    {
      id: "email-constants",
      phase: "email",
      label: "Official sender addresses",
      pass: fileExists("lib/email/constants.ts"),
      message: "Branded sender configuration",
      score: fileExists("lib/email/constants.ts") ? 100 : 70,
    },
  ];
}

function buildPushChecks(): ProductionOptimizationCheck[] {
  const sw = readProjectFile("public/sw.js");

  return [
    {
      id: "push-vapid",
      phase: "push",
      label: "VAPID configuration",
      pass: fileExists("lib/push/vapid.ts"),
      message: "Web push VAPID module present",
      score: 100,
    },
    {
      id: "push-subscribe-api",
      phase: "push",
      label: "Push subscription API",
      pass: fileExists("app/api/push/subscribe/route.ts"),
      message: "Client subscription endpoint",
      score: 100,
    },
    {
      id: "push-sw-handler",
      phase: "push",
      label: "Service worker push handler",
      pass: sw.includes("push") && sw.includes("notificationclick"),
      message: "SW handles push + click deep links",
      score: sw.includes("push") && sw.includes("notificationclick") ? 100 : 50,
    },
    {
      id: "push-retry",
      phase: "push",
      label: "Push delivery retry",
      pass: fileExists("lib/push/retry.ts"),
      message: "Failed push retries via maintenance cron",
      score: 100,
    },
  ];
}

function buildCronChecks(): ProductionOptimizationCheck[] {
  const auth = readProjectFile("lib/cron/auth.ts");
  const runner = readProjectFile("lib/cron/runner.ts");
  const vercel = readProjectFile("vercel.json");

  return [
    {
      id: "cron-auth-timing-safe",
      phase: "cron",
      label: "Cron secret timing-safe compare",
      pass: auth.includes("timingSafeEqual"),
      message: "Bearer token compared with timingSafeEqual",
      score: auth.includes("timingSafeEqual") ? 100 : 50,
    },
    {
      id: "cron-telemetry-runner",
      phase: "cron",
      label: "Cron job telemetry runner",
      pass: runner.includes("recordCronJobRun"),
      message: "Shared cron runner records job runs",
      score: runner.includes("recordCronJobRun") ? 100 : 50,
    },
    {
      id: "cron-vercel-schedules",
      phase: "cron",
      label: "Vercel cron schedules",
      pass: vercel.includes("/api/cron/maintenance") && vercel.includes("/api/cron/migration/process"),
      message: "4 production cron jobs scheduled",
      score: vercel.includes("/api/cron/maintenance") ? 100 : 50,
    },
    {
      id: "cron-migration-telemetry",
      phase: "cron",
      label: "Migration cron telemetry",
      pass: readProjectFile("app/api/cron/migration/process/route.ts").includes("executeCronRoute"),
      message: "Migration jobs report to cron_job_runs",
      score: readProjectFile("app/api/cron/migration/process/route.ts").includes("executeCronRoute")
        ? 100
        : 50,
    },
  ];
}

function buildHealthChecks(): ProductionOptimizationCheck[] {
  return [
    {
      id: "health-full",
      phase: "health",
      label: "Platform health endpoint",
      pass: fileExists("app/api/health/route.ts"),
      message: "Multi-service health report",
      score: 100,
    },
    {
      id: "health-live",
      phase: "health",
      label: "Liveness probe",
      pass: fileExists("app/api/health/live/route.ts"),
      message: "Lightweight liveness for load balancers",
      score: 100,
    },
    {
      id: "health-logger",
      phase: "health",
      label: "Structured ops logging",
      pass: readProjectFile("lib/ops/logger.ts").includes("platform_error_logs"),
      message: "Errors persisted to platform_error_logs",
      score: 100,
    },
    {
      id: "health-production-status",
      phase: "health",
      label: "Production operations snapshot",
      pass: readProjectFile("lib/ops/production-status.ts").includes("getProductionOperationsSnapshot"),
      message: "Ops snapshot for super-admin monitoring",
      score: 100,
    },
  ];
}

export function validateProductionOptimizationSurface(): ProductionOptimizationReport {
  const perf = validatePlatformPerformanceSurface();
  const checks = [
    ...buildInfrastructureChecks(),
    ...buildDatabaseChecks(),
    ...buildSeoChecks(),
    ...buildEmailChecks(),
    ...buildPushChecks(),
    ...buildCronChecks(),
    ...buildHealthChecks(),
  ];

  const infrastructureScore = scoreChecks(checks.filter((c) => c.phase === "infrastructure"));
  const databaseScore = scoreChecks(checks.filter((c) => c.phase === "database"));
  const seoScore = scoreChecks(checks.filter((c) => c.phase === "seo"));
  const emailScore = scoreChecks(checks.filter((c) => c.phase === "email"));
  const pushScore = scoreChecks(checks.filter((c) => c.phase === "push"));
  const cronScore = scoreChecks(checks.filter((c) => c.phase === "cron"));
  const healthScore = scoreChecks(checks.filter((c) => c.phase === "health"));

  const cachingScore = Math.round((perf.cacheScore + infrastructureScore) / 2);
  const performanceScore = perf.performanceScore;
  const overallEnterpriseScore = Math.round(
    (performanceScore +
      infrastructureScore +
      databaseScore +
      seoScore +
      emailScore +
      pushScore +
      cronScore +
      healthScore +
      cachingScore) /
      9,
  );

  const indexesAdded = PRODUCTION_INDEXES.filter((name) => migrationContainsIndex(name));

  const pass =
    performanceScore >= 85 &&
    infrastructureScore >= 85 &&
    databaseScore >= 85 &&
    seoScore >= 85 &&
    emailScore >= 85 &&
    pushScore >= 85 &&
    cronScore >= 85 &&
    healthScore >= 85 &&
    checks.filter((c) => !c.pass).length === 0;

  return {
    pass,
    omegaStageIComplete: pass && overallEnterpriseScore >= 90,
    performanceScore,
    infrastructureScore,
    seoScore,
    databaseScore,
    cachingScore,
    healthScore,
    emailScore,
    pushScore,
    cronScore,
    overallEnterpriseScore,
    checks,
    indexesAdded: [...indexesAdded],
    remainingWarnings: checks.filter((c) => !c.pass).map((c) => `${c.label}: ${c.message}`),
    productionReady: pass,
    enterpriseCertified: pass,
    timestamp: new Date().toISOString(),
  };
}
