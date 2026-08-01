/**
 * Authenticated localhost Sell UI Polish Phase 1 — visual proof capture.
 * Presentation evidence only. Does not certify Product PASS.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadDotEnvFiles } from "./playwright-env.mjs";
import { signInDemoSeller, gotoSellPage, clearPersistedSellDraft } from "../e2e/helpers/sell";

const OUT = join(process.cwd(), "docs/modules/sell/failed-polish-audit-evidence");
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const CHROME =
  process.env.PLAYWRIGHT_CHROME_PATH ??
  "/tmp/cursor-sandbox-cache/0e43355449949a09a7da0a7ea0912b24/playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell";

async function openCategorySearch(page: Page, query: string): Promise<void> {
  const categoryButton = page.getByRole("button", { name: /^Category\b/i }).first();
  await categoryButton.click();
  await page.getByRole("heading", { name: /Department|Category|Search|Product Type/i }).first().waitFor({ timeout: 15_000 });
  const search = page.locator("#sell-category-search");
  await search.fill(query);
  await page.waitForTimeout(400);
}

async function selectSearchResult(page: Page, name: RegExp): Promise<void> {
  const row = page.locator("[data-category-engine='v1.0-catalog-search']").getByRole("button", { name }).first();
  await row.waitFor({ state: "visible", timeout: 15_000 });
  await row.click();
  await page.waitForTimeout(500);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(OUT, name), fullPage: false });
}

async function openAttribute(page: Page, label: RegExp, fieldId?: string): Promise<void> {
  const row = fieldId
    ? page.locator(`#${fieldId}`).getByRole("button").first()
    : page.getByRole("button", { name: label }).first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await page.waitForTimeout(400);
}

async function closePicker(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

async function main() {
  loadDotEnvFiles();
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: { width: 430, height: 932 },
  });
  const page = await context.newPage();

  await signInDemoSeller(page, BASE);
  await clearPersistedSellDraft(page);
  await gotoSellPage(page);

  // --- Category search polish ---
  await openCategorySearch(page, "dress");
  await shot(page, "10-category-search-polish.png");
  await selectSearchResult(page, /Dresses.*Women'?s Fashion/i);

  // Fashion attributes: Brand / Material / Condition
  await page.waitForTimeout(600);
  const fashionEvidence = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[id^='sell-field-attribute'], #sell-field-condition")).map(
      (el) => ({
        id: el.id,
        text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "",
      }),
    );
    return labels;
  });
  writeFileSync(join(OUT, "fashion-attributes.json"), JSON.stringify(fashionEvidence, null, 2));

  // Price + Quantity on fashion form
  await page.locator("#sell-field-price").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const priceEvidence = await page.evaluate(() => {
    const symbol = document.querySelector(".sell-price-currency__symbol");
    const cs = symbol ? getComputedStyle(symbol) : null;
    const rect = symbol?.getBoundingClientRect();
    const input = document.querySelector(".sell-price-currency .cds-input") as HTMLElement | null;
    const inputCs = input ? getComputedStyle(input) : null;
    return {
      symbolText: symbol?.textContent ?? null,
      display: cs?.display ?? null,
      visibility: cs?.visibility ?? null,
      opacity: cs?.opacity ?? null,
      color: cs?.color ?? null,
      rect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null,
      inputPaddingLeft: inputCs?.paddingLeft ?? null,
      inViewport: rect ? rect.width > 0 && rect.height > 0 && rect.y > 0 : false,
    };
  });
  writeFileSync(join(OUT, "price-evidence.json"), JSON.stringify(priceEvidence, null, 2));
  await shot(page, "01-price-pound.png");

  await page.locator("[data-sell-quantity]").scrollIntoViewIfNeeded();
  await shot(page, "02-quantity-icon.png");

  // Brand
  await openAttribute(page, /^Brand$/i, "sell-field-brand");
  await shot(page, "03-brand-picker.png");
  await closePicker(page);

  // Material (recommended)
  await openAttribute(page, /^Material/i, "sell-field-material");
  await shot(page, "04-material-picker.png");
  await closePicker(page);

  // Colour
  await openAttribute(page, /^Colou?r/i, "sell-field-colour");
  await shot(page, "08-colour-picker.png");
  // Select Red to show selected state on grid
  const red = page.getByRole("radio", { name: /^Red$/i }).or(page.getByRole("checkbox", { name: /^Red$/i })).first();
  if (await red.isVisible().catch(() => false)) {
    await red.click();
    await page.waitForTimeout(300);
  }
  // Re-open after single-select auto-close
  if (!(await page.locator(".sell-colour-swatch-grid").isVisible().catch(() => false))) {
    await openAttribute(page, /^Colou?r/i, "sell-field-colour");
  }
  await shot(page, "08b-colour-picker-selected.png");
  await closePicker(page);

  // Condition
  await openAttribute(page, /^Condition$/i, "sell-field-condition");
  await shot(page, "05-condition-picker.png");
  await closePicker(page);

  // Parcel
  await page.locator("#sell-field-parcel").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Parcel/i }).first().click();
  await page.waitForTimeout(400);
  await shot(page, "07-parcel-picker.png");
  const medium = page.getByRole("radio", { name: /Medium/i }).first();
  if (await medium.isVisible().catch(() => false)) {
    // Don't auto-close permanently for evidence — screenshot before click if needed
    await medium.click();
    await page.waitForTimeout(100);
    await shot(page, "07b-parcel-selected.png");
  }
  await closePicker(page);

  // --- Compatibility via Vehicle Parts ---
  await clearPersistedSellDraft(page);
  await gotoSellPage(page);
  await openCategorySearch(page, "brake");
  await selectSearchResult(page, /Car Brakes.*Vehicle Parts/i);
  await page.waitForTimeout(700);

  const vehicleEvidence = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[id^='sell-field-attribute'], #sell-field-condition")).map(
      (el) => ({
        id: el.id,
        text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) ?? "",
      }),
    );
    const compat = Array.from(document.querySelectorAll("label, button, [class*='title']"))
      .map((el) => el.textContent?.trim() ?? "")
      .filter((t) => /compatible|compatibility/i.test(t));
    return { labels, compat };
  });
  writeFileSync(join(OUT, "vehicle-attributes.json"), JSON.stringify(vehicleEvidence, null, 2));

  // Compatibility may be text input or picker row
  const compatRow = page.getByRole("button", { name: /Compatible With|Compatibility/i }).first();
  const compatInput = page.getByLabel(/Compatible With|Compatibility/i).first();
  if (await compatRow.isVisible().catch(() => false)) {
    await compatRow.scrollIntoViewIfNeeded();
    await shot(page, "06-compatibility-row.png");
    await compatRow.click();
    await page.waitForTimeout(400);
    await shot(page, "06b-compatibility-picker.png");
    await closePicker(page);
  } else if (await compatInput.isVisible().catch(() => false)) {
    await compatInput.scrollIntoViewIfNeeded();
    await shot(page, "06-compatibility-input.png");
  } else {
    await shot(page, "06-compatibility-MISSING.png");
  }

  writeFileSync(
    join(OUT, "PHASE1_VISUAL_PROOF.md"),
    [
      "# Sell UI Polish Phase 1 — Authenticated localhost proof",
      "",
      `Base: ${BASE}`,
      `Captured: ${new Date().toISOString()}`,
      "",
      "## Screenshots",
      "- 10-category-search-polish.png",
      "- 01-price-pound.png",
      "- 02-quantity-icon.png",
      "- 03-brand-picker.png",
      "- 04-material-picker.png",
      "- 05-condition-picker.png",
      "- 06-compatibility-*.png",
      "- 07-parcel-picker.png",
      "",
      "## Price evidence",
      "```json",
      JSON.stringify(priceEvidence, null, 2),
      "```",
      "",
      "## Fashion attributes",
      "```json",
      JSON.stringify(fashionEvidence, null, 2),
      "```",
      "",
      "## Vehicle attributes",
      "```json",
      JSON.stringify(vehicleEvidence, null, 2),
      "```",
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify({ priceEvidence, fashionEvidence, vehicleEvidence }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
