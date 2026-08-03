/**
 * ROVEXO Accessibility Certification Engine v1.0 — runtime evidence.
 *
 * WCAG 2.2 AA · axe-core · keyboard · focus · reduced-motion · touch · names
 * NO disableRules · NO skip pages · NO fake PASS
 * NO commit · NO push · NO Preview · NO Production.
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import {
  ACCESSIBILITY_EVIDENCE_DIR,
  ACCESSIBILITY_PAGES,
  type AccessibilityCellResult,
  type AccessibilityEvidenceSnapshot,
  type AccessibilityPageEvidence,
} from "../lib/accessibility/accessibility-certification-engine-v1";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  certifyAccessibilityPage,
  certifyFocusVisible,
  certifyKeyboardBasics,
  certifyReducedMotion,
  formatAxeViolations,
} from "./helpers/accessibility-certification";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;

function writeEvidence(snapshot: AccessibilityEvidenceSnapshot) {
  const dir = path.join(process.cwd(), ACCESSIBILITY_EVIDENCE_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "matrix.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(path.join(dir, "MATRIX.md"), renderMarkdown(snapshot), "utf8");
}

function renderMarkdown(snapshot: AccessibilityEvidenceSnapshot): string {
  const lines = [
    `# ROVEXO Accessibility Certification Matrix v1.0`,
    ``,
    `**Overall:** ${snapshot.overall}`,
    `**WCAG:** ${snapshot.wcagTarget}`,
    `**Origin:** ${snapshot.origin}`,
    `**Generated:** ${snapshot.generatedAt}`,
    `**Keyboard:** ${snapshot.keyboard}`,
    `**Focus:** ${snapshot.focus}`,
    `**Reduced motion:** ${snapshot.reducedMotion}`,
    ``,
    `## Pages`,
    ``,
    `| Page | Result | Axe | Defects |`,
    `| --- | --- | --- | --- |`,
  ];
  for (const page of snapshot.pages) {
    const axe = page.axeViolationIds.length ? page.axeViolationIds.join(", ") : "—";
    const defects = page.defects.length ? page.defects.slice(0, 2).join("; ") : "—";
    lines.push(`| ${page.label} | **${page.result}** | ${axe} | ${defects} |`);
  }
  lines.push(``, `## Defects`, ``);
  if (!snapshot.defects.length) lines.push(`- None`);
  else for (const d of snapshot.defects) lines.push(`- ${d}`);
  lines.push(
    ``,
    `## Gate`,
    ``,
    `Accessibility Certification is mandatory before Preview Release.`,
    `NO disableRules · NO skip pages · NO fake PASS.`,
    `NO commit · NO push · NO deploy from this report alone.`,
    ``,
  );
  return lines.join("\n");
}

function pushPageOutcome(
  pages: AccessibilityPageEvidence[],
  defects: string[],
  spec: (typeof ACCESSIBILITY_PAGES)[number],
  outcome: Awaited<ReturnType<typeof certifyAccessibilityPage>>,
) {
  pages.push({
    id: spec.id,
    label: spec.label,
    result: outcome.result,
    defects: outcome.defects,
    axeViolationIds: outcome.axeViolationIds,
  });
  if (outcome.result === "FAIL") {
    defects.push(
      ...outcome.defects.map((d) => `[${spec.id}] ${d}`),
      ...(outcome.axeViolationIds.length
        ? [
            `[${spec.id}] axe: ${formatAxeViolations(
              outcome.axeViolationIds.map((id) => ({
                id,
                impact: "?",
                description: id,
                targets: [],
              })),
            )}`,
          ]
        : []),
    );
  }
}

test.describe.configure({ mode: "serial" });

test.describe("Accessibility Certification Engine v1.0", () => {
  test("platform matrix: axe WCAG 2.2 AA · names · touch", async ({
    page,
    baseURL,
    browser,
  }) => {
    test.setTimeout(2_400_000);
    expect(baseURL).toBeTruthy();

    let activePage = page;
    await signInWithSessionCookies(activePage, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });

    await activePage.setViewportSize({ width: 390, height: 844 });

    const cache = { listingHref: null as string | null, sellerHref: null as string | null };
    const pages: AccessibilityPageEvidence[] = [];
    const defects: string[] = [];

    const authenticated = ACCESSIBILITY_PAGES.filter(
      (spec) => spec.id !== "login" && spec.id !== "register",
    );
    const guests = ACCESSIBILITY_PAGES.filter(
      (spec) => spec.id === "login" || spec.id === "register",
    );

    let scanned = 0;
    for (const spec of authenticated) {
      // Fresh page per scan — full-page axe leaves navigations unstable on reused tabs.
      const next = await activePage.context().newPage();
      await next.setViewportSize({ width: 390, height: 844 });
      if (scanned > 0) {
        await activePage.close().catch(() => undefined);
      }
      activePage = next;

      const outcome = await certifyAccessibilityPage(activePage, spec, cache);
      pushPageOutcome(pages, defects, spec, outcome);
      scanned += 1;
      writeEvidence({
        version: "v1.0",
        origin: baseURL!,
        generatedAt: new Date().toISOString(),
        overall: pages.some((p) => p.result === "FAIL") ? "FAIL" : "UNVERIFIED",
        wcagTarget: "WCAG 2.2 AA",
        pages: [...pages],
        keyboard: "UNVERIFIED",
        focus: "UNVERIFIED",
        reducedMotion: "UNVERIFIED",
        defects: [...defects],
      });
    }

    // Guest Login / Register — fresh context (no session cookies).
    const guestContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const guestPage = await guestContext.newPage();
    try {
      for (const spec of guests) {
        const outcome = await certifyAccessibilityPage(guestPage, spec, cache);
        pushPageOutcome(pages, defects, spec, outcome);
      }
    } finally {
      await guestContext.close();
    }

    const failed = pages.filter((p) => p.result === "FAIL");
    const overall: AccessibilityCellResult = failed.length ? "FAIL" : "PASS";

    writeEvidence({
      version: "v1.0",
      origin: baseURL!,
      generatedAt: new Date().toISOString(),
      overall,
      wcagTarget: "WCAG 2.2 AA",
      pages,
      keyboard: "UNVERIFIED",
      focus: "UNVERIFIED",
      reducedMotion: "UNVERIFIED",
      defects,
    });

    expect(failed, `Accessibility FAIL:\n${defects.join("\n")}`).toEqual([]);
  });

  test("keyboard navigation basics", async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    const defects = await certifyKeyboardBasics(page, baseURL!);
    mergeAxis("keyboard", defects.length ? "FAIL" : "PASS", defects);
    expect(defects, defects.join("\n")).toEqual([]);
  });

  test("focus visible on login email", async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    const defects = await certifyFocusVisible(page, baseURL!);
    mergeAxis("focus", defects.length ? "FAIL" : "PASS", defects);
    expect(defects, defects.join("\n")).toEqual([]);
  });

  test("prefers-reduced-motion respected", async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: baseURL!,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const defects = await certifyReducedMotion(page, baseURL!);
    mergeAxis("reducedMotion", defects.length ? "FAIL" : "PASS", defects);
    expect(defects, defects.join("\n")).toEqual([]);
  });
});

function mergeAxis(
  axis: "keyboard" | "focus" | "reducedMotion",
  result: AccessibilityCellResult,
  extraDefects: string[],
) {
  const file = path.join(process.cwd(), ACCESSIBILITY_EVIDENCE_DIR, "matrix.json");
  if (!fs.existsSync(file)) return;
  const snapshot = JSON.parse(fs.readFileSync(file, "utf8")) as AccessibilityEvidenceSnapshot;
  snapshot[axis] = result;
  if (extraDefects.length) {
    snapshot.defects.push(...extraDefects.map((d) => `${axis}: ${d}`));
  }
  if (
    snapshot.pages.some((p) => p.result === "FAIL") ||
    snapshot.keyboard === "FAIL" ||
    snapshot.focus === "FAIL" ||
    snapshot.reducedMotion === "FAIL"
  ) {
    snapshot.overall = "FAIL";
  } else if (
    snapshot.keyboard === "PASS" &&
    snapshot.focus === "PASS" &&
    snapshot.reducedMotion === "PASS" &&
    snapshot.pages.every((p) => p.result === "PASS" || p.result === "SKIP")
  ) {
    snapshot.overall = "PASS";
  }
  snapshot.generatedAt = new Date().toISOString();
  writeEvidence(snapshot);
}
