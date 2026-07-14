import { test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { settleUi, waitForHomepageUi } from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots", "phase1");
const PAGES_DIR = join(OUT, "pages");

type Device = { id: string; label: string; width: number; height: number };
type Theme = "light";

const DEVICES: Device[] = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
];

const THEMES: Theme[] = ["light"];

const PAGES = [
  { id: "homepage", label: "Homepage", path: "/" },
  { id: "categories", label: "Categories", path: "/categories" },
  { id: "dashboard", label: "Dashboard", path: "/account" },
  { id: "sell", label: "Sell", path: "/sell" },
  { id: "wallet", label: "Wallet", path: "/account/wallet" },
  { id: "orders", label: "Orders", path: "/orders" },
] as const;

type ManifestEntry = {
  file: string;
  id: string;
  label: string;
  device: string;
  deviceLabel: string;
  theme: Theme;
};

const manifest: ManifestEntry[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(PAGES_DIR, { recursive: true });
});

test.afterAll(() => {
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
});

async function prepare(page: Page, theme: Theme, device: Device) {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.emulateMedia({ colorScheme: theme });
  if (theme === "dark") {
    await page.addInitScript(() => {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.classList.add("dark");
    });
  } else {
    await page.addInitScript(() => {
      document.documentElement.dataset.theme = "light";
      document.documentElement.classList.remove("dark");
    });
  }
}

for (const pageDef of PAGES) {
  for (const device of DEVICES) {
    for (const theme of THEMES) {
      test(`phase1 — ${pageDef.label} — ${device.label} — ${theme}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Phase 1 review uses Chromium only");

        const filename = `${pageDef.id}__${device.id}__${theme}.png`;
        const filePath = join(PAGES_DIR, filename);

        await prepare(page, theme, device);
        await page.goto(pageDef.path, { waitUntil: "domcontentloaded" });
        if (pageDef.id === "homepage") await waitForHomepageUi(page);
        await settleUi(page, 600);

        await page.screenshot({ path: filePath, fullPage: true, animations: "disabled", caret: "hide" });

        manifest.push({
          file: `pages/${filename}`,
          id: pageDef.id,
          label: pageDef.label,
          device: device.id,
          deviceLabel: device.label,
          theme,
        });
      });
    }
  }
}
