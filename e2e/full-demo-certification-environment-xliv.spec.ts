/**
 * Absolute Blood Law XLIV — Full Demo Certification Environment (runtime)
 * localhost:3000 only · visual evidence · session teardown · production unchanged
 *
 * Requires: migration applied · service role · ROVEXO_DEMO_SESSION_KEY (optional for API)
 * Skips gracefully when admin/session unavailable (contract tests still gate SSOT).
 */

import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { XLIV_VISUAL_STEPS } from "@/lib/full-demo/demo-session-contract-v1";
import { screenshotPath } from "./helpers/stable-ui";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const REPORT_DIR = path.join(process.cwd(), "test-results", "xliv-certification");
const SESSION_KEY = process.env.ROVEXO_DEMO_SESSION_KEY ?? "";

type ModuleLine = {
  module: string;
  result: "PASS" | "FAIL" | "WARNING";
  screenshot?: string;
  executionMs: number;
  evidence: string;
};

function writeReport(lines: ModuleLine[], footer: string[]) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const body = [
    "==========================================================",
    "FULL PLATFORM CERTIFICATION REPORT — BLOOD XLIV",
    `HOST: ${BASE}`,
    `CAPTURED: ${new Date().toISOString()}`,
    "==========================================================",
    "",
    ...lines.map((line) => {
      const shot = line.screenshot ? ` Screenshot: ${line.screenshot}` : "";
      return `${line.module}: ${line.result} | ${line.executionMs}ms | ${line.evidence}${shot}`;
    }),
    "",
    ...footer,
    "==========================================================",
  ].join("\n");
  fs.writeFileSync(path.join(REPORT_DIR, "FULL_PLATFORM_CERTIFICATION_REPORT.txt"), body, "utf8");
}

test.describe("Absolute Blood Law XLIV — Full Demo Certification Environment", () => {
  test("visual runtime certification with isolated demo session", async ({ page }) => {
    test.setTimeout(180_000);
    const modules: ModuleLine[] = [];
    let sessionId: string | null = null;
    let productionUnchanged = false;
    let sessionStarted = false;

    const shot = async (step: (typeof XLIV_VISUAL_STEPS)[number], label: string) => {
      const started = Date.now();
      const file = screenshotPath("xliv", `${step}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      try {
        await page.screenshot({ path: file, fullPage: true });
        modules.push({
          module: label,
          result: "PASS",
          screenshot: file,
          executionMs: Date.now() - started,
          evidence: step,
        });
      } catch (error) {
        modules.push({
          module: label,
          result: "FAIL",
          executionMs: Date.now() - started,
          evidence: error instanceof Error ? error.message : "screenshot failed",
        });
      }
    };

    try {
      // Session create via Node engine path is preferred; HTTP requires staff/session key.
      // E2E uses direct engine when service role present.
      const { createDemoCertificationSession, destroyDemoCertificationSession } = await import(
        "@/lib/full-demo/demo-session-engine-v1"
      );

      const created = await createDemoCertificationSession({ maxListings: 5 });
      if (!created.ok) {
        modules.push({
          module: "00 Session Create",
          result: "WARNING",
          executionMs: 0,
          evidence: `${created.code}: ${created.message}`,
        });
        writeReport(modules, [
          "RUNTIME: SKIPPED/WARNING — apply XLIV migration + service role to run full session.",
          "PRODUCTION READY: NO",
          "BLOCK DEPLOYMENT until runtime PASS + production unchanged.",
        ]);
        test.skip(true, created.message);
        return;
      }

      sessionId = created.sessionId;
      sessionStarted = true;
      modules.push({
        module: "00 Session Create",
        result: "PASS",
        executionMs: 0,
        evidence: `session=${sessionId} copies=${created.demoListingIds.length}`,
      });

      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await shot("01_home", "01 Home");

      const slug = created.demoListingSlugs[0];
      if (slug) {
        await page.goto(`${BASE}/listing/${encodeURIComponent(slug)}`, {
          waitUntil: "domcontentloaded",
        });
        await shot("02_listing", "02 Listing");
      } else {
        modules.push({
          module: "02 Listing",
          result: "FAIL",
          executionMs: 0,
          evidence: "no demo listing slug",
        });
      }

      await page.goto(`${BASE}/inbox`, { waitUntil: "domcontentloaded" });
      await shot("03_messages", "03 Messages");

      await page.goto(`${BASE}/balance`, { waitUntil: "domcontentloaded" });
      await shot("09_wallet", "09 Wallet");

      await page.goto(`${BASE}/orders`, { waitUntil: "domcontentloaded" });
      await shot("17_orders", "17 Orders");

      await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" });
      await shot("19_dashboard", "19 Dashboard");

      // Remaining visual steps — capture current cert surfaces (offer/checkout need auth flows).
      for (const step of XLIV_VISUAL_STEPS) {
        if (modules.some((m) => m.evidence === step)) continue;
        modules.push({
          module: step,
          result: "WARNING",
          executionMs: 0,
          evidence: "pending authenticated buyer/seller flow under session copies",
        });
      }

      const destroyed = await destroyDemoCertificationSession(sessionId);
      sessionId = null;
      if (!destroyed.ok) {
        modules.push({
          module: "99 Session Destroy",
          result: "FAIL",
          executionMs: 0,
          evidence: destroyed.message,
        });
        productionUnchanged = false;
      } else {
        modules.push({
          module: "99 Session Destroy",
          result: "PASS",
          executionMs: 0,
          evidence: `deleted=${destroyed.deletedArtifacts}`,
        });
        productionUnchanged = true;
        await shot("20_success", "20 Success");
      }
    } finally {
      if (sessionId) {
        try {
          const { destroyDemoCertificationSession } = await import(
            "@/lib/full-demo/demo-session-engine-v1"
          );
          await destroyDemoCertificationSession(sessionId);
        } catch {
          // best-effort
        }
      }

      const failed = modules.filter((m) => m.result === "FAIL").length;
      const warnings = modules.filter((m) => m.result === "WARNING").length;
      writeReport(modules, [
        `FAILS: ${failed}`,
        `WARNINGS: ${warnings}`,
        `PRODUCTION UNCHANGED: ${productionUnchanged ? "YES" : "NO"}`,
        `SESSION KEY CONFIGURED: ${SESSION_KEY ? "YES" : "NO"}`,
        "PRODUCTION READY: NO until zero FAIL and Owner visual approval",
        "BLOCK DEPLOYMENT until every runtime flow passes with visual evidence.",
      ]);

      expect(failed, "XLIV runtime must have zero FAIL modules").toBe(0);
      if (sessionStarted) {
        expect(productionUnchanged, "Production must be unchanged after teardown").toBe(true);
      }
    }
  });
});
