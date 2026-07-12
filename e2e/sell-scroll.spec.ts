/**
 * Sell page scroll — document scroll must never remain locked after selectors close.
 */
import { test, expect, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

type TempSeller = { id: string; email: string; password: string };

async function readScrollMetrics(page: Page) {
  return page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    scrollY: window.scrollY,
    bodyLocked: document.body.classList.contains("rx-scroll-locked"),
    bodyOverflow: window.getComputedStyle(document.body).overflow,
    mainOverflow: document.querySelector("main.rx-scroll-page")
      ? window.getComputedStyle(document.querySelector("main.rx-scroll-page")!).overflowY
      : "",
  }));
}

async function readScrollY(page: Page): Promise<number> {
  return page.evaluate(() =>
    Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop),
  );
}

async function scrollWindow(page: Page, y: number): Promise<void> {
  await page.evaluate((scrollY) => {
    window.scrollTo(0, scrollY);
    document.documentElement.scrollTop = scrollY;
    document.body.scrollTop = scrollY;
  }, y);
}

async function nudgeScroll(page: Page, deltaY: number): Promise<void> {
  const isMobileWebKit = await page.evaluate(
    () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !("onwheel" in window),
  );
  if (isMobileWebKit) {
    await page.evaluate((dy) => window.scrollBy(0, dy), deltaY);
    return;
  }
  try {
    await page.mouse.wheel(0, deltaY);
  } catch {
    await page.evaluate((dy) => window.scrollBy(0, dy), deltaY);
  }
}

async function assertPageScrollable(page: Page) {
  const metrics = await readScrollMetrics(page);
  expect(metrics.clientHeight).toBeGreaterThan(0);
  expect(metrics.bodyLocked).toBe(false);
  expect(metrics.bodyOverflow).not.toBe("hidden");
  expect(metrics.mainOverflow).not.toBe("hidden");

  if (metrics.scrollHeight <= metrics.clientHeight + 8) {
    return;
  }

  const midpoint = Math.floor(metrics.scrollHeight / 2);
  await scrollWindow(page, midpoint);
  let middleY = await readScrollY(page);
  if (middleY === 0) {
    await nudgeScroll(page, midpoint);
    middleY = await readScrollY(page);
  }
  if (middleY === 0) {
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(150);
    middleY = await readScrollY(page);
  }
  if (middleY === 0) {
  await page
      .locator("main.sell-page-v1-content, main.rx-scroll-page")
      .last()
      .evaluate((node, y) => {
        node.scrollTop = y;
        window.scrollTo(0, y);
        document.documentElement.scrollTop = y;
      }, midpoint);
    await page.waitForTimeout(150);
    middleY = await readScrollY(page);
  }
  expect(middleY).toBeGreaterThan(0);
}

async function closeCategoryPicker(page: Page) {
  await page
    .getByRole("dialog", { name: /select a category/i })
    .getByRole("button", { name: "Back" })
    .click();
}

async function closeParcelPicker(page: Page) {
  await page
    .getByRole("dialog", { name: "Select parcel size" })
    .getByRole("button", { name: "Back" })
    .click();
}

