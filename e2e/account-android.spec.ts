import { test, expect, type Page } from "@playwright/test";
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

loadDotEnvFiles();

type TempUser = { id: string; email: string; password: string; username: string };

const ACCOUNT_VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-15", width: 393, height: 852 },
  { name: "iphone-17-pro-max", width: 440, height: 956 },
  { name: "android", width: 412, height: 915 },
  { name: "tablet", width: 768, height: 1024 },
] as const;

const CANONICAL_MENU_LABELS = [
  "Profile",
  "My Listings",
  "Orders",
  "Saved",
  "Messages",
  "Notifications",
  "Wallet",
  "Settings",
  "Log Out",
] as const;

test.describe.serial("My Account — cross-device layout integrity", () => {
  let admin: SupabaseClient<Database>;
  let tempUser: TempUser | null = null;

  async function createTempUser(): Promise<TempUser> {
    const idSeed = Date.now().toString(36).slice(-6);
    const email = `support+e2e-account-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_account_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Account", role: "buyer" },
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "no user"}`);

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: "E2E Account",
        role: "buyer",
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    return { id: data.user.id, email, password, username };
  }

  async function deleteTempUser(userId: string) {
    try {
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }

  async function signIn(page: Page, user: TempUser, baseURL: string) {
    await signInWithSessionCookies(page, { email: user.email, password: user.password, baseURL });
    await page.goto("/account", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/account/, { timeout: 60_000 });
    await expect(page.locator(".ac-hub")).toBeVisible({ timeout: 60_000 });
  }

  async function assertAccountLayout(page: Page) {
    await expect(page.locator('[data-ac-hub-version="v1.3"]')).toHaveCount(1);
    await expect(page.locator(".ac-hub__profile-card")).toHaveCount(1);
    await expect(page.locator(".rvx-topbar")).toHaveCount(1);

    const rows = page.locator(".ac-hub__menu-card .ac-hub__row");
    await expect(rows).toHaveCount(CANONICAL_MENU_LABELS.length);

    const titles = await rows.locator(".ac-hub__row-title .truncate").allTextContents();
    expect(titles).toEqual([...CANONICAL_MENU_LABELS]);

    const polish = await page.evaluate(() => {
      const row = document.querySelector(".ac-hub__menu-card .ac-hub__row");
      const icon = document.querySelector(".ac-hub__menu-icon");
      const rowBox = row?.getBoundingClientRect();
      const iconBox = icon?.getBoundingClientRect();
      return {
        rowsHaveChevrons: [...document.querySelectorAll(".ac-hub__menu-card .ac-hub__row")].every((menuRow) =>
          Boolean(menuRow.querySelector(".ac-hub__row-chevron")),
        ),
        rowHeightPx: rowBox?.height ?? 0,
        iconSizePx: iconBox?.width ?? 0,
        overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      };
    });

    expect(polish.rowsHaveChevrons).toBe(true);
    expect(polish.rowHeightPx).toBeGreaterThanOrEqual(54);
    expect(polish.rowHeightPx).toBeLessThanOrEqual(60);
    expect(polish.iconSizePx).toBeGreaterThanOrEqual(39);
    expect(polish.iconSizePx).toBeLessThanOrEqual(41);
    expect(polish.overflowPx).toBeLessThanOrEqual(1);

    const menuCardBox = await page.locator(".ac-hub__menu-card").boundingBox();
    expect(menuCardBox?.width ?? 0).toBeGreaterThan(200);
  }

  async function assertNoOverlappingRows(page: Page) {
    const rows = page.locator(".ac-hub__menu-card .ac-hub__row");
    const count = await rows.count();
    const boxes: Array<{ x: number; y: number; w: number; h: number; label: string }> = [];

    for (let index = 0; index < count; index++) {
      const row = rows.nth(index);
      const box = await row.boundingBox();
      const label =
        (await row.locator(".ac-hub__row-title .truncate").textContent()) ?? `row-${index}`;
      if (!box) continue;
      boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height, label });
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const overlapArea = overlapX > 1 && overlapY > 1 ? overlapX * overlapY : 0;
        const minArea = Math.min(a.w * a.h, b.w * b.h);
        expect(overlapArea / minArea, `${a.label} overlaps ${b.label}`).toBeLessThan(0.05);
      }
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
    admin = createAdminClient();
    tempUser = await createTempUser();
  });

  test.afterAll(async () => {
    if (tempUser) await deleteTempUser(tempUser.id);
  });

  test("My Account hub renders canonical list rows with chevrons", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Temp user not available");
    await signIn(page, tempUser!, baseURL!);
    await assertAccountLayout(page);
    await assertNoOverlappingRows(page);
  });

  test("My Account stays stable after scroll and navigation", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Temp user not available");
    await signIn(page, tempUser!, baseURL!);
    await assertAccountLayout(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await assertAccountLayout(page);
    await assertNoOverlappingRows(page);

    await page
      .locator(".ac-hub__menu-card")
      .getByRole("link", { name: /Settings/i })
      .click();
    await expect(page).toHaveURL(/\/account\/settings/, { timeout: 30_000 });
    await expect(page.locator('[data-settings-version="v1.0"]')).toBeVisible({ timeout: 30_000 });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/account/, { timeout: 30_000 });

    await assertAccountLayout(page);
    await assertNoOverlappingRows(page);
  });

  for (const viewport of ACCOUNT_VIEWPORTS) {
    test(`responsive layout at ${viewport.name}`, async ({ page, baseURL }) => {
      test.skip(!tempUser || !baseURL, "Temp user not available");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signIn(page, tempUser!, baseURL!);
      await assertAccountLayout(page);
      await assertNoOverlappingRows(page);
    });
  }
});
