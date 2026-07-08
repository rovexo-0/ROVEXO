#!/usr/bin/env node
/**
 * Deep homepage hydration audit — captures console after full load + hydration.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "hydration-final");
mkdirSync(outDir, { recursive: true });

const HYDRATION_PATTERNS = [
  /hydration failed/i,
  /hydration mismatch/i,
  /did not match/i,
  /server rendered html/i,
  /text content does not match/i,
  /prop.*did not match/i,
  /Encountered a script tag while rendering React component/i,
  /Minified React error #418/i,
  /Minified React error #423/i,
  /Minified React error #425/i,
];

async function auditViewport(page, label, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  const messages = [];

  page.on("console", (msg) => {
    messages.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (err) => {
    messages.push({ type: "pageerror", text: err.message });
  });

  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.locator('[data-homepage-version="v7.0"]').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: join(outDir, `homepage-${label}.png`),
    fullPage: true,
  });

  const hydrationHits = messages.filter((m) =>
    HYDRATION_PATTERNS.some((p) => p.test(m.text)),
  );

  const warnings = messages.filter((m) => m.type === "warning");
  const errors = messages.filter((m) => m.type === "error" || m.type === "pageerror");

  return { label, messages, hydrationHits, warnings, errors };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();

  const results = [];
  results.push(await auditViewport(page, "desktop", { width: 1440, height: 900 }));
  results.push(await auditViewport(page, "mobile", { width: 390, height: 844 }));

  writeFileSync(join(outDir, "console-audit.json"), JSON.stringify(results, null, 2));

  const allHits = results.flatMap((r) => r.hydrationHits.map((h) => `[${r.label}] ${h.type}: ${h.text}`));
  const allWarnings = results.flatMap((r) =>
    r.warnings
      .filter((w) => HYDRATION_PATTERNS.some((p) => p.test(w.text)))
      .map((w) => `[${r.label}] warning: ${w.text}`),
  );
  const combined = [...allHits, ...allWarnings];
  const report = [
    combined.length === 0 ? "PASS — zero hydration console errors" : "FAIL — hydration errors detected",
    "",
    ...combined,
    "",
    `Artifacts: ${outDir}`,
  ].join("\n");

  writeFileSync(join(outDir, "hydration-report.txt"), report);
  console.log(report);

  await browser.close();
  if (combined.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
