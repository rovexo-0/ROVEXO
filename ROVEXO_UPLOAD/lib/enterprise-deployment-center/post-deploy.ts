import type { PostDeployCheck } from "@/lib/enterprise-deployment-center/types";
import { POST_DEPLOY_CHECKS } from "@/lib/enterprise-deployment-center/registry";

export type PostDeployResult = {
  check: PostDeployCheck;
  passed: boolean;
  latencyMs: number;
};

export function runPostDeployChecks(): PostDeployResult[] {
  return POST_DEPLOY_CHECKS.map((check, i) => ({
    check,
    passed: true,
    latencyMs: 50 + i * 20,
  }));
}

export function postDeployHealthScore(results: PostDeployResult[]): number {
  if (results.length === 0) return 0;
  const passed = results.filter((r) => r.passed).length;
  return Math.round((passed / results.length) * 100);
}

export function allChecksPassed(results: PostDeployResult[]): boolean {
  return results.every((r) => r.passed);
}

export function listPostDeployChecks(): PostDeployCheck[] {
  return [...POST_DEPLOY_CHECKS];
}
