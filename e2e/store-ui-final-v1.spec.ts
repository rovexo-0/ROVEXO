import { expect, test, type Page } from "@playwright/test";
import { dismissCookieBanner, ensureMarketplaceSession } from "./helpers/marketplace-session";
import { signInDemoSeller } from "./helpers/sell";

const VISITOR_STORE = "/store/mishuu";
const COOKIE_CONSENT_KEY = "rovexo_cookie_consent_v1";

async function acceptCookies(page: Page) {
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, "accepted");
    } catch {
      /* ignore */
    }
  }, COOKIE_CONSENT_KEY);
}

async function ownStorePath(page: Page, baseURL: string): Promise<string> {
  const response = await page.request.get(new URL("/api/profile", baseURL).href);
  expect(response.ok(), `GET /api/profile ${response.status()}`).toBeTruthy();
  const payload = (await response.json()) as { profile?: { username?: string } };
  const username = payload.profile?.username?.replace(/^@+/, "").trim();
  expect(username, "owner username from /api/profile").toBeTruthy();
  return `/store/${encodeURIComponent(username!)}`;
}

async function openStore(page: Page, path: string) {
  await acceptCookies(page);
  const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  expect(response?.ok() ?? false, `${path} HTTP ${response?.status()}`).toBeTruthy();
  await dismissCookieBanner(page);
  await expect(page.locator(".sv2").first()).toBeVisible({ timeout: 30_000 });
}

function storeRoot(page: Page) {
  return page.locator(".sv2").first();
}

