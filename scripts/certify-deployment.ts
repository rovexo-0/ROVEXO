/**
 * Final Deployment Certification — static aggregate gate.
 * Exit 1 blocks release when any named certification/contract gate fails.
 *
 *   npm run certify:deployment
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";
import {
  assertDeploymentCertificationPassed,
  runDeploymentCertificationScan,
} from "@/lib/full-demo/deployment-certification";
import { assertReleaseProtectionNoOverride } from "@/lib/full-demo/no-override";

loadDotEnvFiles();
assertReleaseProtectionNoOverride();

const report = runDeploymentCertificationScan();
console.log(JSON.stringify(report, null, 2));

try {
  assertDeploymentCertificationPassed(report);
  console.log("\n✓ DEPLOYMENT CERTIFICATION PASSED (static) — continue certify:predeploy.\n");
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("\n✖ LIVE DEPLOYMENT BLOCKED.\n");
  process.exit(1);
}
