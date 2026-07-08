import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  ALL_LISTINGS_SELECTOR,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

const SAMPLE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type TempSeller = { id: string; email: string; password: string; username: string };

type PublishedListing = {
  id: string;
  slug: string;
  title: string;
  categorySlugPath: string[];
};

test.describe.serial("listing lifecycle certification", () => {
  let admin: SupabaseClient<Database>;
  let seller: TempSeller | null = null;
  const tmpFiles: string[] = [];
  const published: PublishedListing = { id: "", slug: "", title: "", categorySlugPath: [] };

  function writeTempImage(name: string) {
    const filePath = path.join(os.tmpdir(), `rovexo-cert-${Date.now()}-${name}`);
    fs.writeFileSync(filePath, Buffer.from(SAMPLE_JPEG_BASE64, "base64"));
    tmpFiles.push(filePath);
    return filePath;
  }

  async function createTempSeller(): Promise<TempSeller> {
    const idSeed = Date.now().toString(36).slice(-6);
    const email = `support+e2e-cert-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_cert_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Cert Seller", role: "seller" },
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "no user"}`);

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: "E2E Cert Seller",
        role: "seller",
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );
    await admin.from("seller_profiles").upsert({ id: data.user.id }, { onConflict: "id" });

    return { id: data.user.id, email, password, username };
  }

  async function deleteTempSeller(userId: string) {
    try {
      const { data: products } = await admin.from("products").select("id").eq("seller_id", userId);
      for (const pid of (products ?? []).map((p) => p.id).filter(Boolean)) {
        await admin.from("product_images").delete().eq("product_id", pid);
        await admin.from("products").delete().eq("id", pid);
      }
      await admin.from("seller_profiles").delete().eq("id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      try {
        const list = await admin.storage.from("products").list(`${userId}/`, { limit: 1000 });
        if (list.data?.length) {
          await admin.storage.from("products").remove(list.data.map((f) => `${userId}/${f.name}`));
        }
      } catch {
        // best-effort
      }
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }

  async function resolveCategorySlugPath(categoryId: string | null): Promise<string[]> {
    const segments: string[] = [];
    let currentId: string | null = categoryId;
    for (let depth = 0; depth < 8 && currentId; depth += 1) {
      const { data } = await admin
        .from("categories")
        .select("slug, parent_id")
        .eq("id", currentId)
        .maybeSingle();
      if (!data?.slug) break;
      segments.unshift(data.slug);
      currentId = data.parent_id ?? null;
    }
    return segments;
  }

  async function signIn(page: Page, baseURL: string) {
    await signInWithSessionCookies(page, {
      email: seller!.email,
      password: seller!.password,
      baseURL,
    });
    await page.goto("/account", { waitUntil: "commit", timeout: 60_000 });
    await expect(page).toHaveURL(/\/account/, { timeout: 60_000 });
  }

  async function feedContainsSlug(page: Page, slug: string): Promise<boolean> {
    for (let pageNum = 1; pageNum <= 5; pageNum += 1) {
      const res = await page.request.get(`/api/homepage/feed?page=${pageNum}`);
      if (!res.ok()) break;
      const json = (await res.json()) as {
        items?: Array<{ slug?: string }>;
        hasMore?: boolean;
      };
      if ((json.items ?? []).some((item) => item.slug === slug)) return true;
      if (!json.hasMore) break;
    }
    return false;
  }

  test.beforeAll(async () => {
    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !hasServiceKey,
      "Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local",
    );
    admin = createAdminClient();
    try {
      seller = await createTempSeller();
    } catch (error) {
      console.warn("[lifecycle-cert] Temp seller setup failed; tests will skip:", error);
      seller = null;
    }
  });

  test.afterAll(async () => {
    if (seller && process.env.KEEP_E2E_LISTING === "1") {
      console.log(
        `[keep] seller=${seller.id} username=${seller.username} slug=${published.slug} id=${published.id}`,
      );
      return;
    }
    if (seller) await deleteTempSeller(seller.id);
    for (const file of tmpFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // ignore
      }
    }
  });

  test("PUBLISH — new listing persists with image + published status", async ({ page, baseURL }) => {
    test.skip(!seller || !baseURL, "Temp seller not available");

    await signIn(page, baseURL!);

    const image = writeTempImage("cover.jpg");
    const title = `Lifecycle Cert Sofa ${Date.now()}`;
    published.title = title;

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 180_000 });
    await expect(page.getByRole("button", { name: /add photo/i })).toBeVisible({ timeout: 120_000 });

    await page.locator('input[type="file"][multiple]').setInputFiles(image);
    await expect(page.locator('img[alt="Main photo"]')).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/tell buyers what you're selling/i).fill(title);
    await page
      .getByPlaceholder(/tell buyers more about/i)
      .fill("Lifecycle certification listing published by Playwright end-to-end automation.");

    await page.waitForTimeout(400);
    const categoryButton = page.getByRole("button", { name: /select category|^category$/i });
    if (await categoryButton.isVisible().catch(() => false)) {
      await categoryButton.click();
      const searchInput = page.getByRole("searchbox", { name: /search categories/i });
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill("sofa");
        await page.getByRole("button").filter({ hasText: /sofa/i }).first().click();
      }
    }

    await page.getByPlaceholder("0.00").fill("24.99");

    const continueBtn = page.getByRole("button", { name: /^continue$/i });
    const publishBtn = page.getByRole("button", { name: /^publish$/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await expect(continueBtn).toBeEnabled({ timeout: 15_000 });
      await continueBtn.click();
    } else {
      await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
      await publishBtn.click();
    }

    await expect(page.getByText(/published successfully/i).first()).toBeVisible({ timeout: 120_000 });

    // Poll DB for the persisted row (publish is fully server-side).
    const start = Date.now();
    let row: {
      id: string;
      slug: string;
      status: string | null;
      category_id: string | null;
    } | null = null;
    while (!row && Date.now() - start < 60_000) {
      const { data } = await admin
        .from("products")
        .select("id, slug, status, category_id")
        .eq("seller_id", seller!.id)
        .eq("title", title)
        .maybeSingle();
      if (data?.id) {
        row = data;
        break;
      }
      await page.waitForTimeout(500);
    }

    expect(row, "Published listing must exist in database").toBeTruthy();
    expect(row!.status, "Listing status must be published").toBe("published");
    expect(row!.slug, "Listing must have a slug").toBeTruthy();

    const imagesRes = await admin.from("product_images").select("id").eq("product_id", row!.id);
    expect(imagesRes.error).toBeNull();
    expect((imagesRes.data ?? []).length, "Listing must have at least one image").toBeGreaterThan(0);

    published.id = row!.id;
    published.slug = row!.slug;
    published.categorySlugPath = await resolveCategorySlugPath(row!.category_id);
  });

  test("HOMEPAGE — listing appears in feed API and rendered grid", async ({ page }) => {
    test.skip(!published.slug, "No published listing");

    expect(await feedContainsSlug(page, published.slug), "Listing must be in homepage feed API").toBe(
      true,
    );

    const cardLocator = page
      .locator(ALL_LISTINGS_SELECTOR)
      .locator(`a[href*="/listing/${published.slug}"]`)
      .first();

    let rendered = false;
    for (let attempt = 1; attempt <= 8 && !rendered; attempt += 1) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);
      rendered = await cardLocator.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!rendered) {
        const anywhere = await page
          .locator(`a[href*="/listing/${published.slug}"]`)
          .count();
        const gridCards = await page
          .locator(ALL_LISTINGS_SELECTOR)
          .locator('a[href*="/listing/"]')
          .count();
        const anyCards = await page.locator('a[href*="/listing/"]').count();
        const emptyState = await page
          .getByRole("heading", { name: /no listings yet/i })
          .isVisible()
          .catch(() => false);
        console.log(
          `[homepage-diag] attempt ${attempt}: cardInGrid=${rendered} slugAnywhere=${anywhere} gridCards=${gridCards} anyCardsOnPage=${anyCards} emptyStateHeading=${emptyState}`,
        );
        await page.waitForTimeout(4_000);
      }
    }

    expect(rendered, "Published listing must render on the homepage grid").toBe(true);
  });

  test("SEARCH — listing appears in search results with same slug", async ({ page }) => {
    test.skip(!published.slug, "No published listing");

    await page.goto(`/search?q=${encodeURIComponent(published.title)}`, {
      waitUntil: "domcontentloaded",
    });
    await waitForSearchResultsUi(page);
    await expect(page.locator(`a[href*="/listing/${published.slug}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("CATEGORY — listing appears on its category page", async ({ page }) => {
    test.skip(!published.slug, "No published listing");
    test.skip(published.categorySlugPath.length === 0, "Listing category could not be resolved");

    await page.goto(`/category/${published.categorySlugPath.join("/")}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.locator(`a[href*="/listing/${published.slug}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("SELLER STORE — listing appears on the seller store", async ({ page }) => {
    test.skip(!published.slug, "No published listing");

    await page.goto(`/user/${seller!.username}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.locator(`a[href*="/listing/${published.slug}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("PRODUCT DETAILS — page renders with images loaded (no broken icons)", async ({ page }) => {
    test.skip(!published.slug, "No published listing");

    await page.goto(`/listing/${published.slug}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.locator("[data-pd-detail-version]").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(published.title).first()).toBeVisible({ timeout: 30_000 });

    // Every rendered image must have a real source and have decoded (no broken icon).
    await page.waitForTimeout(1_000);
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter((img) => {
          const src = img.getAttribute("src") ?? "";
          const invalidSrc = src === "" || src === "null" || src === "undefined";
          const failedToLoad = img.complete && img.naturalWidth === 0;
          return invalidSrc || failedToLoad;
        })
        .map((img) => img.getAttribute("src") ?? "(empty)");
    });
    expect(brokenImages, `Broken/invalid images found: ${brokenImages.join(", ")}`).toEqual([]);
  });

  test("MY LISTINGS — listing appears for the owner", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);
    await page.goto("/seller/listings", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByText(published.title)).toBeVisible({ timeout: 30_000 });
  });

  test("FAVORITE — item can be saved and appears in Saved", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);

    const saveRes = await page.request.post("/api/saved", {
      data: { productSlug: published.slug },
    });
    expect(saveRes.ok(), "Saving item must succeed").toBeTruthy();

    const listRes = await page.request.get("/api/saved");
    expect(listRes.ok()).toBeTruthy();
    const savedJson = (await listRes.json()) as { items?: Array<{ slug?: string }> };
    expect(
      (savedJson.items ?? []).some((item) => item.slug === published.slug),
      "Saved list must contain the listing",
    ).toBe(true);

    await page.goto("/saved", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByText(published.title).first()).toBeVisible({ timeout: 30_000 });
  });

  test("EDIT — price update propagates to DB and product page", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);

    const patchRes = await page.request.patch(`/api/listings/${published.id}`, {
      data: { price: 55.5 },
    });
    expect(patchRes.ok(), "Edit (PATCH) must succeed").toBeTruthy();

    const { data: updated } = await admin
      .from("products")
      .select("price")
      .eq("id", published.id)
      .maybeSingle();
    expect(Number(updated?.price)).toBe(55.5);

    await page.goto(`/listing/${published.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/55\.50|55,50|£55\.50/).first()).toBeVisible({ timeout: 30_000 });
  });

  test("PAUSE — listing is removed from public surfaces", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);
    const pauseRes = await page.request.post(`/api/listings/${published.id}/status`, {
      data: { action: "pause" },
    });
    expect(pauseRes.ok(), "Pause must succeed").toBeTruthy();

    const { data: paused } = await admin
      .from("products")
      .select("status")
      .eq("id", published.id)
      .maybeSingle();
    expect(paused?.status).toBe("paused");

    expect(await feedContainsSlug(page, published.slug), "Paused listing must NOT be in feed").toBe(
      false,
    );

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await expect(
      page.locator(ALL_LISTINGS_SELECTOR).locator(`a[href*="/listing/${published.slug}"]`),
    ).toHaveCount(0);
  });

  test("ACTIVATE — reactivated listing returns to public surfaces", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);
    const res = await page.request.post(`/api/listings/${published.id}/status`, {
      data: { action: "reactivate" },
    });
    expect(res.ok(), "Reactivate must succeed").toBeTruthy();

    const { data: active } = await admin
      .from("products")
      .select("status")
      .eq("id", published.id)
      .maybeSingle();
    expect(active?.status).toBe("published");

    expect(
      await feedContainsSlug(page, published.slug),
      "Reactivated listing must be back in feed",
    ).toBe(true);
  });

  test("DELETE — listing is removed everywhere via My Listings UI", async ({ page, baseURL }) => {
    test.skip(!published.slug || !baseURL, "No published listing");

    await signIn(page, baseURL!);
    await page.goto("/seller/listings", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByText(published.title)).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: `Delete ${published.title}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(published.title)).toHaveCount(0, { timeout: 30_000 });

    // DB row is gone (hard delete + cascade).
    const { data: gone } = await admin
      .from("products")
      .select("id")
      .eq("id", published.id)
      .maybeSingle();
    expect(gone, "Product row must be deleted").toBeNull();

    // Child images cascaded.
    const { data: orphanImages } = await admin
      .from("product_images")
      .select("id")
      .eq("product_id", published.id);
    expect((orphanImages ?? []).length, "No orphan images").toBe(0);

    // Public feed no longer contains it.
    expect(await feedContainsSlug(page, published.slug), "Deleted listing must NOT be in feed").toBe(
      false,
    );
  });
});
