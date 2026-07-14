import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { settleUi, waitForHomepageUi } from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots");

const PAGES = [
  { name: "homepage", path: "/" },
  { name: "search", path: "/search?q=phone" },
  { name: "categories", path: "/categories" },
  { name: "sell", path: "/sell" },
  { name: "login", path: "/login" },
  { name: "orders", path: "/orders" },
  { name: "wallet", path: "/account/wallet" },
  { name: "resolution", path: "/resolution" },
  { name: "notifications", path: "/notifications" },
  { name: "account", path: "/account" },
  { name: "seller-dashboard", path: "/seller" },
  { name: "admin", path: "/admin" },
  { name: "super-admin", path: "/super-admin" },
  { name: "auctions", path: "/auctions" },
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 800 },
  { label: "mobile", width: 390, height: 844 },
];

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(OUT, { recursive: true });
});

for (const viewport of VIEWPORTS) {
  for (const theme of ["light"] as const) {
    for (const pageDef of PAGES) {
      test(`owner review — ${pageDef.name} — ${viewport.label} — ${theme}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Owner review screenshots use Chromium only");

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(pageDef.path, { waitUntil: "domcontentloaded" });

        if (pageDef.path === "/") {
          await waitForHomepageUi(page);
        }

        await settleUi(page);
        await page.screenshot({
          path: join(OUT, `${pageDef.name}-${viewport.label}-${theme}.png`),
          fullPage: true,
        });
      });
    }
  }
}
