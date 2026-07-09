import { test, expect, type Page } from "@playwright/test";
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

loadDotEnvFiles();

type TempUser = { id: string; email: string; password: string; username: string };

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-15", width: 393, height: 852 },
  { name: "iphone-17-pro-max", width: 440, height: 956 },
  { name: "android", width: 412, height: 915 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

test.describe.serial("Messages + Notifications v1.0 — canonical layout", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Auth layout E2E runs on chromium only");
  });

  let admin: SupabaseClient<Database>;
  let tempUser: TempUser | null = null;

  async function createTempUser(): Promise<TempUser> {
    const idSeed = Date.now().toString(36).slice(-6);
    const email = `support+e2e-msg-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_msg_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Messages", role: "buyer" },
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`createUser failed: ${error?.message ?? JSON.stringify(error) ?? "no user"}`);
    }

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: "E2E Messages",
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
  }

  async function assertNoHorizontalOverflow(page: Page) {
    const overflowPx = await page.evaluate(
      () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    );
    expect(overflowPx).toBeLessThanOrEqual(1);
  }

  async function assertMessagesInbox(page: Page) {
    const bodyText = await page.locator("body").innerText();
    await expect(
      page.locator('[data-messages-version="v1.0"]'),
      `Expected messages v1 shell. Body text: ${bodyText.slice(0, 200)}`,
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Messages", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "My Account" })).toHaveCount(1);
    await expect(page.locator(".msg-v1__compose")).toHaveCount(1);
    await expect(page.locator('[data-bottom-nav="2026"]')).toHaveCount(1);
    await assertNoHorizontalOverflow(page);
  }

  async function assertNotificationsInbox(page: Page) {
    await expect(page.locator('[data-notifications-version="v1.0"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(1);
    await expect(page.locator(".rvx-topbar")).toHaveCount(1);
    await expect(page.locator('[data-bottom-nav="2026"]')).toHaveCount(1);
    await assertNoHorizontalOverflow(page);
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

  test("messages inbox renders canonical v1 layout", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Temp user not available");
    await signIn(page, tempUser!, baseURL!);
    await page.goto("/account", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator(".ac-hub")).toBeVisible({ timeout: 60_000 });
    await page.goto("/messages", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/messages/, { timeout: 60_000 });
    await assertMessagesInbox(page);
  });

  test("notifications inbox renders canonical v1 layout", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Temp user not available");
    await signIn(page, tempUser!, baseURL!);
    await page.goto("/notifications", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/notifications/, { timeout: 60_000 });
    await assertNotificationsInbox(page);
  });

  for (const viewport of VIEWPORTS) {
    test(`messages responsive at ${viewport.name}`, async ({ page, baseURL }) => {
      test.skip(!tempUser || !baseURL, "Temp user not available");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signIn(page, tempUser!, baseURL!);
      await page.goto("/messages", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await assertMessagesInbox(page);
    });

    test(`notifications responsive at ${viewport.name}`, async ({ page, baseURL }) => {
      test.skip(!tempUser || !baseURL, "Temp user not available");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signIn(page, tempUser!, baseURL!);
      await page.goto("/notifications", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await assertNotificationsInbox(page);
    });
  }
});
