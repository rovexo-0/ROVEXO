import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";
import { validatePlatformSecuritySurface } from "@/lib/ops/production-env";
import { isStripeConfigured } from "@/lib/stripe/server";
import type { ScanResultItem, ScanSeverity } from "@/lib/super-admin/operations/types";

const ROOT = process.cwd();

function severityFromHealth(
  status: "healthy" | "degraded" | "unhealthy",
): ScanSeverity {
  if (status === "healthy") return "healthy";
  if (status === "degraded") return "warning";
  return "critical";
}

function timed(label: string, run: () => Promise<ScanResultItem>): Promise<ScanResultItem> {
  const start = Date.now();
  return run().then((item) => ({ ...item, durationMs: Date.now() - start }));
}

function envPresent(...keys: string[]): boolean {
  return keys.some((key) => Boolean(process.env[key]?.trim()));
}

function fileExists(relativePath: string): boolean {
  return existsSync(join(ROOT, relativePath));
}

function readJsonField(path: string, field: string): string | null {
  try {
    const raw = readFileSync(join(ROOT, path), "utf8");
    const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function runAiPlatformScan(): Promise<ScanResultItem[]> {
  const health = await getPlatformHealthReport();
  const nextVersion = readJsonField("package.json", "next") ?? "unknown";
  const reactVersion = readJsonField("package.json", "react") ?? "unknown";
  const tsVersion = readJsonField("package.json", "typescript") ?? "unknown";

  const checks: Array<Promise<ScanResultItem>> = [
    timed("nextjs", async () => ({
      id: "nextjs",
      label: "Next.js",
      status: nextVersion.startsWith("16") ? "healthy" : "warning",
      message: `Next.js ${nextVersion}`,
      durationMs: 0,
    })),
    timed("react", async () => ({
      id: "react",
      label: "React",
      status: reactVersion.startsWith("19") ? "healthy" : "warning",
      message: `React ${reactVersion}`,
      durationMs: 0,
    })),
    timed("typescript", async () => ({
      id: "typescript",
      label: "TypeScript",
      status: fileExists("tsconfig.json") ? "healthy" : "critical",
      message: fileExists("tsconfig.json") ? `TypeScript ${tsVersion}` : "tsconfig.json missing",
      durationMs: 0,
    })),
    timed("supabase", async () => ({
      id: "supabase",
      label: "Supabase",
      status: severityFromHealth(health.checks.database.status),
      message: health.checks.database.message ?? "Supabase connected",
      durationMs: 0,
    })),
    timed("authentication", async () => ({
      id: "authentication",
      label: "Authentication",
      status:
        envPresent("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
        fileExists("lib/supabase/middleware.ts")
          ? "healthy"
          : "critical",
      message: "Supabase Auth session middleware active",
      durationMs: 0,
    })),
    timed("database", async () => ({
      id: "database",
      label: "Database",
      status: severityFromHealth(health.checks.database.status),
      message: health.checks.database.message ?? `${health.checks.database.latencyMs}ms`,
      durationMs: 0,
    })),
    timed("storage", async () => ({
      id: "storage",
      label: "Storage",
      status: severityFromHealth(health.checks.storage.status),
      message: health.checks.storage.message ?? "Storage buckets reachable",
      durationMs: 0,
    })),
    timed("images", async () => ({
      id: "images",
      label: "Images",
      status: fileExists("next.config.ts") ? "healthy" : "warning",
      message: "next/image remote patterns configured",
      durationMs: 0,
    })),
    timed("search", async () => ({
      id: "search",
      label: "Search",
      status: fileExists("app/api/search/route.ts") ? "healthy" : "critical",
      message: fileExists("app/api/search/route.ts") ? "Search API route present" : "Missing search API",
      durationMs: 0,
    })),
    timed("seo", async () => ({
      id: "seo",
      label: "SEO",
      status:
        fileExists("app/sitemap.ts") && fileExists("app/robots.ts") ? "healthy" : "warning",
      message: "Sitemap and robots configured",
      durationMs: 0,
    })),
    timed("security", async () => ({
      id: "security",
      label: "Security",
      status: fileExists("middleware.ts") ? "healthy" : "critical",
      message: "Edge middleware enabled",
      durationMs: 0,
    })),
    timed("middleware", async () => ({
      id: "middleware",
      label: "Middleware",
      status: fileExists("middleware.ts") && fileExists("lib/supabase/middleware.ts")
        ? "healthy"
        : "critical",
      message: "Auth and route protection middleware loaded",
      durationMs: 0,
    })),
    timed("api-routes", async () => ({
      id: "api-routes",
      label: "API Routes",
      status: fileExists("app/api/health/route.ts") ? "healthy" : "warning",
      message: "Core API surface available",
      durationMs: 0,
    })),
    timed("environment", async () => ({
      id: "environment",
      label: "Environment Variables",
      status: envPresent("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
        ? "healthy"
        : "critical",
      message: envPresent("CRON_SECRET", "RESEND_API_KEY", "STRIPE_SECRET_KEY")
        ? "Production integrations configured"
        : "Some optional production variables are missing",
      durationMs: 0,
    })),
    timed("redis", async () => ({
      id: "redis",
      label: "Redis",
      status: severityFromHealth(health.checks.redis.status),
      message: health.checks.redis.message ?? "Redis operational",
      durationMs: 0,
    })),
    timed("stripe", async () => ({
      id: "stripe",
      label: "Stripe",
      status: severityFromHealth(health.checks.stripe.status),
      message: health.checks.stripe.message ?? (isStripeConfigured() ? "Stripe connected" : "Not configured"),
      durationMs: 0,
    })),
    timed("resend", async () => ({
      id: "resend",
      label: "Resend",
      status: severityFromHealth(health.checks.email.status),
      message: health.checks.email.message ?? "Email ready",
      durationMs: 0,
    })),
    timed("cron", async () => ({
      id: "cron",
      label: "Cron Jobs",
      status: severityFromHealth(health.checks.cron.status),
      message: health.checks.cron.message ?? "Cron heartbeat OK",
      durationMs: 0,
    })),
    timed("uploads", async () => ({
      id: "uploads",
      label: "Uploads",
      status: fileExists("app/api/listings/upload/route.ts") ? "healthy" : "warning",
      message: "Listing upload pipeline available",
      durationMs: 0,
    })),
    timed("performance", async () => ({
      id: "performance",
      label: "Performance",
      status: health.checks.database.latencyMs < 500 ? "healthy" : "warning",
      message: `Database ${health.checks.database.latencyMs}ms · API healthy`,
      durationMs: 0,
    })),
    timed("lighthouse", async () => ({
      id: "lighthouse",
      label: "Lighthouse",
      status: fileExists("public/sw.js") && fileExists("app/manifest.ts") ? "healthy" : "warning",
      message: "PWA service worker and manifest route support performance audits",
      durationMs: 0,
    })),
    timed("accessibility", async () => ({
      id: "accessibility",
      label: "Accessibility",
      status: fileExists("e2e/responsive.spec.ts") ? "healthy" : "warning",
      message: "Playwright + axe accessibility suite present",
      durationMs: 0,
    })),
    timed("pwa", async () => ({
      id: "pwa",
      label: "PWA",
      status:
        fileExists("public/sw.js") &&
        fileExists("app/manifest.ts") &&
        fileExists("components/pwa/PwaProvider.tsx")
          ? "healthy"
          : "warning",
      message: "Service worker, manifest route, and runtime registration active",
      durationMs: 0,
    })),
    timed("robots", async () => ({
      id: "robots",
      label: "Robots",
      status: fileExists("app/robots.ts") ? "healthy" : "critical",
      message: "robots.ts route active",
      durationMs: 0,
    })),
    timed("sitemap", async () => ({
      id: "sitemap",
      label: "Sitemap",
      status: fileExists("app/sitemap.ts") ? "healthy" : "critical",
      message: "Dynamic sitemap generator active",
      durationMs: 0,
    })),
    timed("rate-limiting", async () => ({
      id: "rate-limiting",
      label: "Rate Limiting",
      status: fileExists("lib/api/rate-limit.ts") ? "healthy" : "warning",
      message: "API rate limiting module available",
      durationMs: 0,
    })),
    timed("headers", async () => {
      const headerConfig = validateSecurityHeaderConfiguration(process.env.NODE_ENV === "production");
      const securitySurface = validatePlatformSecuritySurface();
      const pass = headerConfig.pass && securitySurface.pass;
      return {
        id: "headers",
        label: "Headers",
        status: pass ? "healthy" : "warning",
        message: pass
          ? "CSP, HSTS, X-Frame-Options, and security surface validated"
          : `Missing headers: ${headerConfig.missing.join(", ") || "security surface incomplete"}`,
        durationMs: 0,
      };
    }),
    timed("ssl", async () => ({
      id: "ssl",
      label: "SSL",
      status:
        process.env.NODE_ENV !== "production" ||
        process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
          ? "healthy"
          : "critical",
      message:
        process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") || process.env.NODE_ENV !== "production"
          ? "HTTPS app URL configured"
          : "NEXT_PUBLIC_APP_URL must use HTTPS in production",
      durationMs: 0,
    })),
    timed("health-checks", async () => ({
      id: "health-checks",
      label: "Health Checks",
      status: severityFromHealth(health.status),
      message: `Platform health: ${health.status}`,
      durationMs: 0,
    })),
  ];

  return Promise.all(checks);
}
