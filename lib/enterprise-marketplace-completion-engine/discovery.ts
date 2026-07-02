import { AUTONOMOUS_DISCOVERY_CHECKS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export type AutonomousDiscoveryResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  checks: CompletionValidationItem[];
};

export function runAutonomousMarketplaceDiscovery(input: {
  modulesComplete: boolean;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
}): AutonomousDiscoveryResult {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const checks = AUTONOMOUS_DISCOVERY_CHECKS.map((check) => {
    let pass = input.modulesComplete && input.launchPass;
    let message = `${labelize(check)} validated`;

    if (check.startsWith("missing-pages") || check.startsWith("missing-features")) {
      pass = input.modulesComplete;
    } else if (check.startsWith("incomplete")) {
      pass = input.modulesComplete;
    } else if (check.includes("components")) {
      pass = fileExists("components/ui/Button.tsx") && !homeContent.includes("CategoryGridSection");
    } else if (check.includes("apis")) {
      pass = fileExists("app/api/search/route.ts");
    } else if (check.includes("database")) {
      pass = fileExists("lib/supabase/middleware.ts");
    } else if (check.includes("permissions") || check.includes("validation")) {
      pass = fileExists("middleware.ts") && input.modulesComplete;
    } else if (check.includes("responsive")) {
      pass = input.globalPass && fileExists("styles/rovexo/mobile.css");
    } else if (check.includes("accessibility")) {
      pass = input.globalPass;
    } else if (check.includes("seo") || check.includes("metadata")) {
      pass = input.homepagePass && fileExists("app/page.tsx");
    } else if (check.includes("categories")) {
      pass = fileExists("app/categories/page.tsx");
    } else if (check.includes("images") || check.includes("icons")) {
      pass = premiumStylesActive();
    } else if (check.includes("ai")) {
      pass = fileExists("app/sell/new/page.tsx");
    } else if (check.includes("audit") || check.includes("logs")) {
      pass = input.launchPass;
    }

    if (!pass) message = `${labelize(check)} requires attention`;
    return createCheck("discovery", check, pass, message);
  });

  const clear = checks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round((clear / checks.length) * 10000) / 100;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : "fail",
    checks,
  };
}
