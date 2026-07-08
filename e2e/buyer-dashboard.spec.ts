import { test, expect, type Page } from "@playwright/test";
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  applyTheme,
  assertNoHorizontalOverflow,
  BUYER_PROTOCOL_VIEWPORTS,
  waitForBuyerDashboardUi,
} from "./helpers/buyer-dashboard";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

loadDotEnvFiles();

type TempBuyer = { id: string; email: string; password: string; username: string };

function hasRealSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  return Boolean(url && serviceKey && !url.includes("placeholder.supabase.co"));
}

async function createTempBuyer(admin: SupabaseClient<Database>): Promise<TempBuyer> {
  const idSeed = Date.now().toString(36).slice(-6);
  const email = `support+e2e-buyer-${idSeed}@rovexo.co.uk`;
  const password = `Testpass!${idSeed}`;
  const username = `e2e_buyer_${idSeed}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { username, full_name: "E2E Buyer", role: "buyer" },
    email_confirm: true,
  });

  if (error) throw new Error(`createUser failed: ${error.message}`);
  if (!data.user) throw new Error("createUser returned no user");

  await admin.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      username,
      full_name: "E2E Buyer",
      role: "buyer",
      verified: true,
      account_status: "active",
    },
    { onConflict: "id" },
  );

  return { id: data.user.id, email, password, username };
}

async function deleteTempBuyer(admin: SupabaseClient<Database>, userId: string) {
  try {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  } catch {
    // best-effort cleanup
  }
}

async function signIn(page: Page, user: TempBuyer, baseURL: string) {
  await signInWithSessionCookies(page, { email: user.email, password: user.password, baseURL });
}

test.describe("Buyer Dashboard v1.0 — public access", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/buyer", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe.serial("Buyer Dashboard v1.0 — authenticated", () => {
  let admin: SupabaseClient<Database>;
  let tempBuyer: TempBuyer | null = null;

  test.beforeAll(async () => {
    test.skip(!hasRealSupabaseConfig(), "Requires real Supabase credentials in .env.local");

    try {
      admin = createAdminClient();
      tempBuyer = await createTempBuyer(admin);
    } catch (error) {
      console.warn("[buyer-dashboard] Temp buyer setup failed; tests will skip:", error);
      tempBuyer = null;
    }
  });

  test.afterAll(async () => {
    if (tempBuyer) await deleteTempBuyer(admin, tempBuyer.id);
  });

  test("loads official buyer dashboard route", async ({ page, baseURL }) => {
    test.skip(!tempBuyer || !baseURL, "Temp buyer was not created");

    await signIn(page, tempBuyer!, baseURL!);
    const response = await page.goto("/buyer", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await waitForBuyerDashboardUi(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Buying");
  });

  for (const viewport of BUYER_PROTOCOL_VIEWPORTS) {
    test(`responsive layout at ${viewport.label}px`, async ({ page, baseURL }) => {
      test.skip(!tempBuyer || !baseURL, "Temp buyer was not created");

      await signIn(page, tempBuyer!, baseURL!);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/buyer", { waitUntil: "domcontentloaded" });
      await waitForBuyerDashboardUi(page);
      await assertNoHorizontalOverflow(page);

      const pageBox = await page.locator(".account-center").boundingBox();
      expect(pageBox?.width).toBeGreaterThan(0);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`renders in ${theme} mode`, async ({ page, baseURL }) => {
      test.skip(!tempBuyer || !baseURL, "Temp buyer was not created");

      await signIn(page, tempBuyer!, baseURL!);
      await applyTheme(page, theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/buyer", { waitUntil: "domcontentloaded" });
      await waitForBuyerDashboardUi(page);
      await expect(page.locator(".account-center-header")).toBeVisible();
    });
  }

  test("module header actions are present", async ({ page, baseURL }) => {
    test.skip(!tempBuyer || !baseURL, "Temp buyer was not created");

    await signIn(page, tempBuyer!, baseURL!);
    await page.goto("/buyer", { waitUntil: "domcontentloaded" });
    await waitForBuyerDashboardUi(page);

    const header = page.locator(".account-center-header");

    await expect(header.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/notifications",
    );
    await expect(header.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/account/settings",
    );
    await expect(page.getByRole("link", { name: "Messages" })).toHaveAttribute("href", "/messages");
  });

  test("buying module tiles link to buyer tools", async ({ page, baseURL }) => {
    test.skip(!tempBuyer || !baseURL, "Temp buyer was not created");

    await signIn(page, tempBuyer!, baseURL!);
    await page.goto("/buyer", { waitUntil: "domcontentloaded" });
    await waitForBuyerDashboardUi(page);

    const tiles = page.locator(".account-center-tile");

    await expect(tiles.filter({ hasText: "Orders" }).first()).toHaveAttribute("href", "/orders");
    await expect(tiles.filter({ hasText: "Saved" }).first()).toHaveAttribute("href", "/saved");
  });
});
