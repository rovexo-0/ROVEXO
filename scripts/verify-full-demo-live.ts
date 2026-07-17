import { loadDotEnvFiles } from "./playwright-env.mjs";
import { runFullDemoLiveVerification } from "@/lib/full-demo/live-verification";
import { assertReleaseProtectionNoOverride } from "@/lib/full-demo/no-override";

// Load local non-sensitive env only. Never overwrite process.env values already
// injected by Vercel builds. Vercel CLI Sensitive redactions ([SENSITIVE]) are ignored.
loadDotEnvFiles();
assertReleaseProtectionNoOverride();

async function main(): Promise<void> {
  const report = await runFullDemoLiveVerification();
  // Report includes mode (service_role | demo_session) and check results — never secrets.
  console.log(JSON.stringify(report, null, 2));

  try {
    if (!report.passed) {
      const failures = report.checks.filter((check) => !check.pass);
      throw new Error(
        failures
          .map((check) => `${check.id}: actual=${check.actual} required=${check.required}`)
          .join("\n"),
      );
    }
    console.log(
      `\n✓ FULL DEMO LIVE VERIFICATION PASSED (mode=${report.mode}).\n`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("\n✖ LIVE DEPLOYMENT BLOCKED.\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error("\n✖ LIVE DEPLOYMENT BLOCKED.\n");
  process.exit(1);
});
