import { test, expect, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

type TempUser = { id: string; email: string; password: string; username: string };

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
  }

  async function assertAccountLayout(page: Page) {
    await expect(page.getByRole("heading", { name: "My Account", exact: true })).toHaveCount(1);

    const cards = page.locator(".acx-grid:not(.acx-grid--super-admin) .acx-card");
    await expect(cards).toHaveCount(16);

    const labels = await cards.locator(".acx-card__label").allTextContents();
    expect(new Set(labels).size).toBe(16);

    const stats = page.locator(".acx-stats__col");
    await expect(stats).toHaveCount(4);

    const statLabels = await stats.locator(".acx-stats__label").allTextContents();
    expect(new Set(statLabels).size).toBe(4);

    const gridBox = await page.locator(".acx-grid:not(.acx-grid--super-admin)").boundingBox();
    expect(gridBox?.width ?? 0).toBeGreaterThan(200);

    for (let index = 0; index < Math.min(4, 16); index++) {
      const card = cards.nth(index);
      const box = await card.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(40);
      expect(box?.height ?? 0).toBeGreaterThan(40);
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

  test("My Account grid renders once with no duplicated tiles", async ({ page, baseURL }) => {
    test.skip(!tempUser || !baseURL, "Temp user not available");
    await signIn(page, tempUser!, baseURL!);
    await assertAccountLayout(page);
  });
});
