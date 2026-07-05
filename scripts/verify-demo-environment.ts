import { loadDotEnvFiles } from "./playwright-env.mjs";
import { runDemoEnvironmentVerification } from "@/lib/demo-environment/verify";

loadDotEnvFiles();

async function main() {
  const report = await runDemoEnvironmentVerification();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
