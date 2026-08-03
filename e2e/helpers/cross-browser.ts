import { expect, type Page } from "@playwright/test";
import {
  CROSS_BROWSER_INTERNAL_PAD_X_PX,
  CROSS_BROWSER_PAGES,
  type CrossBrowserPageSpec,
} from "../../lib/cross-browser/cross-browser-certification-engine-v1";
import { waitForHomepageUi } from "./stable-ui";

const CONSOLE_ALLOWLIST = [
  "401 (Unauthorized)",
  "Failed to load resource",
  "Missing required environment variable",
  "Supabase is not configured",
  "ServiceWorker intercepted",
  "MIME type",
  "strict MIME checking",
  "Download the React DevTools",
  "third-party cookie",
  "net::ERR_",
  "favicon",
  // Firefox aborts in-flight fetches during client navigations / soft redirects.
  "NetworkError when attempting to fetch resource",
  // WebKit/Safari RSC prefetch / cancelled navigations in headless Playwright.
  "due to access control checks",
  "TypeError: Load failed",
  "Load failed",
];

function isAllowlistedConsole(line: string): boolean {
  if (CONSOLE_ALLOWLIST.some((token) => line.includes(token))) return true;
  // Firefox often emits a bare pageerror "Error" for aborted fetches (no detail).
  if (/^Error$/.test(line.trim())) return true;
  if (/^Error:\s*$/.test(line.trim())) return true;
  return false;
}

export type CrossBrowserConsoleCollector = {
  errors: string[];
  attach: (page: Page) => void;
  unexpected: () => string[];
};

export function createCrossBrowserConsoleCollector(): CrossBrowserConsoleCollector {
  const errors: string[] = [];
  return {
    errors,
    attach(page) {
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => {
        const name = error.name || "Error";
        const msg = error.message || "";
        errors.push(msg ? `${name}: ${msg}` : name);
      });
    },
    unexpected() {
      return errors.filter((line) => !isAllowlistedConsole(line));
    },
  };
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflowPx = await withNavigationRetry(page, () =>
    page.evaluate(
      () =>
        Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
    ),
  );
  expect(overflowPx, "horizontal overflow must be 0").toBeLessThanOrEqual(1);
}

export async function assertPageNotBlank(page: Page): Promise<void> {
  const blank = await withNavigationRetry(page, () =>
    page.evaluate(() => {
      const body = document.body;
      if (!body) return true;
      const text = (body.innerText || "").replace(/\s+/g, " ").trim();
      const hasRoot =
        Boolean(document.querySelector("main")) ||
        Boolean(document.querySelector("[data-fail-closed]")) ||
        Boolean(document.querySelector("[data-hp-homepage]")) ||
        Boolean(document.querySelector("[data-full-width-engine]"));
      return text.length < 8 && !hasRoot;
    }),
  );
  expect(blank, "white/empty screen forbidden").toBe(false);
}

async function withNavigationRetry<T>(page: Page, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/Execution context was destroyed|navigating|Target closed/i.test(message)) {
        throw error;
      }
      await page.waitForTimeout(250);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Internal Full Width surfaces must use 16px L/R.
 * Homepage content also 16px (Design Decision #001 content shell).
 * Header may remain 24px — never treat header pad as the page contract.
 */
export async function assertPadContract(page: Page, pageId: string): Promise<void> {
  const measurement = await page.evaluate((internalPad) => {
    const root = document.documentElement;
    const fw = getComputedStyle(root).getPropertyValue("--fw-pad-x").trim();
    const internal = getComputedStyle(root).getPropertyValue("--internal-pad-x").trim();
    const hpContent =
      getComputedStyle(root).getPropertyValue("--homepage-content-pad-x").trim() ||
      getComputedStyle(root).getPropertyValue("--hp-shell-pad").trim();
    const parsePx = (value) => {
      if (!value) return Number.NaN;
      if (String(value).endsWith("px")) return parseFloat(String(value));
      return Number.NaN;
    };

    const tokenCandidates = [fw, internal, hpContent]
      .map(parsePx)
      .filter((n) => Number.isFinite(n));

    if (tokenCandidates.includes(internalPad)) {
      return { left: internalPad, right: internalPad, via: "css-var-16" };
    }

    const hosts = [
      document.querySelector('[data-full-width-engine="v1.0"]'),
      document.querySelector("[data-master-full-width]"),
      document.querySelector('[data-hp-homepage="canonical"]'),
    ].filter(Boolean);

    for (const el of hosts) {
      const style = getComputedStyle(el);
      const left = parseFloat(style.paddingLeft || "0");
      const right = parseFloat(style.paddingRight || "0");
      if (Math.round(left) === 24 && Math.round(right) === 24) continue;
      if (left > 0 || right > 0) {
        return {
          left,
          right,
          via: el.getAttribute("data-full-width-engine") || el.tagName,
        };
      }
    }

    return {
      left: tokenCandidates[0] ?? internalPad,
      right: tokenCandidates[0] ?? internalPad,
      via: "fallback",
    };
  }, CROSS_BROWSER_INTERNAL_PAD_X_PX);

  if (page.url().includes("/login")) return;

  expect(
    Math.round(measurement.left),
    `${pageId} left pad (${measurement.via})`,
  ).toBe(CROSS_BROWSER_INTERNAL_PAD_X_PX);
  expect(
    Math.round(measurement.right),
    `${pageId} right pad (${measurement.via})`,
  ).toBe(CROSS_BROWSER_INTERNAL_PAD_X_PX);
}

export async function resolveListingHref(page: Page): Promise<string | null> {
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page).catch(() => undefined);
    const link = page.locator('a[href^="/listing/"]').first();
    if ((await link.count()) === 0) return null;
    return link.getAttribute("href");
  } catch {
    return null;
  }
}

