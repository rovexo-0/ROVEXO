import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import { ALL_LISTINGS_SELECTOR, waitForHomepageUi } from "./helpers/stable-ui";
import { fillSellDescription, publishSellListing, uploadSellPhoto, ensureCategorySelected, gotoSellPage, fillSellTitle, ensureParcelSizeSelected } from "./helpers/sell";
import { seedSellerBankAccount } from "./helpers/seller-setup";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

const SAMPLE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type TempUser = { id: string; email: string; password: string; username: string; role: "buyer" | "seller" };

test.describe.serial("production hotfix validation", () => {
  let admin: SupabaseClient<Database>;
  let buyerUser: TempUser | null = null;
  let sellerUser: TempUser | null = null;
  const tmpFiles: string[] = [];

  function writeTempImage(name: string) {
    const filePath = path.join(os.tmpdir(), `rovexo-hotfix-${Date.now()}-${name}`);
    fs.writeFileSync(filePath, Buffer.from(SAMPLE_JPEG_BASE64, "base64"));
    tmpFiles.push(filePath);
    return filePath;
  }

  async function createTempUser(role: "buyer" | "seller"): Promise<TempUser> {
    const idSeed = `${role}-${Date.now().toString(36).slice(-6)}`;
    const email = `support+e2e-${role}-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_${role}_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: `E2E ${role}`, role },
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "no user"}`);

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: `E2E ${role}`,
        role,
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    if (role === "seller") {
      await admin.from("seller_profiles").upsert({ id: data.user.id }, { onConflict: "id" });
      await seedSellerBankAccount(admin, data.user.id);
    }

    return { id: data.user.id, email, password, username, role };
  }

  async function deleteTempUser(userId: string) {
    try {
      const { data: products } = await admin.from("products").select("id").eq("seller_id", userId);
      for (const pid of (products ?? []).map((p) => p.id).filter(Boolean)) {
        await admin.from("product_images").delete().eq("product_id", pid);
        await admin.from("products").delete().eq("id", pid);
      }
      await admin.from("seller_profiles").delete().eq("id", userId);
      await admin.from("withdraw_methods").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }

  async function signIn(page: Page, user: TempUser, baseURL: string) {
    await signInWithSessionCookies(page, { email: user.email, password: user.password, baseURL });
    await page.goto("/account", { waitUntil: "commit", timeout: 60_000 });
    await expect(page).toHaveURL(/\/account/, { timeout: 60_000 });
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
    try {
      buyerUser = await createTempUser("buyer");
      sellerUser = await createTempUser("seller");
    } catch (error) {
      console.warn("[hotfix-production] Temp user setup failed:", error);
    }
  });

  test.afterAll(async () => {
    if (buyerUser) await deleteTempUser(buyerUser.id);
    if (sellerUser) await deleteTempUser(sellerUser.id);
    for (const file of tmpFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // ignore
      }
    }
  });

  test("BUG #1 — published listing appears on homepage feed", async ({ page, baseURL, request }) => {
    test.skip(!sellerUser || !baseURL, "Temp seller not available");

    await signIn(page, sellerUser!, baseURL!);
    const galleryImage = writeTempImage("publish.jpg");
    const title = `Hotfix homepage ${Date.now()}`;

    await gotoSellPage(page);

    await uploadSellPhoto(page, galleryImage);
    await fillSellTitle(page, title);
    await fillSellDescription(page, "E2E hotfix validation listing with enough detail for publish.");

    await ensureCategorySelected(page);
    await ensureParcelSizeSelected(page);

    await page.getByPlaceholder("0.00").fill("29.99");
    await publishSellListing(page);

    const { data: row } = await admin
      .from("products")
      .select("slug, status, moderation_status")
      .eq("seller_id", sellerUser!.id)
      .eq("title", title)
      .maybeSingle();
    expect(row?.status).toBe("published");

    const feedRes = await request.get("/api/homepage/feed?page=1");
    expect(feedRes.ok()).toBeTruthy();
    const feed = (await feedRes.json()) as { items?: Array<{ title?: string; slug?: string }> };
    const inFeed = (feed.items ?? []).some((item) => item.title === title);
    expect(inFeed, "Listing must be in homepage feed API immediately after publish").toBe(true);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await expect(page.locator(ALL_LISTINGS_SELECTOR).getByText(title)).toBeVisible({ timeout: 60_000 });
  });

  test("BUG #2 — eBay Connect starts OAuth or returns to import wizard (not homepage)", async ({
    page,
    baseURL,
  }) => {
    test.skip(!buyerUser || !baseURL, "Temp buyer not available");

    await signIn(page, buyerUser!, baseURL!);
    await page.goto("/account/bring-your-item?platform=ebay", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/account\/bring-your-item/, { timeout: 30_000 });
    await expect(page.getByRole("button", { name: /connect ebay/i })).toBeVisible({
      timeout: 30_000,
    });

    const navigationPromise = page.waitForURL(
      (url) =>
        url.hostname.includes("ebay.com") ||
        (url.pathname.includes("/account/bring-your-item") && url.searchParams.has("oauth")) ||
        url.pathname.includes("/login"),
      { timeout: 30_000 },
    );

    await page.getByRole("button", { name: /connect ebay/i }).click();
    await navigationPromise;

    const finalUrl = page.url();
    const finalPath = new URL(finalUrl).pathname;
    expect(finalPath, "Must not redirect to homepage").not.toBe("/");

    const onBringYourItem = finalUrl.includes("/account/bring-your-item");
    const onEbay = finalUrl.includes("ebay.com");
    const onLogin = finalUrl.includes("/login");
    expect(onBringYourItem || onEbay || onLogin, `Unexpected redirect: ${finalUrl}`).toBe(true);

    if (onBringYourItem) {
      expect(finalUrl).toMatch(/platform=ebay/);
    }
    if (onEbay) {
      expect(finalUrl).toMatch(/auth\.ebay\.com\/oauth2\/authorize/);
    }
  });

  test("BUG #3 — Android Chrome gallery input accepts photos", async ({ page, baseURL }) => {
    test.skip(!sellerUser || !baseURL, "Temp seller not available");

    await signIn(page, sellerUser!, baseURL!);
    const galleryImage = writeTempImage("android-gallery.jpg");

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 180_000 });
    await expect(page.getByRole("button", { name: /add photo/i })).toBeVisible({ timeout: 120_000 });
    await uploadSellPhoto(page, galleryImage);
  });
});