test.describe("sell page scroll", () => {
  let admin: SupabaseClient<Database>;
  let tempUser: TempSeller | null = null;

  async function createTempSeller(): Promise<TempSeller> {
    const idSeed = Date.now().toString(36).slice(-6);
    const email = `support+e2e-scroll-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_scroll_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Scroll", role: "seller" },
      email_confirm: true,
    });

    if (error) throw new Error(`createUser failed: ${error.message}`);
    if (!data.user) throw new Error("createUser returned no user");

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: "E2E Scroll",
        role: "seller",
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    await admin.from("seller_profiles").upsert({ id: data.user.id }, { onConflict: "id" });
    return { id: data.user.id, email, password };
  }

  async function deleteTempSeller(userId: string) {
    try {
      await admin.from("seller_profiles").delete().eq("id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }

  test.beforeAll(async () => {
    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !hasServiceKey,
      "Requires Supabase credentials in .env.local",
    );

    try {
      admin = createAdminClient();
      tempUser = await createTempSeller();
    } catch {
      tempUser = null;
    }
  });

  test.afterAll(async () => {
    if (tempUser) await deleteTempSeller(tempUser.id);
  });

  test("desktop sell page scrolls top, middle, and bottom", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Requires temp seller and baseURL");

    await signInWithSessionCookies(page, {
      email: tempUser!.email,
      password: tempUser!.password,
      baseURL: baseURL!,
    });

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect(page.getByText("Add Photos").first()).toBeVisible({ timeout: 60_000 });

    await assertPageScrollable(page);
  });

  test("category selector opens and closes without leaving body locked", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Requires temp seller and baseURL");

    await signInWithSessionCookies(page, {
      email: tempUser!.email,
      password: tempUser!.password,
      baseURL: baseURL!,
    });

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 120_000 });
    const categoryButton = page.getByRole("button", { name: /select category/i });
    await expect(categoryButton).toBeVisible({ timeout: 60_000 });
    await categoryButton.click();
    await expect(page.getByRole("heading", { name: "Category" })).toBeVisible({ timeout: 10_000 });

    const lockedWhileOpen = await page.evaluate(() =>
      document.body.classList.contains("rx-scroll-locked"),
    );
    expect(lockedWhileOpen).toBe(false);

    await closeCategoryPicker(page);
    await expect(page.getByRole("heading", { name: "Category" })).toBeHidden({ timeout: 10_000 });

    await assertPageScrollable(page);
  });

  test("mobile sell page scrolls after selector close", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Requires temp seller and baseURL");

    await page.setViewportSize({ width: 412, height: 915 });
    await signInWithSessionCookies(page, {
      email: tempUser!.email,
      password: tempUser!.password,
      baseURL: baseURL!,
    });

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect(page.getByRole("region", { name: "Add Photos" })).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /select category/i }).click();
    await expect(page.getByRole("heading", { name: "Category" })).toBeVisible();
    await closeCategoryPicker(page);
    await expect(page.getByRole("heading", { name: "Category" })).toBeHidden();

    await assertPageScrollable(page);
  });

  async function selectHealthCategory(page: Page) {
    const title = page.getByLabel("Listing title");
    await expect(title).toBeVisible({ timeout: 60_000 });
    await title.fill("Vitamin supplement bottle");
    await title.blur();

    const description = page.getByLabel("Listing description");
    await description.fill("Sealed health supplement bottle for progressive sell flow testing.");
    await description.blur();

    await page.waitForTimeout(600);

    const categoryButton = page.getByRole("button", { name: /select category/i });
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();

    const pickerOpen = await page
      .getByRole("heading", { name: "Category" })
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (pickerOpen) {
      if (await page.getByText("Suggested Category", { exact: true }).isVisible().catch(() => false)) {
        await page.locator("ul").first().getByRole("button").first().click();
      } else if (await page.getByText("Possible Match", { exact: true }).isVisible().catch(() => false)) {
        await page.locator("ul").first().getByRole("button").first().click();
      } else {
        await page.getByRole("button", { name: /^Health & Beauty$/i }).click();
        await page.getByRole("button", { name: /^Health$/i }).click();
      }

      await expect(page.getByRole("heading", { name: "Category" })).toBeHidden({ timeout: 10_000 });
    }
  }

  test("progressive fields appear after category selection", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Requires temp seller and baseURL");

    await page.setViewportSize({ width: 390, height: 844 });
    await signInWithSessionCookies(page, {
      email: tempUser!.email,
      password: tempUser!.password,
      baseURL: baseURL!,
    });

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled();
    await selectHealthCategory(page);
    await expect(page.locator("#sell-field-brand")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-sell-publish-bar]')).toBeVisible();
    await assertPageScrollable(page);
  });
});