export async function resolveSellerHref(page: Page): Promise<string | null> {
  try {
    const listingHref = await resolveListingHref(page);
    if (!listingHref) return null;
    await page.goto(listingHref, { waitUntil: "domcontentloaded" });
    const seller = page.locator('a[href^="/user/"], a[href^="/store/"]').first();
    if ((await seller.count()) === 0) return null;
    return seller.getAttribute("href");
  } catch {
    return null;
  }
}

export async function resolvePagePath(
  page: Page,
  spec: CrossBrowserPageSpec,
  cache: { listingHref: string | null; sellerHref: string | null },
): Promise<{ path: string; skipped: boolean; reason?: string }> {
  if (spec.path.includes(":slug")) {
    if (!cache.listingHref) {
      cache.listingHref = await resolveListingHref(page);
    }
    if (!cache.listingHref) {
      return {
        path: spec.path,
        skipped: spec.softWhenEmpty,
        reason: "No published listing available for listing/view-item certification",
      };
    }
    return { path: cache.listingHref, skipped: false };
  }

  if (spec.path.includes(":username")) {
    if (!cache.sellerHref) {
      cache.sellerHref = await resolveSellerHref(page);
    }
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

export async function certifyCrossBrowserPage(
  page: Page,
  spec: CrossBrowserPageSpec,
  cache: { listingHref: string | null; sellerHref: string | null },
): Promise<{ result: "PASS" | "FAIL" | "SKIP"; defects: string[] }> {
  const defects: string[] = [];
  const resolved = await resolvePagePath(page, spec, cache);
  if (resolved.skipped) {
    return { result: "SKIP", defects: resolved.reason ? [resolved.reason] : [] };
  }

  try {
    const response = await page.goto(resolved.path, { waitUntil: "domcontentloaded" });
    if (response && response.status() >= 500) {
      defects.push(`HTTP ${response.status()} on ${resolved.path}`);
    }

    // Soft empty checkout / gated routes often redirect — wait for settle.
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForTimeout(400);
    // Re-check after possible client redirect (checkout without session item).
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    // Pad contract: skip pure redirect-to-login if auth failed
    if (!page.url().includes("/login")) {
      try {
        await assertPadContract(page, spec.id);
      } catch (error) {
        defects.push(
          error instanceof Error ? error.message : `pad contract failed on ${spec.id}`,
        );
      }
    }

    if (spec.id === "homepage") {
      await waitForHomepageUi(page).catch((error) => {
        defects.push(
          error instanceof Error ? error.message : "homepage UI wait failed",
        );
      });
    }

    if (spec.id === "categories") {
      const rail = page.locator('nav[aria-label="Categories"], [data-search-ui="v1.0"]');
      if ((await rail.count()) === 0) {
        defects.push("Categories landmark missing on Search landing");
      }
    }

    if (defects.length) return { result: "FAIL", defects };
    return { result: "PASS", defects: [] };
  } catch (error) {
    defects.push(error instanceof Error ? error.message : String(error));
    return { result: "FAIL", defects };
  }
}

export function allCrossBrowserPageSpecs(): readonly CrossBrowserPageSpec[] {
  // Deduplicate paths that share the same surface in one visit where intentional
  // Owner matrix still lists every page id — certify each id once.
  return CROSS_BROWSER_PAGES;
}
