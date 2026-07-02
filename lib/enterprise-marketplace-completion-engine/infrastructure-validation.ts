import { isLaunchReadinessPass, runLaunchReadinessScan } from "@/lib/enterprise-launch-readiness-engine";
import { GLOBAL_INFRASTRUCTURE_CHECKS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export type GlobalInfrastructureValidationResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  checks: CompletionValidationItem[];
  launchReadinessPass: boolean;
};

export function runGlobalInfrastructureValidation(): GlobalInfrastructureValidationResult {
  const launch = runLaunchReadinessScan("enterprise-certification");
  const launchPass = isLaunchReadinessPass(launch);

  const checks = GLOBAL_INFRASTRUCTURE_CHECKS.map((check) => {
    let pass = launchPass;
    if (check === "email" || check === "smtp") pass = fileExists(".env.example");
    if (check === "pwa" || check === "manifest" || check === "service-worker") {
      pass = fileExists("public/manifest.json") || fileExists("app/manifest.ts") || launchPass;
    }
    if (check === "environment-variables") pass = fileExists(".env.example");
    if (check === "deployment-configuration") pass = fileExists("next.config.ts");
    if (check === "database" || check === "indexes") pass = fileExists("lib/supabase/middleware.ts");
    if (check === "security") pass = launchPass && fileExists("middleware.ts");
    return createCheck("infrastructure", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} requires attention`);
  });

  const clear = checks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round((clear / checks.length) * 10000) / 100;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : "fail",
    checks,
    launchReadinessPass: launchPass,
  };
}
