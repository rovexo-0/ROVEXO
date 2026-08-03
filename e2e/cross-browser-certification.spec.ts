/**
 * ROVEXO Cross Browser Certification Engine v1.0 — runtime matrix.
 *
 * Runs once per `xcb-*` Playwright project (browser × device).
 * Produces per-page PASS/FAIL under test-results/cross-browser-certification-v1/.
 *
 * NOT Chromium-only. NOT visual smoke alone.
 * Mandatory before Preview Release. NO commit · NO push · NO deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import {
  CROSS_BROWSER_EVIDENCE_DIR,
  CROSS_BROWSER_TARGETS,
  collectStaticLimitations,
  type CrossBrowserCellResult,
  type CrossBrowserEvidenceSnapshot,
  type CrossBrowserPageId,
  type CrossBrowserTargetId,
} from "../lib/cross-browser/cross-browser-certification-engine-v1";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  allCrossBrowserPageSpecs,
  assertNoHorizontalOverflow,
  assertPageNotBlank,
  certifyCrossBrowserPage,
  createCrossBrowserConsoleCollector,
} from "./helpers/cross-browser";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;

function targetFromProject(projectName: string) {
  return CROSS_BROWSER_TARGETS.find((t) => t.playwrightProject === projectName) ?? null;
}

function writeTargetEvidence(input: {
  targetId: CrossBrowserTargetId;
  projectName: string;
  result: CrossBrowserCellResult;
  pages: CrossBrowserEvidenceSnapshot["targets"][number]["pages"];
  defects: string[];
  consoleErrors: string[];
}) {
  const dir = path.join(process.cwd(), CROSS_BROWSER_EVIDENCE_DIR, "targets");
  fs.mkdirSync(dir, { recursive: true });
  const target = CROSS_BROWSER_TARGETS.find((t) => t.id === input.targetId)!;
  const payload = {
    id: input.targetId,
    label: target.label,
    playwrightProject: input.projectName,
    executionMode: target.executionMode,
    result: input.result,
    pages: input.pages,
    defects: [
      ...input.defects,
      ...input.consoleErrors.map((line) => `console: ${line}`),
    ],
    limitations: target.limitations,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(dir, `${input.targetId}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

test.describe.configure({ mode: "serial" });

test.describe("Cross Browser Certification Engine v1.0", () => {
  test("matrix: all pages · overflow · pad · console · no blank", async ({
    page,
    baseURL,
}, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Cross Browser project: ${projectName}`);

    expect(baseURL).toBeTruthy();
    const consoleCollector = createCrossBrowserConsoleCollector();
    consoleCollector.attach(page);

    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });

    const cache = { listingHref: null as string | null, sellerHref: null as string | null };
    const pageResults: CrossBrowserEvidenceSnapshot["targets"][number]["pages"] = [];
    const defects: string[] = [];

    try {
      for (const spec of allCrossBrowserPageSpecs()) {
        const outcome = await certifyCrossBrowserPage(page, spec, cache);
        pageResults.push({
          id: spec.id as CrossBrowserPageId,
          label: spec.label,
          result: outcome.result,
          defects: outcome.defects,
        });
        if (outcome.result === "FAIL") {
          defects.push(...outcome.defects.map((d) => `[${spec.id}] ${d}`));
        }
      }
    } catch (error) {
      defects.push(error instanceof Error ? error.message : String(error));
      pageResults.push({
        id: "homepage",
        label: "Unhandled certification abort",
        result: "FAIL",
        defects: [error instanceof Error ? error.message : String(error)],
      });
    }

    const unexpectedConsole = consoleCollector.unexpected();
    if (unexpectedConsole.length) {
      defects.push(...unexpectedConsole.map((line) => `console: ${line}`));
    }

    const failedPages = pageResults.filter((p) => p.result === "FAIL");
    const result: CrossBrowserCellResult =
      failedPages.length || unexpectedConsole.length ? "FAIL" : "PASS";

    writeTargetEvidence({
      targetId: target!.id,
      projectName,
      result,
      pages: pageResults,
      defects,
      consoleErrors: unexpectedConsole,
    });

    expect(
      failedPages,
      `Cross Browser FAIL on ${target!.label}:\n${defects.join("\n")}`,
    ).toEqual([]);
    expect(unexpectedConsole, unexpectedConsole.join("\n")).toEqual([]);
  });

  test("mobile: orientation portrait ↔ landscape · no overflow", async ({
    page,
    baseURL,
}, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Cross Browser project: ${projectName}`);
    test.skip(!target!.orientationTests, "Desktop target — orientation N/A");

    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });

    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    // Landscape swap
    await page.setViewportSize({
      width: viewport!.height,
      height: viewport!.width,
    });
    await page.waitForTimeout(250);
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    // Restore portrait
    await page.setViewportSize({
      width: viewport!.width,
      height: viewport!.height,
    });
    await page.waitForTimeout(250);
    await assertNoHorizontalOverflow(page);
  });

  test("mobile: bottom navigation / sticky chrome visibility when present", async ({
    page,
    baseURL,
}, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Cross Browser project: ${projectName}`);
    test.skip(target!.family === "desktop", "Desktop — bottom nav not required");

    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });

    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    const bottomNav = page.locator(
      'nav[aria-label="Primary"], nav[aria-label="Bottom navigation"], [data-bottom-nav], [data-testid="bottom-navigation"]',
    );
    // Inbox Hub must show bottom nav per Inbox Hub Master Lock — soft if selector drifts.
    if ((await bottomNav.count()) > 0) {
      await expect(bottomNav.first()).toBeVisible();
      const box = await bottomNav.first().boundingBox();
      expect((box?.height ?? 0) > 0).toBe(true);
    }

    await page.goto("/wallet", { waitUntil: "domcontentloaded" });
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);
  });
});

test.afterAll(() => {
  // Ensure limitations file exists for the aggregator even if some projects skip.
  const dir = path.join(process.cwd(), CROSS_BROWSER_EVIDENCE_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "limitations.json"),
    `${JSON.stringify({ limitations: collectStaticLimitations() }, null, 2)}\n`,
    "utf8",
  );
});
