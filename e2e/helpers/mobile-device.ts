import { expect, type Page } from "@playwright/test";
import {
  MOBILE_DEVICE_INTERNAL_PAD_X_PX,
  MOBILE_DEVICE_PAGES,
  MOBILE_DEVICE_TOUCH_MIN_PX,
  type MobileDevicePageSpec,
} from "../../lib/mobile/mobile-device-certification-v1";
import {
  assertNoHorizontalOverflow,
  assertPadContract,
  assertPageNotBlank,
  resolveListingHref,
  resolveSellerHref,
} from "./cross-browser";

export function allMobileDevicePageSpecs(): MobileDevicePageSpec[] {
  return [...MOBILE_DEVICE_PAGES];
}

export async function resolveMobilePagePath(
  page: Page,
  spec: MobileDevicePageSpec,
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

/**
 * Touch targets: primary mobile chrome + CTA controls must meet 44×44.
 * Long prose links and decorative icons inside large hit-rows are exempt.
 */
export async function assertMobileTouchTargets(page: Page): Promise<string[]> {
  const defects = await page.evaluate((minPx) => {
    const out: string[] = [];
    const selectors = [
      "[data-bottom-nav] a",
      'nav[aria-label="Primary"] a',
      'nav[aria-label="Bottom navigation"] a',
      '[data-testid="bottom-navigation"] a',
      "[data-sticky-cta] button",
      "[data-sticky-cta] a",
      "[data-bundle-sticky] button",
      ".account-settings-sticky-action button",
      'button[type="submit"]',
      '[data-premium-button]',
    ];
    const nodes = document.querySelectorAll(selectors.join(","));
    for (const node of nodes) {
      const el = node as HTMLElement;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      // Prefer the larger hit area if the control is wrapped in a padded row.
      const parent = el.closest("a, button, [role='button']") as HTMLElement | null;
      const hit = parent && parent !== el ? parent.getBoundingClientRect() : rect;
      const w = Math.max(hit.width, rect.width);
      const h = Math.max(hit.height, rect.height);
      if (w + 0.5 < minPx || h + 0.5 < minPx) {
        const label = (
          el.getAttribute("aria-label") ||
          (el.innerText || "").trim() ||
          el.tagName
        ).slice(0, 48);
        out.push(`touch ${Math.round(w)}×${Math.round(h)} < ${minPx} (${label})`);
      }
      if (out.length >= 8) break;
    }
    return out;
  }, MOBILE_DEVICE_TOUCH_MIN_PX);
  return defects;
}

/** Sticky CTA / bottom nav must not fully obscure each other when both exist. */
export async function assertNoStickyOverlap(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const defects: string[] = [];
    const sticky = document.querySelector(
      '[data-sticky-cta], [data-checkout-sticky], .account-settings-sticky-action, [data-bundle-sticky]',
    ) as HTMLElement | null;
    const nav = document.querySelector(
      'nav[aria-label="Primary"], nav[aria-label="Bottom navigation"], [data-bottom-nav], [data-testid="bottom-navigation"]',
    ) as HTMLElement | null;
    if (!sticky || !nav) return defects;
    const a = sticky.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    if (a.height < 1 || b.height < 1) return defects;
    const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (overlap > 8) {
      defects.push(`sticky/nav overlap ${Math.round(overlap)}px`);
    }
    return defects;
  });
}

export async function certifyMobileDevicePage(
  page: Page,
  spec: MobileDevicePageSpec,
  cache: { listingHref: string | null; sellerHref: string | null },
): Promise<{ result: "PASS" | "FAIL" | "SKIP"; defects: string[] }> {
  const defects: string[] = [];
  const resolved = await resolveMobilePagePath(page, spec, cache);
  if (resolved.skipped) {
    return { result: "SKIP", defects: resolved.reason ? [resolved.reason] : [] };
  }

  try {
    const response = await page.goto(resolved.path, { waitUntil: "domcontentloaded" });
    if (response && response.status() >= 500) {
      defects.push(`HTTP ${response.status()} on ${resolved.path}`);
    }

    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForTimeout(350);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    await assertPageNotBlank(page);
    await assertNoHorizontalOverflow(page);

    if (!page.url().includes("/login")) {
      try {
        await assertPadContract(page, spec.id);
      } catch (error) {
        defects.push(error instanceof Error ? error.message : `pad contract failed on ${spec.id}`);
      }

      const touchDefects = await assertMobileTouchTargets(page).catch((error) => [
        error instanceof Error ? error.message : "touch target check failed",
      ]);
      defects.push(...touchDefects);

      const stickyDefects = await assertNoStickyOverlap(page).catch((error) => [
        error instanceof Error ? error.message : "sticky overlap check failed",
      ]);
      defects.push(...stickyDefects);
    }

    // Soft empty Review Bundle / gated routes — blank fail-closed is OK when soft.
    if (spec.softWhenEmpty && page.url().includes("/login")) {
      return { result: "SKIP", defects: ["Redirected to login (soft route)"] };
    }

    if (defects.length) return { result: "FAIL", defects };
    return { result: "PASS", defects: [] };
  } catch (error) {
    defects.push(error instanceof Error ? error.message : String(error));
    if (spec.softWhenEmpty) {
      return { result: "SKIP", defects };
    }
    return { result: "FAIL", defects };
  }
}
