/**
 * ROVEXO Mobile Device Certification Engine v1.0 — runtime matrix.
 *
 * Runs once per `mdc-*` / shared `xcb-*` mobile·tablet Playwright project.
 * Evidence: test-results/mobile-device-certification-v1/
 *
 * NO commit · NO push · NO Preview · NO Production.
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import {
  MOBILE_DEVICE_EVIDENCE_DIR,
  MOBILE_DEVICE_TARGETS,
  type MobileDeviceCellResult,
  type MobileDeviceEvidenceSnapshot,
} from "../lib/mobile/mobile-device-certification-v1";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  assertNoHorizontalOverflow,
  assertPageNotBlank,
  createCrossBrowserConsoleCollector,
} from "./helpers/cross-browser";
import {
  allMobileDevicePageSpecs,
  certifyMobileDevicePage,
} from "./helpers/mobile-device";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;

function targetFromProject(projectName: string) {
  return MOBILE_DEVICE_TARGETS.find((t) => t.playwrightProject === projectName) ?? null;
}

function writeTargetEvidence(input: {
  targetId: string;
  projectName: string;
  result: MobileDeviceCellResult;
  pages: MobileDeviceEvidenceSnapshot["targets"][number]["pages"];
  defects: string[];
  consoleErrors: string[];
}) {
  const dir = path.join(process.cwd(), MOBILE_DEVICE_EVIDENCE_DIR, "targets");
  fs.mkdirSync(dir, { recursive: true });
  const target = MOBILE_DEVICE_TARGETS.find((t) => t.id === input.targetId)!;
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

test.describe("Mobile Device Certification Engine v1.0", () => {
  test("matrix: pages · pad 16 · overflow · touch · sticky · console", async ({
    page,
    baseURL,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Mobile Device project: ${projectName}`);

    expect(baseURL).toBeTruthy();
    const consoleCollector = createCrossBrowserConsoleCollector();
    consoleCollector.attach(page);

    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });

    const cache = { listingHref: null as string | null, sellerHref: null as string | null };
    const pageResults: MobileDeviceEvidenceSnapshot["targets"][number]["pages"] = [];
    const defects: string[] = [];

    try {
      for (const spec of allMobileDevicePageSpecs()) {
        const outcome = await certifyMobileDevicePage(page, spec, cache);
        pageResults.push({
          id: spec.id,
          label: spec.label,
          result: outcome.result,
          defects: outcome.defects,
        });
        if (outcome.result === "FAIL") {
          defects.push(...outcome.defects.map((d) => `[${spec.id}] ${d}`));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      defects.push(message);
      pageResults.push({
        id: "homepage",
        label: "Unhandled mobile certification abort",
        result: "FAIL",
        defects: [message],
      });
    }

    const unexpectedConsole = consoleCollector.unexpected();
    if (unexpectedConsole.length) {
      defects.push(...unexpectedConsole.map((line) => `console: ${line}`));
    }

    const failedPages = pageResults.filter((p) => p.result === "FAIL");
    const result: MobileDeviceCellResult =
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
      `Mobile Device FAIL on ${target!.label}:\n${defects.join("\n")}`,
    ).toEqual([]);
    expect(unexpectedConsole, unexpectedConsole.join("\n")).toEqual([]);
  });

  test("orientation: portrait ↔ landscape · no overflow", async ({ page, baseURL }, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Mobile Device project: ${projectName}`);
    test.skip(!target!.orientationTests, "Orientation N/A");

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

    await page.setViewportSize({
      width: viewport!.height,
      height: viewport!.width,
    });
    await page.waitForTimeout(250);
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({
      width: viewport!.width,
      height: viewport!.height,
    });
    await page.waitForTimeout(250);
    await assertNoHorizontalOverflow(page);
  });

  test("safe chrome: bottom nav / sticky when present", async ({ page, baseURL }, testInfo) => {
    const projectName = testInfo.project.name;
    const target = targetFromProject(projectName);
    test.skip(!target, `Not a Mobile Device project: ${projectName}`);

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
    if ((await bottomNav.count()) > 0) {
      await expect(bottomNav.first()).toBeVisible();
      const box = await bottomNav.first().boundingBox();
      expect((box?.height ?? 0) > 0).toBe(true);
    }

    await page.goto("/sell", { waitUntil: "domcontentloaded" });
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    await page.goto("/account/settings", { waitUntil: "domcontentloaded" });
    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);
  });
});
