/**
 * Step 3 E2E hardening — Help / Legal / Privacy / About / Support.
 * Reuses existing Help architecture. No CMS. No second engines.
 * Localhost only. Does not create production support tickets.
 */
import { expect, test, type Page } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./helpers/auth";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;
const SELLER = FULL_DEMO_ACCOUNTS[1]!;

const BUSINESS_LEAKS = [
  "Storefront tips for sellers",
  "Present a clear public store",
  "Your public store or profile shows listings",
];

const LEGACY_LEAKS = [
  "Property listings and enquiries",
  "Job listings and applications",
  "Find parts by vehicle identification number",
  "Bulk orders and trade",
];

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
  narrow: { width: 320, height: 693 },
} as const;

const SHARED_ROUTES = [
  "/help",
  "/help/category/buyer",
  "/help/category/safety",
  "/help/payments-checkout",
  "/help/faq",
  "/legal",
  "/legal/privacy-policy",
  "/about",
  "/support",
] as const;

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (/Failed to load resource|net::ERR_|favicon/i.test(text)) return;
      errors.push(text);
    }
  });
  return errors;
}

async function acceptCookies(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
    } catch {
      /* ignore */
    }
  });
  const accept = page.getByRole("button", { name: /^Accept$/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflowPx = await page.evaluate(
    () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflowPx, "horizontal overflow must be 0").toBeLessThanOrEqual(1);
}

async function assertNoLeaks(page: Page, needles: readonly string[]) {
  const html = await page.content();
  const title = await page.title();
  const description =
    (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
  const ogTitle = (await page.locator('meta[property="og:title"]').getAttribute("content")) ?? "";
  const ogDescription =
    (await page.locator('meta[property="og:description"]').getAttribute("content")) ?? "";
  const twitterTitle =
    (await page.locator('meta[name="twitter:title"]').getAttribute("content")) ?? "";
  const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
    "\n",
  );
  const haystack = [html, title, description, ogTitle, ogDescription, twitterTitle, jsonLd].join(
    "\n",
  );
  for (const needle of needles) {
    expect(haystack, `leak: ${needle}`).not.toContain(needle);
  }
}

async function signIn(page: Page, account: { email: string; password?: string }, baseURL: string) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await signInWithSessionCookies(page, {
    email: account.email,
    password: account.password ?? "",
    baseURL,
  });
  await acceptCookies(page);
}

async function openHelpSearch(page: Page, query: string) {
  const search = page.getByRole("searchbox", { name: /search help/i }).first();
  await expect(search).toBeVisible();
  await search.fill(query);
}

test.describe("Help Step 3 E2E — guest", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`guest ${name} surfaces + overflow`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.setViewportSize(viewport);
      for (const path of SHARED_ROUTES) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await acceptCookies(page);
        await expect(page.locator("body")).not.toHaveText(/^\s*$/);
        await assertNoHorizontalOverflow(page);
      }
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }

  test("guest Help IA, search, legal aliases, about, privacy split", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await acceptCookies(page);
    await expect(page.getByRole("link", { name: /^Buying\b/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Privacy Policy\b/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Privacy Settings\b/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^About ROVEXO\b/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Contact Support\b/i })).toBeVisible();
    await expect(page.getByText("Business storefront")).toHaveCount(0);

    await openHelpSearch(page, "Seller Fee");
    await expect(page.getByRole("heading", { name: /search results/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Storefront tips for sellers");

    await openHelpSearch(page, "property rent");
    await expect(page.locator("body")).not.toContainText("Property listings and enquiries");

    await openHelpSearch(page, "Privacy Settings");
    await expect(page.getByRole("link", { name: /Privacy/i }).first()).toBeVisible();

    await openHelpSearch(page, "Contact Support");
    await expect(page.getByRole("link", { name: /Contact Support/i }).first()).toBeVisible();

    await page.goto("/help/business-storefront-tips", { waitUntil: "domcontentloaded" });
    await assertNoLeaks(page, BUSINESS_LEAKS);
    expect(await page.title()).not.toMatch(/Storefront tips/i);

    for (const path of [
      "/help/category/property",
      "/help/category/jobs",
      "/help/category/vin-search",
      "/help/category/wholesale",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await assertNoLeaks(page, LEGACY_LEAKS);
    }

    for (const [path, expectUrl, heading] of [
      ["/privacy", /\/legal\/privacy-policy/, /Privacy Policy/i],
      ["/terms", /\/legal\/terms-and-conditions/, /Terms/i],
      ["/cookies", /\/legal\/cookie-policy/, /Cookie/i],
      ["/fees", /\/legal\/platform-fee-policy/, /Platform Fee/i],
      ["/gdpr", /\/legal\/gdpr-data-rights/, /GDPR|data rights/i],
      ["/legal/privacy-policy", /\/legal\/privacy-policy/, /Privacy Policy/i],
    ] as const) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const url = page.url();
      if (!expectUrl.test(url)) {
        await expect(page.getByText(heading).first()).toBeVisible();
      }
    }

    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /About ROVEXO/i }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("million");
    for (const href of [
      "/help",
      "/legal/privacy-policy",
      "/account/privacy",
      "/support",
      "/legal/buyer-protection",
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    const guestSupport = await page.request.post("/api/support", {
      data: { category: "account", subject: "Guest", description: "Should not create a ticket." },
    });
    expect(guestSupport.status()).toBe(401);

    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).not.toContain("/help/business-storefront-tips");
  });

  test("guest keyboard search label + breadcrumb", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await acceptCookies(page);
    await page.keyboard.press("Tab");
    const search = page.getByRole("searchbox", { name: /search help/i }).first();
    await search.focus();
    await expect(search).toBeFocused();
    await page.goto("/help/payments-checkout", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
  });
});

