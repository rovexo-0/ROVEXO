/**
 * Capture Master Image Pack phone frames as PNGs via Playwright.
 * Requires: node scripts/generate-master-image-pack-local.mjs first.
 */
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const OUT = join(process.cwd(), "owner-review-screenshots", "master-image-pack-v1");
const HTML = join(OUT, "index.html");
const FRAMES = join(OUT, "frames");

async function main() {
  if (!existsSync(HTML)) {
    console.error("Missing index.html — run generate-master-image-pack-local.mjs first");
    process.exit(1);
  }
  mkdirSync(FRAMES, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle" });

  const phones = page.locator("article.phone");
  const count = await phones.count();
  console.log(`Capturing ${count} frames…`);

  for (let i = 0; i < count; i++) {
    const el = phones.nth(i);
    const hub = await el.getAttribute("data-hub");
    const state = await el.getAttribute("data-state");
    const name = `${String(i + 1).padStart(3, "0")}-${hub}-${state}.png`;
    await el.screenshot({ path: join(FRAMES, name), type: "png" });
    if ((i + 1) % 20 === 0 || i + 1 === count) {
      console.log(`  ${i + 1}/${count}`);
    }
  }

  // Full pack composite strip (first viewport of grid)
  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.screenshot({
    path: join(OUT, "00-master-pack-overview.png"),
    fullPage: true,
    type: "png",
  });

  await browser.close();
  console.log(`PNGs written to ${FRAMES}`);
  console.log(`Overview: ${join(OUT, "00-master-pack-overview.png")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
