import { test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveListingSlugForE2E } from "./helpers/listing-slug";
import {
  openSearchOverlay,
  settleUi,
  waitForHomepageUi,
  waitForSearchResultsUi,
  waitForSearchSuggestions,
} from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots");
const PAGES_DIR = join(OUT, "pages");
const INTERACTIONS_DIR = join(OUT, "interactions");

type Device = { id: string; label: string; width: number; height: number };
type Theme = "light" | "dark";

const DEVICES: Device[] = [
  { id: "desktop-1920", label: "Desktop 1920px", width: 1920, height: 1080 },
  { id: "laptop-1440", label: "Laptop 1440px", width: 1440, height: 900 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
];

const THEMES: Theme[] = ["light", "dark"];

type PageDef = { id: string; label: string; path: string | ((slug: string) => string) };

const MAJOR_PAGES: PageDef[] = [
  { id: "homepage", label: "Homepage", path: "/" },
  { id: "search", label: "Search", path: "/search?q=phone" },
  { id: "categories", label: "Categories", path: "/categories" },
  { id: "browse", label: "Browse", path: "/category/home-garden/furniture/beds" },
  { id: "product-details", label: "Product Details", path: (slug) => `/listing/${slug}` },
  { id: "sell-item", label: "Sell Item", path: "/sell" },
  { id: "seller-dashboard", label: "Seller Dashboard", path: "/seller/dashboard" },
  { id: "buyer-dashboard", label: "Buyer Dashboard", path: "/account" },
  { id: "wallet", label: "Wallet", path: "/account/wallet" },
  { id: "orders", label: "Orders", path: "/orders" },
  { id: "shipping", label: "Shipping", path: "/account/seller/shipping" },
  { id: "resolution-centre", label: "Resolution Centre", path: "/resolution" },
  { id: "notifications", label: "Notifications", path: "/notifications" },
  { id: "messages", label: "Messages", path: "/messages" },
  { id: "account", label: "Account", path: "/account/profile" },
  { id: "settings", label: "Settings", path: "/settings" },
  { id: "admin-dashboard", label: "Admin Dashboard", path: "/admin" },
  { id: "super-admin-dashboard", label: "Super Admin Dashboard", path: "/super-admin" },
];

type ShotMeta = {
  file: string;
  section: "pages" | "interactions";
  id: string;
  label: string;
  device: string;
  deviceLabel: string;
  theme: Theme;
  category: string;
};

const manifest: ShotMeta[] = [];
let listingSlug = "";
let listingCleanup: (() => Promise<void>) | undefined;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  mkdirSync(PAGES_DIR, { recursive: true });
  mkdirSync(INTERACTIONS_DIR, { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();
  const resolved = await resolveListingSlugForE2E(page.request, page);
  listingSlug = resolved.slug;
  listingCleanup = resolved.cleanup;
  await context.close();
});

test.afterAll(async () => {
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  if (listingCleanup) await listingCleanup();
});

async function preparePage(page: Page, theme: Theme, device: Device): Promise<void> {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.emulateMedia({ colorScheme: theme });
}

async function capture(
  page: Page,
  section: "pages" | "interactions",
  id: string,
  label: string,
  device: Device,
  theme: Theme,
  category: string,
  captureFn: () => Promise<void>,
): Promise<void> {
  const filename = `${id}__${device.id}__${theme}.png`;
  const dir = section === "pages" ? PAGES_DIR : INTERACTIONS_DIR;
  const filePath = join(dir, filename);
  const rel = `${section}/${filename}`;

  await captureFn();
  await settleUi(page, 500);
  await page.screenshot({ path: filePath, fullPage: true, animations: "disabled", caret: "hide" });

  manifest.push({
    file: rel,
    section,
    id,
    label,
    device: device.id,
    deviceLabel: device.label,
    theme,
    category,
  });
}

function pagePath(def: PageDef): string {
  return typeof def.path === "function" ? def.path(listingSlug) : def.path;
}

for (const pageDef of MAJOR_PAGES) {
  for (const device of DEVICES) {
    for (const theme of THEMES) {
      test(`page — ${pageDef.label} — ${device.label} — ${theme}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Owner visual review uses Chromium only");

        await preparePage(page, theme, device);
        await capture(page, "pages", pageDef.id, pageDef.label, device, theme, "Major Pages", async () => {
          await page.goto(pagePath(pageDef), { waitUntil: "domcontentloaded" });
          if (pageDef.id === "homepage") await waitForHomepageUi(page);
          if (pageDef.id === "search") await waitForSearchResultsUi(page);
        });
      });
    }
  }
}

const INTERACTION_DEVICES = DEVICES.filter((d) =>
  ["desktop-1920", "iphone", "android"].includes(d.id),
);

type InteractionDef = {
  id: string;
  label: string;
  run: (page: Page) => Promise<void>;
};

const INTERACTIONS: InteractionDef[] = [
  {
    id: "homepage-loaded",
    label: "Homepage",
    run: async (page) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);
    },
  },
  {
    id: "search-focused",
    label: "Search Focused",
    run: async (page) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);
      await openSearchOverlay(page);
    },
  },
  {
    id: "search-results",
    label: "Search Results",
    run: async (page) => {
      await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
      await waitForSearchResultsUi(page);
    },
  },
  {
    id: "category-selected",
    label: "Category Selected",
    run: async (page) => {
      await page.goto("/category/home-garden/furniture/beds", { waitUntil: "domcontentloaded" });
      await settleUi(page, 800);
    },
  },
  {
    id: "product-hover",
    label: "Product Hover",
    run: async (page) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);
      const card = page.locator('[data-listing-card-version="rovexo-v1"]').first();
      if ((await card.count()) > 0) {
        await card.hover();
      }
    },
  },
  {
    id: "product-opened",
    label: "Product Opened",
    run: async (page) => {
      await page.goto(`/listing/${listingSlug}`, { waitUntil: "domcontentloaded" });
      await settleUi(page, 1000);
    },
  },
  {
    id: "sell-page-filled",
    label: "Sell Page Filled",
    run: async (page) => {
      await page.goto("/sell/new", { waitUntil: "domcontentloaded" });
      const title = page.getByPlaceholder("Listing title");
      if (await title.isVisible().catch(() => false)) {
        await title.fill("Premium ROVEXO Visual Review Sample Listing");
      }
      await settleUi(page, 400);
    },
  },
  {
    id: "wallet-view",
    label: "Wallet",
    run: async (page) => {
      await page.goto("/account/wallet", { waitUntil: "domcontentloaded" });
    },
  },
  {
    id: "orders-view",
    label: "Orders",
    run: async (page) => {
      await page.goto("/orders", { waitUntil: "domcontentloaded" });
    },
  },
  {
    id: "resolution-view",
    label: "Resolution Centre",
    run: async (page) => {
      await page.goto("/resolution", { waitUntil: "domcontentloaded" });
    },
  },
  {
    id: "notifications-view",
    label: "Notifications",
    run: async (page) => {
      await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    },
  },
  {
    id: "admin-view",
    label: "Admin Dashboard",
    run: async (page) => {
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
    },
  },
];

for (const interaction of INTERACTIONS) {
  for (const device of INTERACTION_DEVICES) {
    for (const theme of THEMES) {
      test(`interaction — ${interaction.label} — ${device.label} — ${theme}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Owner visual review uses Chromium only");

        await preparePage(page, theme, device);
        await capture(
          page,
          "interactions",
          interaction.id,
          interaction.label,
          device,
          theme,
          "Interactions",
          async () => interaction.run(page),
        );
      });
    }
  }
}

test("search suggestions overlay", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Owner visual review uses Chromium only");

  const device = DEVICES.find((d) => d.id === "iphone")!;
  await preparePage(page, "light", device);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepageUi(page);
  await openSearchOverlay(page);
  await waitForSearchSuggestions(page, "iphone");
  await capture(page, "interactions", "search-suggestions", "Search Suggestions", device, "light", "Interactions", async () => {});
});
