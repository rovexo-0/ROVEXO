import { loadDotEnvFiles } from "./playwright-env.mjs";
import { runHomepageDemoCleanup } from "@/lib/homepage/demo-cleanup";

loadDotEnvFiles();

runHomepageDemoCleanup()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
