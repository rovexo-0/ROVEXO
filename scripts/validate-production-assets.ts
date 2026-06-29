import {
  formatValidationReport,
  validateProductionAssets,
} from "@/lib/super-admin/production-assets/validator";

async function main() {
  const report = await validateProductionAssets();
  console.log(formatValidationReport(report));
  console.log("");
  console.log(
    `Summary: ${report.summary.premiumAssets} premium assets · ${report.summary.totalAssets} total raster assets · ${report.issues.length} blocking issues`,
  );

  if (!report.deploymentReady) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