test.describe("Help Step 3 E2E — Individual", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  test("Individual flow excludes Business-only content", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    const errors = collectPageErrors(page);
    await page.setViewportSize(VIEWPORTS.desktop);
    await signIn(page, BUYER, baseURL!);

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /^Buying\b/i })).toBeVisible();
    await expect(page.getByText("Business storefront")).toHaveCount(0);

    await page.getByRole("link", { name: /^Buying\b/i }).click();
    await expect(page).toHaveURL(/\/help\/category\/buyer/);
    await page.goto("/help/payments-checkout", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Seller Fee is £0/i)).toBeVisible();

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await openHelpSearch(page, "storefront");
    await expect(page.locator("body")).not.toContainText("Storefront tips for sellers");

    await page.goto("/help/faq", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("searchbox", { name: /search faqs/i }).first()).toBeVisible();

    await page.goto("/legal", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Privacy Settings/i }).first()).toBeVisible();
    await page.goto("/legal/privacy-policy", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/legal\/privacy-policy/);

    await page.goto("/account/privacy", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/account\/privacy/);
    await expect(page.locator("body")).not.toContainText("Storefront tips for sellers");

    await page.goto("/help/category/safety", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Safety/i }).first()).toBeVisible();
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Contact Support/i }).first()).toBeVisible();
    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel(/^Category$/i)).toBeVisible();
    const invalid = await page.request.post("/api/support", {
      data: { category: "not_a_category", subject: "Nope", description: "Invalid category probe." },
    });
    expect(invalid.status()).toBe(400);

    await page.goto("/help/business-storefront-tips", { waitUntil: "domcontentloaded" });
    await assertNoLeaks(page, BUSINESS_LEAKS);
    expect(await page.title()).not.toMatch(/Storefront tips/i);

    for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.narrow]) {
      await page.setViewportSize(viewport);
      await page.goto("/help", { waitUntil: "domcontentloaded" });
      await assertNoHorizontalOverflow(page);
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Help Step 3 E2E — Business + switch", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  test("Business can open storefront article and switch hides it", async ({ page, baseURL }) => {
    test.skip(!baseURL, "baseURL required");
    const errors = collectPageErrors(page);
    await page.setViewportSize(VIEWPORTS.desktop);
    const dismissAccountOverlays = async () => {
      const later = page.getByRole("button", { name: /Maybe Later/i });
      if (await later.isVisible().catch(() => false)) {
        await later.click();
      }
    };
    const tryAccount = async (account: { email: string; password?: string }) => {
      await signIn(page, account, baseURL!);
      await page.goto("/account", { waitUntil: "domcontentloaded" });
      await dismissAccountOverlays();
      const actionButton = page.getByRole("button", {
        name: /Upgrade to Business|Switch to Business|Switch to Individual/i,
      });
      const actionLink = page.getByRole("link", { name: /Upgrade to Business/i });
      await expect(actionButton.or(actionLink).first()).toBeVisible({ timeout: 30_000 });
      const actionEl = page.locator("[data-profile-business-action]").first();
      if ((await actionEl.count()) > 0) {
        return actionEl.getAttribute("data-profile-business-action");
      }
      if (await actionLink.isVisible().catch(() => false)) return "upgrade";
      const label = ((await actionButton.first().getAttribute("aria-label")) ?? "").toLowerCase();
      if (label.includes("individual")) return "switch-to-individual";
      if (label.includes("business") && label.includes("switch")) return "switch-to-business";
      return "upgrade";
    };

    const action = await tryAccount(SELLER);
    if (action === "upgrade") {
      test.info().annotations.push({
        type: "blocked",
        description:
          "Full Demo seller Profile shows Upgrade to Business — real Individual↔Business switch is unavailable until Business onboarding is complete.",
      });
      test.skip(true, "Real switch UI unavailable: demo.seller shows Upgrade to Business.");
    }

    if (action === "switch-to-business") {
      await page.getByRole("button", { name: /Switch to Business/i }).click();
      await page.waitForURL(/\/business|\/account/, { timeout: 30_000 });
    }

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Business storefront/i })).toBeVisible();
    await page.getByRole("link", { name: /Business storefront/i }).click();
    await expect(page).toHaveURL(/\/help\/business-storefront-tips/);
    await expect(page.getByText(/Storefront tips for sellers/i).first()).toBeVisible();

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await openHelpSearch(page, "storefront");
    await expect(page.getByRole("link", { name: /Storefront tips/i }).first()).toBeVisible();

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-profile-business-action='switch-to-individual']")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /Switch to Individual/i }).click();
    await page.waitForURL(/\/account/, { timeout: 30_000 });

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Business storefront")).toHaveCount(0);
    await openHelpSearch(page, "storefront");
    await expect(page.locator("body")).not.toContainText("Storefront tips for sellers");
    await page.goto("/help/business-storefront-tips", { waitUntil: "domcontentloaded" });
    await assertNoLeaks(page, BUSINESS_LEAKS);

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-profile-business-action='switch-to-business']")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /Switch to Business/i }).click();
    await page.waitForURL(/\/business|\/account/, { timeout: 30_000 });
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Business storefront/i })).toBeVisible();

    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel(/^Category$/i)).toBeVisible();
    const invalid = await page.request.post("/api/support", {
      data: { category: "not_a_category", subject: "Nope", description: "Invalid category probe." },
    });
    expect(invalid.status()).toBe(400);

    for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.narrow]) {
      await page.setViewportSize(viewport);
      await page.goto("/help", { waitUntil: "domcontentloaded" });
      await assertNoHorizontalOverflow(page);
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
