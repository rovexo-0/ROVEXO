import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import os from "os";
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

const SAMPLE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type TempSeller = { id: string; email: string; password: string; username: string };

test.describe.serial("sell flow (Android) end-to-end", () => {
  let admin: SupabaseClient<Database>;
  const tmpFiles: string[] = [];
  let tempUser: TempSeller | null = null;

  function writeTempImage(name: string, base64: string) {
    const filePath = path.join(os.tmpdir(), `rovexo-e2e-${Date.now()}-${name}`);
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    tmpFiles.push(filePath);
    return filePath;
  }

  async function createTempSeller(): Promise<TempSeller> {
    const idSeed = Date.now().toString(36).slice(-6);
    const email = `support+e2e-seller-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_seller_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Seller", role: "seller" },
      email_confirm: true,
    });

    if (error) {
      throw new Error(`createUser failed: ${error.message ?? JSON.stringify(error)}`);
    }
    if (!data.user) throw new Error("createUser returned no user");

    const userId = data.user.id;

    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        username,
        full_name: "E2E Seller",
        role: "seller",
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    await admin.from("seller_profiles").upsert({ id: userId }, { onConflict: "id" });

    return { id: userId, email, password, username };
  }

  async function deleteTempSeller(userId: string) {
    try {
      const { data: products } = await admin.from("products").select("id").eq("seller_id", userId);
      const productIds = (products ?? []).map((p) => p.id).filter(Boolean);

      for (const pid of productIds) {
        await admin.from("product_images").delete().eq("product_id", pid);
        await admin.from("products").delete().eq("id", pid);
      }

      await admin.from("seller_profiles").delete().eq("id", userId);
      await admin.from("profiles").delete().eq("id", userId);

      try {
        const list = await admin.storage.from("products").list(`${userId}/`, { limit: 1000 });
        if (list.data?.length) {
          const paths = list.data.map((f) => `${userId}/${f.name}`);
          await admin.storage.from("products").remove(paths);
        }
      } catch {
        // best-effort storage cleanup
      }

      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort cleanup
    }
  }

  async function signIn(page: Page, user: TempSeller, baseURL: string) {
    await signInWithSessionCookies(page, {
      email: user.email,
      password: user.password,
      baseURL,
    });
    await page.goto("/account", { waitUntil: "commit", timeout: 60_000 });
    await expect(page).toHaveURL(/\/account/, { timeout: 60_000 });
  }

  async function ensureCategorySelected(page: Page) {
    const categoryButton = page.getByRole("button", { name: /select category/i });
    if (await categoryButton.isVisible().catch(() => false)) {
      await categoryButton.click();
    }

    for (let level = 0; level < 3; level += 1) {
      const chips = page.locator(".flex.flex-wrap.gap-ds-2").first().getByRole("button");
      const count = await chips.count();
      if (count === 0) break;
      await chips.first().click();
      await page.waitForTimeout(200);
    }
  }

  test.beforeAll(async () => {
    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !hasServiceKey,
      "Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local",
    );

    try {
      admin = createAdminClient();
      tempUser = await createTempSeller();
    } catch (error) {
      console.warn("[sell-android] Temp seller setup failed; tests will skip:", error);
      tempUser = null;
    }
  });

  test.afterAll(async () => {
    if (tempUser) await deleteTempSeller(tempUser.id);
    for (const file of tmpFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // ignore
      }
    }
  });

  test("complete Android sell flow", async ({ page, baseURL }) => {
    test.skip(!tempUser, "Temp seller was not created");
    test.skip(!baseURL, "Playwright baseURL is required");

    const galleryImage = writeTempImage("gallery.jpg", SAMPLE_JPEG_BASE64);
    const cameraImage = writeTempImage("camera.jpg", SAMPLE_JPEG_BASE64);

    await signIn(page, tempUser!, baseURL!);

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 180_000 });
    await expect(page.getByRole("button", { name: /add photos/i })).toBeVisible({ timeout: 120_000 });

    const galleryInput = page.locator('input[type="file"]:not([capture])').first();
    await galleryInput.setInputFiles(galleryImage);

    const cameraInput = page.locator('input[type="file"][capture="environment"]');
    await cameraInput.setInputFiles(cameraImage);

    await expect(page.locator('img[alt="Main photo"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('img[alt^="Listing photo"]')).toBeVisible({ timeout: 15_000 });

    const title = `Vintage phone ${Date.now()}`;
    await page.getByPlaceholder(/what are you selling/i).fill(title);
    await page
      .getByPlaceholder(/describe the item/i)
      .fill("A test listing created by Playwright E2E automation. Solid condition.");

    await page.waitForTimeout(500);
    await ensureCategorySelected(page);

    await page.getByPlaceholder("0.00").fill("19.99");
    await page.getByRole("button", { name: /delivery available/i }).click();

    const publishBtn = page.getByRole("button", { name: /^publish$/i });
    await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
    await publishBtn.click();

    await expect(page.getByRole("heading", { name: /congratulations/i })).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByText(/published successfully/i)).toBeVisible();

    const start = Date.now();
    let found: { id: string } | null = null;

    while (!found && Date.now() - start < 60_000) {
      const { data: row } = await admin
        .from("products")
        .select("id")
        .eq("seller_id", tempUser!.id)
        .eq("title", title)
        .maybeSingle();

      if (row?.id) {
        found = row;
        break;
      }
      await page.waitForTimeout(500);
    }

    expect(found, "Listing record should exist in database").toBeTruthy();

    const imagesRes = await admin.from("product_images").select("*").eq("product_id", found!.id);
    expect(imagesRes.error).toBeNull();
    expect((imagesRes.data ?? []).length).toBeGreaterThan(0);

    await page.getByRole("link", { name: /my listings/i }).click();
    await expect(page).toHaveURL(/\/seller\/listings/, { timeout: 30_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 30_000 });
  });
});