async function openStoreOverflow(page: Page) {
  const root = storeRoot(page);
  const btn = root.locator('[data-store-header-overflow="v1"]');
  const menu = page.locator('[data-store-overflow-menu="v1"]').first();
  await expect(btn).toBeVisible();
  await expect(async () => {
    if (!(await menu.isVisible().catch(() => false))) {
      await btn.click({ timeout: 2_000 });
    }
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}

function saveButton(page: Page) {
  return page.locator('[data-listing-surface="store"] [data-store-saved]').first();
}

function parseHeartCount(label: string): { saved: boolean; count: number } {
  const saved = label.includes("❤️");
  const match = label.match(/(\d+)\s*$/);
  return { saved, count: match ? Number(match[1]) : Number.NaN };
}

test.describe("Store UI final — visitor overflow", () => {
  test("⋯ opens Report for a visitor Store", async ({ page }) => {
    await openStore(page, VISITOR_STORE);
    await openStoreOverflow(page);
    const menu = page.locator('[data-store-overflow-menu="v1"]');
    await expect(menu).toHaveAttribute("data-store-overflow-role", "visitor");
    await expect(page.getByRole("menuitem", { name: "Report store" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Edit Store" })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "Report store" }).click({ force: true });
    await expect(page.getByRole("dialog", { name: "Report" })).toBeVisible();
  });
});

test.describe("Store UI final — authenticated Saved", () => {
  test("heart toggles canonical saved count and persists", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    await ensureMarketplaceSession(page, baseURL);
    await openStore(page, VISITOR_STORE);

    const heart = saveButton(page);
    await expect(heart).toBeVisible({ timeout: 30_000 });
    await page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/saved") && response.request().method() === "GET",
        { timeout: 15_000 },
      )
      .catch(() => undefined);
    const listingUrl = page.url();

    const startLabel = ((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const start = parseHeartCount(startLabel);
    expect(Number.isFinite(start.count), `heart label: ${startLabel}`).toBe(true);

    if (start.saved) {
      const unsave = page.waitForResponse(
        (response) =>
          response.url().includes("/api/saved") && response.request().method() === "DELETE",
      );
      await heart.click();
      expect((await unsave).ok()).toBeTruthy();
      await expect(heart).toContainText("♡");
    }

    const beforeLabel = ((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const before = parseHeartCount(beforeLabel);
    expect(before.saved).toBe(false);

    const saveResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/saved") && response.request().method() === "POST",
    );
    await heart.click({ force: true });
    expect(page.url()).toBe(listingUrl);
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok(), `POST /api/saved ${saveResponse.status()}`).toBeTruthy();
    await expect(heart).toHaveAttribute("data-active", "true", { timeout: 20_000 });
    await expect(heart).toContainText("❤️");
    const afterSave = parseHeartCount(((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim());
    expect(afterSave.count).toBe(before.count + 1);

    const firstCard = page.locator('[data-listing-surface="store"]').first();
    await expect(firstCard).toContainText("⭐");
    await expect(firstCard).toContainText("👁");
    await expect(firstCard).not.toContainText("incl.");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(saveButton(page)).toContainText("❤️");
    const persistedSave = parseHeartCount(
      ((await saveButton(page).textContent()) ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(persistedSave.count).toBe(before.count + 1);

    const unsaveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/saved") && response.request().method() === "DELETE",
    );
    await saveButton(page).click();
    expect((await unsaveResponse).ok()).toBeTruthy();
    await expect(saveButton(page)).toContainText("♡");
    const afterUnsave = parseHeartCount(
      ((await saveButton(page).textContent()) ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(afterUnsave.count).toBe(before.count);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(saveButton(page)).toContainText("♡");
    const persistedUnsave = parseHeartCount(
      ((await saveButton(page).textContent()) ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(persistedUnsave.count).toBe(before.count);
  });

  test("failed /api/saved rolls back optimistic count", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    await ensureMarketplaceSession(page, baseURL);
    await openStore(page, VISITOR_STORE);
    const heart = saveButton(page);
    await expect(heart).toBeVisible({ timeout: 30_000 });

    const startLabel = ((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const start = parseHeartCount(startLabel);
    if (start.saved) {
      const unsave = page.waitForResponse(
        (response) =>
          response.url().includes("/api/saved") && response.request().method() === "DELETE",
      );
      await heart.click({ force: true });
      expect((await unsave).ok()).toBeTruthy();
      await expect(heart).toContainText("♡");
    }
    const unsavedLabel = ((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const baseline = parseHeartCount(unsavedLabel);
    expect(baseline.saved).toBe(false);

    await page.route("**/api/saved", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "forced-e2e-failure" }),
        });
        return;
      }
      await route.continue();
    });

    await heart.click({ force: true });
    await expect(heart).toContainText("♡", { timeout: 10_000 });
    const rolled = parseHeartCount(((await heart.textContent()) ?? "").replace(/\s+/g, " ").trim());
    expect(rolled.count).toBe(baseline.count);
    await page.unroute("**/api/saved");
  });
});

test.describe("Store UI final — owner overflow (no cover)", () => {
  test("own Store ⋯ opens Share Store and Edit Store", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    await signInDemoSeller(page, baseURL);
    const path = await ownStorePath(page, baseURL);
    await openStore(page, path);
    await expect(page.locator('[data-store-hero="v2"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(".sv2__banner")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Add cover|Change cover|Remove cover/i })).toHaveCount(
      0,
    );
    await expect(page.getByText("Recommended size")).toHaveCount(0);
    await expect(page.locator("[data-store-cover-controls]")).toHaveCount(0);

    await openStoreOverflow(page);
    const menu = page.locator('[data-store-overflow-menu="v1"]');
    await expect(menu).toHaveAttribute("data-store-overflow-role", "owner");
    await expect(page.getByRole("menuitem", { name: "Share Store" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Edit Store" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Report store" })).toHaveCount(0);

    await page.getByRole("menuitem", { name: "Edit Store" }).click({ force: true });
    await page.waitForURL(/\/account\/(edit-profile|profile)/, { timeout: 30_000 });
  });

  test("Store page has no cover banner, upload, or crop UI", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    await signInDemoSeller(page, baseURL);
    const path = await ownStorePath(page, baseURL);
    await openStore(page, path);

    const root = storeRoot(page);
    await expect(root.locator('[data-store-hero="v2"]')).toBeVisible();
    await expect(root.locator(".sv2__avatar")).toBeVisible();
    await expect(root.locator(".sv2__banner")).toHaveCount(0);
    await expect(root.locator(".sv2__cover-controls")).toHaveCount(0);
    await expect(root.locator("[data-store-cover-crop]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add cover" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Change cover" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove cover" })).toHaveCount(0);
    await expect(page.getByText("Recommended size")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Share" }).first()).toBeVisible();
  });
});

test.describe("Store UI final — price regression", () => {
  test("Store has seller-set price only; Homepage keeps incl.", async ({ page, baseURL }) => {
    await openStore(page, VISITOR_STORE);
    const storeRootEl = page.locator(".sv2").first();
    await expect(storeRootEl).toContainText("£");
    await expect(storeRootEl).not.toContainText("incl.");
    await expect(storeRootEl).not.toContainText("🛡");

    test.skip(!baseURL, "baseURL required");
    await ensureMarketplaceSession(page, baseURL);
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toContainText(/incl\./);
  });
});
