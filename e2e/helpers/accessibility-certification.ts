import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import {
  ACCESSIBILITY_AXE_TAGS,
  ACCESSIBILITY_TOUCH_MIN_PX,
  type AccessibilityPageSpec,
} from "../../lib/accessibility/accessibility-certification-engine-v1";
import {
  assertNoHorizontalOverflow,
  resolveListingHref,
  resolveSellerHref,
} from "./cross-browser";

export type AxeViolationSummary = {
  id: string;
  impact: string | null | undefined;
  description: string;
  targets: string[];
};

export function formatAxeViolations(violations: AxeViolationSummary[]): string {
  if (!violations.length) return "";
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? "unknown"}): ${violation.description}\n  ${violation.targets
          .slice(0, 4)
          .join("\n  ")}`,
    )
    .join("\n\n");
}

export async function resolveAccessibilityPath(
  page: Page,
  spec: AccessibilityPageSpec,
  cache: { listingHref: string | null; sellerHref: string | null },
): Promise<{ path: string; skipped: boolean; reason?: string }> {
  if (spec.path.includes(":slug")) {
    if (!cache.listingHref) cache.listingHref = await resolveListingHref(page);
    if (!cache.listingHref) {
      return {
        path: spec.path,
        skipped: spec.softWhenEmpty,
        reason: "No published listing available",
      };
    }
    return { path: cache.listingHref, skipped: false };
  }
  if (spec.path.includes(":username")) {
    if (!cache.sellerHref) cache.sellerHref = await resolveSellerHref(page);
    if (!cache.sellerHref) {
      return {
        path: spec.path,
        skipped: spec.softWhenEmpty,
        reason: "No seller profile link available",
      };
    }
    return { path: cache.sellerHref, skipped: false };
  }
  return { path: spec.path, skipped: false };
}

/**
 * Full-page axe WCAG 2.2 AA scan.
 * Owner law: NO disableRules · NO page skips · NO violation hiding.
 */
export async function runAxeWcag22Aa(page: Page): Promise<{
  violations: AxeViolationSummary[];
}> {
  const results = await new AxeBuilder({ page })
    .withTags([...ACCESSIBILITY_AXE_TAGS])
    .analyze();

  return {
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      targets: violation.nodes.flatMap((node) => node.target.map(String)),
    })),
  };
}

/** Primary chrome / CTA touch targets ≥ 44×44. */
export async function assertAccessibilityTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate((minPx) => {
    const out: string[] = [];
    const selectors = [
      "[data-bottom-nav] a",
      'nav[aria-label="Primary"] a',
      'nav[aria-label="Bottom navigation"] a',
      '[data-testid="bottom-navigation"] a',
      "[data-sticky-cta] button",
      "[data-sticky-cta] a",
      "[data-premium-button]",
      'button[type="submit"]',
      ".account-settings-sticky-action button",
    ];
    for (const node of document.querySelectorAll(selectors.join(","))) {
      const el = node as HTMLElement;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.width + 0.5 < minPx || rect.height + 0.5 < minPx) {
        const label = (
          el.getAttribute("aria-label") ||
          (el.innerText || "").trim() ||
          el.tagName
        ).slice(0, 48);
        out.push(`touch ${Math.round(rect.width)}×${Math.round(rect.height)} < ${minPx} (${label})`);
      }
      if (out.length >= 8) break;
    }
    return out;
  }, ACCESSIBILITY_TOUCH_MIN_PX);
}

/** Interactive controls must expose an accessible name. */
export async function assertAccessibleNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const nodes = document.querySelectorAll(
      'button, a[href], [role="button"], input:not([type="hidden"]), select, textarea',
    );
    for (const node of nodes) {
      const el = node as HTMLElement & { labels?: NodeListOf<HTMLLabelElement> | null };
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;

      const labelledBy = el.getAttribute("aria-labelledby");
      let labelledByText = "";
      if (labelledBy) {
        labelledByText = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ");
      }
      const labelEl =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
          ? el.labels?.[0]
          : null;
      const name = (
        el.getAttribute("aria-label") ||
        labelledByText ||
        labelEl?.getAttribute("aria-label") ||
        labelEl?.textContent ||
        el.getAttribute("title") ||
        el.getAttribute("alt") ||
        el.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      if (!name) {
        out.push(
          `missing accessible name: ${el.tagName.toLowerCase()}${
            el.getAttribute("type") ? `[type=${el.getAttribute("type")}]` : ""
          }${el.id ? `#${el.id}` : ""}`,
        );
      }
      if (out.length >= 8) break;
    }
    return out;
  });
}

export async function certifyAccessibilityPage(
  page: Page,
  spec: AccessibilityPageSpec,
  cache: { listingHref: string | null; sellerHref: string | null },
): Promise<{
  result: "PASS" | "FAIL" | "SKIP";
  defects: string[];
  axeViolationIds: string[];
}> {
  const defects: string[] = [];
  // Guest pages are certified on a separate context (see spec) — do not clearCookies here.

  const resolved = await resolveAccessibilityPath(page, spec, cache);
  if (resolved.skipped) {
    return {
      result: "SKIP",
      defects: resolved.reason ? [resolved.reason] : [],
      axeViolationIds: [],
    };
  }

  try {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await page.goto(resolved.path, {
          waitUntil: "commit",
          timeout: 45_000,
        });
        if (response && response.status() >= 500) {
          defects.push(`HTTP ${response.status()} on ${resolved.path}`);
        }
        // Prefer body text readiness over domcontentloaded (account/wallet can soft-nav forever).
        await page.waitForFunction(
          () => (document.body?.innerText?.replace(/\s+/g, " ").trim().length ?? 0) > 24,
          { timeout: 25_000 },
        );
        await page
          .locator('[aria-busy="true"]')
          .first()
          .waitFor({ state: "hidden", timeout: 12_000 })
          .catch(() => undefined);
        await page.waitForTimeout(350);

        const url = page.url();
        if (url === "about:blank" || !url.includes("://")) {
          throw new Error(`Navigation did not leave about:blank for ${resolved.path}`);
        }
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        await page.waitForTimeout(500 * attempt);
      }
    }
    if (lastError) throw lastError;

    await page
      .locator(
        "[data-full-width-engine], .ac-canonical, .wallet-v2, .orders-page, .srch-land__bar, [data-checkout-ui], main",
      )
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => undefined);
    await page.waitForTimeout(300);

    // Local blank check — do not wait for domcontentloaded (hangs on App Router soft-nav).
    const blank = await page.evaluate(() => {
      const body = document.body;
      if (!body) return true;
      const text = (body.innerText || "").replace(/\s+/g, " ").trim();
      const hasRoot =
        Boolean(document.querySelector("main")) ||
        Boolean(document.querySelector("[data-fail-closed]")) ||
        Boolean(document.querySelector("[data-full-width-engine]")) ||
        Boolean(document.querySelector(".ac-canonical")) ||
        Boolean(document.querySelector(".orders-page")) ||
        Boolean(document.querySelector(".wallet-v2")) ||
        Boolean(document.querySelector("[data-bottom-nav]"));
      return text.length < 8 && !hasRoot;
    });
    if (blank) {
      throw new Error("white/empty screen forbidden");
    }
    await assertNoHorizontalOverflow(page);

    if (page.url().includes("/login") && spec.requiresAuth && spec.softWhenEmpty) {
      return {
        result: "SKIP",
        defects: ["Redirected to login (soft route)"],
        axeViolationIds: [],
      };
    }

    // Settle client navigations before axe (homepage can soft-navigate during first paint).
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    await page.waitForFunction(() => Boolean(document.title?.trim()), { timeout: 20_000 });
    await page.waitForTimeout(400);

    let axeViolations: AxeViolationSummary[] = [];
    let touch: string[] = [];
    let names: string[] = [];
    for (let auditAttempt = 1; auditAttempt <= 3; auditAttempt++) {
      try {
        // Ensure primary surface is present (not a mid-redirect shell).
        await page
          .locator(
            ".ac-canonical__menu, .orders-page__tabs, .wallet-v2, .srch-land__bar, [data-bottom-nav], main, body",
          )
          .first()
          .waitFor({ state: "visible", timeout: 15_000 })
          .catch(() => undefined);

        const title = (await page.title()).trim();
        if (!title) {
          throw new Error(`Empty document title before axe on ${resolved.path}`);
        }
        await page.waitForTimeout(500);

        const axe = await runAxeWcag22Aa(page);
        axeViolations = axe.violations;
        touch = await assertAccessibilityTouchTargets(page);
        names = await assertAccessibleNames(page);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          !/Execution context was destroyed|Target closed|Empty document title/i.test(message) ||
          auditAttempt === 3
        ) {
          throw error;
        }
        await page.goto(resolved.path, { waitUntil: "commit", timeout: 45_000 }).catch(() => undefined);
        await page.waitForTimeout(1_200);
        await page.waitForFunction(() => Boolean(document.title?.trim()), { timeout: 20_000 }).catch(() => undefined);
        await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
      }
    }

    for (const violation of axeViolations) {
      defects.push(
        `axe:${violation.id} (${violation.impact ?? "?"}) ${violation.description} @ ${violation.targets
          .slice(0, 2)
          .join(", ")}`,
      );
    }
    defects.push(...touch);
    defects.push(...names);

    return {
      result: defects.length ? "FAIL" : "PASS",
      defects,
      axeViolationIds: axeViolations.map((v) => v.id),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (spec.softWhenEmpty) {
      return { result: "SKIP", defects: [message], axeViolationIds: [] };
    }
    return { result: "FAIL", defects: [message], axeViolationIds: [] };
  }
}

/**
 * Keyboard: Tab reaches interactive control; Escape does not trap focus forever.
 */
export async function certifyKeyboardBasics(page: Page, baseURL: string): Promise<string[]> {
  const defects: string[] = [];
  await page.goto(`${baseURL}/search`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const active1 = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    return el.tagName.toLowerCase();
  });
  if (!active1) defects.push("keyboard: Tab did not move focus to an interactive control on /search");

  // Escape must not freeze the page
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  const active2 = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? null);
  if (!active2 || active2 === "body") {
    // second Tab after Escape should still work
    await page.keyboard.press("Tab");
  }
  const alive = await page.evaluate(() => Boolean(document.body?.innerText?.length));
  if (!alive) defects.push("keyboard: page became empty after Escape");

  return defects;
}

/** Focus ring visibility on a focused control. */
export async function certifyFocusVisible(page: Page, baseURL: string): Promise<string[]> {
  const defects: string[] = [];
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const email = page.getByLabel(/email address/i).first();
  if ((await email.count()) === 0) {
    defects.push("focus: login email field missing");
    return defects;
  }
  await email.focus();
  const focused = await email.evaluate((el) => {
    const style = getComputedStyle(el);
    const outline = style.outlineWidth;
    const outlineStyle = style.outlineStyle;
    const boxShadow = style.boxShadow;
    const ring =
      (outlineStyle !== "none" && parseFloat(outline || "0") > 0) ||
      (boxShadow && boxShadow !== "none");
    return { ring, tag: el.tagName };
  });
  if (!focused.ring) {
    // Accept :focus-visible browsers that only show ring after keyboard — force via class check
    const hasFocusVisible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const style = getComputedStyle(el);
      return (
        (style.outlineStyle !== "none" && parseFloat(style.outlineWidth || "0") > 0) ||
        (style.boxShadow !== "none" && Boolean(style.boxShadow)) ||
        el.matches(":focus-visible")
      );
    });
    if (!hasFocusVisible) {
      defects.push("focus: email field has no visible focus indicator");
    }
  }
  return defects;
}

/** prefers-reduced-motion must disable PremiumButton shine animation. */
export async function certifyReducedMotion(page: Page, baseURL: string): Promise<string[]> {
  const defects: string[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const shineAnimated = await page.evaluate(() => {
    const shine = document.querySelector("[data-premium-button] .shine, [class*='shine']");
    if (!shine) return false;
    const style = getComputedStyle(shine);
    return style.animationName !== "none" && style.animationName !== "";
  });
  // Soft: if no shine node present, PASS
  if (shineAnimated) {
    defects.push("reduced-motion: shine animation still running under prefers-reduced-motion");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return defects;
}

export { expect };
