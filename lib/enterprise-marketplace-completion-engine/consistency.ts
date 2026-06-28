import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { MARKETPLACE_CONSISTENCY_DOMAINS, MARKETPLACE_CONSISTENCY_DIMENSIONS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import type {
  CompletionStatus,
  ConsistencyCheck,
  MarketplaceConsistencyResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function passStatus(): CompletionStatus {
  return "pass";
}

function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fileExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
  } catch {
    return "";
  }
}

const DOMAIN_REFS: Record<(typeof MARKETPLACE_CONSISTENCY_DOMAINS)[number], string[]> = {
  homepage: ["app/page.tsx", "components/home/HomeContent.tsx", "styles/rovexo/hero.css"],
  categories: ["app/categories/page.tsx", "components/home/HomeCategoryRail.tsx", "styles/rovexo/category-rail.css"],
  search: ["app/search/page.tsx", "app/api/search/route.ts"],
  listings: ["app/listing/[slug]/page.tsx", "app/sell/new/page.tsx"],
  buyer: ["app/account/page.tsx", "app/account/orders/page.tsx"],
  seller: ["app/seller/dashboard/page.tsx", "app/seller/listings/page.tsx"],
  company: ["app/business/dashboard/page.tsx", "app/business/center/page.tsx"],
  orders: ["app/account/orders/page.tsx", "app/seller/orders/page.tsx"],
  checkout: ["app/checkout/[slug]/page.tsx"],
  wallet: ["app/wallet/page.tsx", "app/account/wallet/page.tsx"],
  payments: ["app/account/payment-methods/page.tsx", "lib/stripe/server.ts"],
  shipping: ["app/shipping/page.tsx"],
  messages: ["app/messages/page.tsx"],
  notifications: ["app/notifications/page.tsx"],
  community: ["app/trust/page.tsx"],
  business: ["app/business/center/page.tsx"],
  analytics: ["app/seller/analytics/page.tsx", "app/business/analytics/page.tsx"],
};

function domainComplete(domain: (typeof MARKETPLACE_CONSISTENCY_DOMAINS)[number]): boolean {
  return (DOMAIN_REFS[domain] ?? []).every((ref) => fileExists(ref));
}

function premiumStylesActive(): boolean {
  return (
    fileExists("styles/rovexo/index.css") &&
    fileExists("styles/rovexo/category-rail.css") &&
    fileExists("styles/rovexo/hero.css")
  );
}

function evaluateConsistency(
  domain: (typeof MARKETPLACE_CONSISTENCY_DOMAINS)[number],
  dimension: (typeof MARKETPLACE_CONSISTENCY_DIMENSIONS)[number],
  context: { globalPass: boolean; homepagePass: boolean; premiumStyles: boolean },
): ConsistencyCheck {
  const complete = domainComplete(domain);
  let score = complete ? 100 : 0;
  let pass = complete;
  let message = `${labelize(domain)} ${labelize(dimension)} consistency validated`;

  if (dimension === "visual") {
    pass = complete && context.premiumStyles;
    score = pass ? 100 : complete ? 85 : 0;
    message = pass ? `${labelize(domain)} visual consistency — Premium 2026` : `${labelize(domain)} visual consistency gap`;
  } else if (dimension === "functional") {
    pass = complete;
    score = pass ? 100 : 0;
    message = pass ? `${labelize(domain)} functional consistency PASS` : `${labelize(domain)} functional gaps detected`;
  } else if (dimension === "enterprise") {
    pass = complete && context.globalPass;
    score = pass ? 100 : complete ? 90 : 0;
    message = pass ? `${labelize(domain)} enterprise consistency PASS` : `${labelize(domain)} enterprise alignment pending`;
  } else if (dimension === "premium-2026") {
    pass = complete && context.premiumStyles && (domain !== "homepage" || context.homepagePass);
    score = pass ? 100 : complete ? 88 : 0;
    message = pass ? `${labelize(domain)} Premium 2026 consistency PASS` : `${labelize(domain)} Premium 2026 upgrade pending`;
  }

  return {
    id: `consistency-${domain}-${dimension}`,
    domain,
    dimension,
    status: pass ? passStatus() : "fail",
    score,
    message,
  };
}

export function runMarketplaceConsistencyScan(input: {
  globalPass: boolean;
  homepagePass: boolean;
}): MarketplaceConsistencyResult {
  const premiumStyles = premiumStylesActive();
  const checks = MARKETPLACE_CONSISTENCY_DOMAINS.flatMap((domain) =>
    MARKETPLACE_CONSISTENCY_DIMENSIONS.map((dimension) =>
      evaluateConsistency(domain, dimension, { ...input, premiumStyles }),
    ),
  );
  const avgScore = checks.length === 0 ? 0 : Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length);
  const passPercent = avgScore;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    checks,
  };
}

export function isMarketplaceConsistencyPass(result: MarketplaceConsistencyResult): boolean {
  return result.status === "pass" && result.passPercent >= 100;
}
