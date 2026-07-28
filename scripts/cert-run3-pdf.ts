import { chromium } from "@playwright/test";
import { join } from "node:path";

async function main() {
  const out = join(process.cwd(), "test-results/run3-ui-comparison");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${join(out, "UI_COMPARISON_REPORT.html")}`, { waitUntil: "load" });
  await page.pdf({
    path: join(out, "UI_COMPARISON_REPORT.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
  });
  await browser.close();
  console.log("PDF written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
