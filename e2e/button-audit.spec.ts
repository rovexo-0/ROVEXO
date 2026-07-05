import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  ACCOUNT_QUICK_ACCESS,
  getAccountModuleTiles,
  getBuyerModuleTiles,
  getSellerModuleTiles,
} from "../lib/account-center/modules";
import { waitForHomepageUi } from "./helpers/stable-ui";

type ButtonProbe = {
  name: string;
  path: string;
  /** Role + name for interactive control on the page */
  control?: { role: "button" | "link"; name: RegExp | string };
  /** Guest users should land on login when path is protected */
  expectLogin?: boolean;
};

const PUBLIC_GUEST_PATHS = new Set([
  "/support",
  "/trust",
  "/resolution",
  "/plans",
  "/search",
  "/categories",
  "/auctions",
  "/help",
  "/legal",
]);

async function expectPublicPageReady(page: Page): Promise<void> {
  await expect(page.getByRole("heading").first()).toBeVisible();
}

function expectsGuestLogin(path: string): boolean {
  if (PUBLIC_GUEST_PATHS.has(path)) return false;
  if (path.startsWith("/search") || path.startsWith("/help")) return false;
  return (
    path.startsWith("/account") ||
    path.startsWith("/orders") ||
    path.startsWith("/messages") ||
    path.startsWith("/saved") ||
    path.startsWith("/notifications") ||
    path.startsWith("/cart") ||
    path.startsWith("/seller") ||
    path.startsWith("/sell") ||
    path.startsWith("/import") ||
    path.startsWith("/buyer") ||
    path.startsWith("/business") ||
    path === "/notifications/settings"
  );
}

const GUEST_HUB_PROBES: ButtonProbe[] = [
  ...ACCOUNT_QUICK_ACCESS.map((module) => ({
    name: `Account hub — ${module.title}`,
    path: module.href,
    expectLogin: true,
  })),
  ...getBuyerModuleTiles().map((tile) => ({
    name: `Buyer tile — ${tile.label}`,
    path: tile.href,
    expectLogin: expectsGuestLogin(tile.href),
  })),
  ...getSellerModuleTiles().map((tile) => ({
    name: `Seller tile — ${tile.label}`,
    path: tile.href,
    expectLogin: expectsGuestLogin(tile.href),
  })),
];

const PUBLIC_ACTION_PROBES: ButtonProbe[] = [
  { name: "Homepage — Import Listings CTA", path: "/", control: { role: "link", name: /import listings/i } },
  { name: "Login — Submit", path: "/login", control: { role: "button", name: /sign in|log in/i } },
  { name: "Register — Submit", path: "/register", control: { role: "button", name: /create account|register/i } },
  { name: "Forgot password — Submit", path: "/forgot-password", control: { role: "button", name: /reset|send/i } },
  { name: "Support — Submit request", path: "/support", control: { role: "button", name: /submit request/i } },
];

async function expectActionControlReady(
  page: Page,
  target: Locator,
  path: string,
): Promise<void> {
  if (path === "/register") {
    await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  }

  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();

  await expect
    .poll(async () => {
      const box = await target.boundingBox();
      return Boolean(box && box.width > 0 && box.height > 0);
    })
    .toBe(true);
}

test.describe("Button audit — public actions", () => {
  for (const probe of PUBLIC_ACTION_PROBES) {
    test(probe.name, async ({ page }) => {
      await page.goto(probe.path, { waitUntil: "domcontentloaded" });

      if (probe.path === "/") {
        await waitForHomepageUi(page);
      }

      const control = probe.control!;
      const target = page.getByTestId("auth-submit").or(
        page.getByRole(control.role, { name: control.name }),
      ).first();

      if (probe.path === "/support") {
        await expect(target).toBeVisible();
        await expect(target).toBeDisabled();
        return;
      }

      await expectActionControlReady(page, target, probe.path);
    });
  }
});

test("Button audit — categories index visible", async ({ page }) => {
  await page.goto("/categories", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /all categories/i })).toBeVisible();
});

test.describe("Button audit — module hub links (guest)", () => {
  for (const probe of GUEST_HUB_PROBES) {
    test(`${probe.name} → ${probe.path}`, async ({ page }) => {
      const response = await page.goto(probe.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).not.toBe(404);

      if (probe.expectLogin) {
        await expect(page).toHaveURL(/\/login/);
        return;
      }

      await expectPublicPageReady(page);
    });
  }
});

test.describe("Button audit — account module tiles (guest)", () => {
  for (const tile of getAccountModuleTiles()) {
    test(`Account tile — ${tile.label}`, async ({ page }) => {
      const response = await page.goto(tile.href, { waitUntil: "domcontentloaded" });
      expect(response?.status()).not.toBe(404);
      if (expectsGuestLogin(tile.href)) {
        await expect(page).toHaveURL(/\/login/);
        return;
      }
      await expectPublicPageReady(page);
    });
  }
});
