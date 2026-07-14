import { test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveListingSlugForE2E } from "./helpers/listing-slug";
import { settleUi, waitForHomepageUi, waitForSearchResultsUi } from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots");
const PAGES_DIR = join(OUT, "pages");

type Device = { id: string; label: string; width: number; height: number };
type Theme = "light";

const DEVICES: Device[] = [
  { id: "desktop", label: "Desktop", width: 1920, height: 1080 },
  { id: "laptop", label: "Laptop", width: 1440, height: 900 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
];

const THEMES: Theme[] = ["light"];

const PAGES = [
  { id: "homepage", label: "Homepage", path: "/" },
  { id: "browse", label: "Browse", path: "/category/home-garden/furniture/beds" },
  { id: "search", label: "Search", path: "/search?q=phone" },
  { id: "categories", label: "Categories", path: "/categories" },
  { id: "product-details", label: "Product Details", path: (slug: string) => `/listing/${slug}` },
  { id: "sell-item", label: "Sell Item", path: "/sell" },
  { id: "seller-dashboard", label: "Seller Dashboard", path: "/seller" },
  { id: "buyer-dashboard", label: "Buyer Dashboard", path: "/buyer" },
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
] as const;

type ManifestEntry = {
  file: string;
  id: string;
  label: string;
  device: string;
  deviceLabel: string;
  theme: Theme;
  path: string;
};

const manifest: ManifestEntry[] = [];
let listingSlug = "";
let listingCleanup: (() => Promise<void>) | undefined;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  mkdirSync(PAGES_DIR, { recursive: true });
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

function resolvePath(pageDef: (typeof PAGES)[number]): string {
  return typeof pageDef.path === "function" ? pageDef.path(listingSlug) : pageDef.path;
}

async function prepare(page: Page, theme: Theme, device: Device): Promise<void> {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.emulateMedia({ colorScheme: theme });
}

for (const pageDef of PAGES) {
  for (const device of DEVICES) {
    for (const theme of THEMES) {
      test(`gallery — ${pageDef.label} — ${device.label} — ${theme}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Owner review gallery uses Chromium only");

        const filename = `${pageDef.id}__${device.id}__${theme}.png`;
        const filePath = join(PAGES_DIR, filename);
        const route = resolvePath(pageDef);

        await prepare(page, theme, device);
        await page.goto(route, { waitUntil: "domcontentloaded" });
        if (pageDef.id === "homepage") await waitForHomepageUi(page);
        if (pageDef.id === "search") await waitForSearchResultsUi(page);
        await settleUi(page, 600);
        await page.screenshot({ path: filePath, fullPage: true, animations: "disabled", caret: "hide" });

        manifest.push({
          file: `pages/${filename}`,
          id: pageDef.id,
          label: pageDef.label,
          device: device.id,
          deviceLabel: device.label,
          theme,
          path: route,
        });
      });
    }
  }
}
