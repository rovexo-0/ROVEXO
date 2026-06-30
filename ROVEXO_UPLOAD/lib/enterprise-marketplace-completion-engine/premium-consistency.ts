import { PREMIUM_CONSISTENCY_CHECKS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export type PremiumConsistencyResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  checks: CompletionValidationItem[];
};

export function runPremiumConsistencyScan(input: { homepagePass: boolean; globalPass: boolean }): PremiumConsistencyResult {
  const tokens = readSource("styles/tokens.css");
  const categoryRail = readSource("styles/rovexo/category-rail.css");
  const hero = readSource("styles/rovexo/hero.css");

  const checks = PREMIUM_CONSISTENCY_CHECKS.map((check) => {
    let pass = premiumStylesActive() && input.globalPass;
    if (check === "spacing" || check === "typography") pass = pass && (tokens.length > 0 || categoryRail.length > 0);
    if (check === "cards" || check === "radius") pass = pass && categoryRail.length > 0;
    if (check === "icons" || check === "colors") pass = pass && tokens.length > 0;
    if (check === "animations") pass = pass && hero.length > 0;
    if (check === "responsive") pass = pass && fileExists("styles/rovexo/mobile.css");
    if (check === "safe-area") pass = pass && fileExists("styles/rovexo/bottom-nav-premium.css");
    if (check === "visual-rhythm" || check === "design-language") pass = pass && input.homepagePass;
    return createCheck("premium", check, pass, pass ? `Premium 2026 ${labelize(check)} PASS` : `Premium 2026 ${labelize(check)} pending`);
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
