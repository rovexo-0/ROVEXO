import type { DeploymentBuild, PlatformRelease } from "@/lib/enterprise-deployment-center/types";
import { validationScore } from "@/lib/enterprise-deployment-center/builds";

export type ValidationResult = {
  passed: boolean;
  score: number;
  checks: string[];
};

export function validateRelease(release: PlatformRelease, build?: DeploymentBuild): ValidationResult {
  const checks = [
    release.version.length > 0 ? "Version defined" : "Missing version",
    release.environment ? "Environment set" : "Missing environment",
    build ? (validationScore(build) >= 80 ? "Build validated" : "Build score low") : "Build pending",
  ];
  const passed = checks.every((c) => !c.includes("Missing") && !c.includes("low") && !c.includes("pending"));
  const score = build ? Math.round((validationScore(build) + (passed ? 100 : 50)) / 2) : passed ? 100 : 40;
  return { passed, score, checks };
}

export function validateBuildIntegrity(build: DeploymentBuild): ValidationResult {
  const score = validationScore(build);
  return {
    passed: score >= 80 && build.status === "validated",
    score,
    checks: build.validations.map((v) => `${v}: ok`),
  };
}

export function validateEnvironmentReadiness(version: string, targetVersion: string): ValidationResult {
  const passed = version !== targetVersion;
  return {
    passed,
    score: passed ? 90 : 30,
    checks: [passed ? "Version delta confirmed" : "Already deployed"],
  };
}
