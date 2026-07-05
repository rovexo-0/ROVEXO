import { loadDotEnvFiles } from "./playwright-env.mjs";
import { runDemoEnvironmentSeed } from "@/lib/demo-environment/seed";

loadDotEnvFiles();

async function main() {
  const report = await runDemoEnvironmentSeed();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
