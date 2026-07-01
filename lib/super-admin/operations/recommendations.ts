import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Recommendation } from "@/lib/super-admin/operations/types";

function packageDependencies(): Record<string, string> {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const json = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return { ...json.dependencies, ...json.devDependencies };
  } catch {
    return {};
  }
}

export function buildAiRecommendations(input: {
  bundleHeavy?: boolean;
  errorCount24h?: number;
  pendingEmails?: number;
}): Recommendation[] {
  const deps = packageDependencies();
  const recommendations: Recommendation[] = [];

  if (deps.sharp && deps["browser-image-compression"]) {
    recommendations.push({
      id: "image-pipeline",
      title: "Optimise listing image pipeline",
      category: "Performance",
      estimatedGain: "15–25% faster uploads",
      difficulty: "medium",
      filesAffected: ["app/api/listings/upload/route.ts", "lib/listings/upload-client.ts"],
      detail: "Ensure client-side compression runs before upload and server uses sharp for thumbnails.",
    });
  }

  recommendations.push({
    id: "code-splitting",
    title: "Expand route-level code splitting",
    category: "Code splitting",
    estimatedGain: "10–18% smaller initial bundle",
    difficulty: "low",
    filesAffected: ["app/super-admin/**/page.tsx", "features/super-admin/components/*"],
    detail: "Keep heavy Super Admin panels in client islands loaded on demand.",
  });

  recommendations.push({
    id: "lazy-loading",
    title: "Lazy load below-the-fold home sections",
    category: "Lazy loading",
    estimatedGain: "8–12% faster LCP",
    difficulty: "low",
    filesAffected: ["components/home/RovexoHomePage.tsx", "components/home/RovexoFeaturedListings.tsx"],
    detail: "Defer non-critical product grids until after hero paint.",
  });

  recommendations.push({
    id: "memoization",
    title: "Memoize expensive product card renders",
    category: "Memoization",
    estimatedGain: "5–10% smoother scroll",
    difficulty: "low",
    filesAffected: ["components/ui/ProductCard.tsx"],
    detail: "Wrap ProductCard with React.memo and stabilise list keys in grids.",
  });

  if (!deps["@upstash/redis"]) {
    recommendations.push({
      id: "redis-cache",
      title: "Enable Redis caching layer",
      category: "Caching improvements",
      estimatedGain: "20–40% faster repeated API reads",
      difficulty: "medium",
      filesAffected: ["lib/api/rate-limit.ts", ".env.local"],
      detail: "Configure Upstash Redis to replace in-memory rate limit fallback.",
    });
  }

  recommendations.push({
    id: "security-headers",
    title: "Review Content-Security-Policy headers",
    category: "Security improvements",
    estimatedGain: "Reduced XSS attack surface",
    difficulty: "medium",
    filesAffected: ["next.config.ts"],
    detail: "Add CSP compatible with Supabase, Stripe, and analytics domains.",
  });

  recommendations.push({
    id: "seo-metadata",
    title: "Expand programmatic SEO metadata",
    category: "SEO improvements",
    estimatedGain: "5–15% organic crawl coverage",
    difficulty: "medium",
    filesAffected: ["lib/seo/programmatic/resolver.ts", "app/sitemap.ts"],
    detail: "Ensure all category leaf pages emit unique titles and canonical URLs.",
  });

  recommendations.push({
    id: "accessibility-focus",
    title: "Audit focus order on sell flow",
    category: "Accessibility improvements",
    estimatedGain: "WCAG 2.2 AA compliance",
    difficulty: "low",
    filesAffected: ["features/sell/components/SellListingForm.tsx"],
    detail: "Verify keyboard trap-free category picker and visible focus rings.",
  });

  if ((input.errorCount24h ?? 0) > 5) {
    recommendations.push({
      id: "error-budget",
      title: "Investigate elevated API error rate",
      category: "Slow queries",
      estimatedGain: "Stability recovery",
      difficulty: "high",
      filesAffected: ["lib/ops/logger.ts", "platform_error_logs"],
      detail: `${input.errorCount24h} errors logged in 24h — review /super-admin/operations logs.`,
    });
  }

  if ((input.pendingEmails ?? 0) > 0) {
    recommendations.push({
      id: "email-queue",
      title: "Clear pending email outbox",
      category: "Performance",
      estimatedGain: "Faster notification delivery",
      difficulty: "low",
      filesAffected: ["lib/email/service.ts", "email_outbox"],
      detail: `${input.pendingEmails} emails pending — verify Resend configuration.`,
    });
  }

  recommendations.push({
    id: "unused-imports",
    title: "Run ESLint unused import cleanup",
    category: "Unused imports",
    estimatedGain: "2–5% smaller bundles",
    difficulty: "low",
    filesAffected: ["eslint.config.mjs"],
    detail: "Execute npm run lint -- --fix across feature modules quarterly.",
  });

  recommendations.push({
    id: "db-indexes",
    title: "Review high-traffic query indexes",
    category: "Missing indexes",
    estimatedGain: "10–30% faster listings search",
    difficulty: "high",
    filesAffected: ["supabase/migrations/", "lib/listings/repository.ts"],
    detail: "Analyse products and orders queries; add indexes for seller_id and status filters.",
  });

  return recommendations;
}
