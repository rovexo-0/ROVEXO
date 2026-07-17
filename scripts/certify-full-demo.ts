/**
 * Full Demo Certification — run before every live deployment.
 * Exit 1 blocks release when any gate fails.
 *
 *   npm run certify:full-demo
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";
import {
  assertFullDemoCertificationPassed,
  runFullDemoCertificationScan,
} from "@/lib/full-demo/deploy-gate";
import { assertReleaseProtectionNoOverride } from "@/lib/full-demo/no-override";

loadDotEnvFiles();
assertReleaseProtectionNoOverride();

const report = runFullDemoCertificationScan();
console.log(JSON.stringify(report, null, 2));

try {
  assertFullDemoCertificationPassed(report);
  console.log(
    "\n✓ FULL DEMO STATIC CONTRACT PASSED — run certify:predeploy for deployment eligibility.\n",
  );
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("\n✖ LIVE DEPLOYMENT BLOCKED.\n");
  process.exit(1);
}
