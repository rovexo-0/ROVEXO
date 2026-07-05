import { test } from "@playwright/test";

test("home ui shot", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);

  const nav = page.locator('[data-bottom-nav="2026"]');
  await nav.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await nav.screenshot({ path: "test-results/home-bottom-nav.png" }).catch((e) => console.log("nav shot fail", e.message));

  const rail = page.locator('[aria-label="Categories"]').first();
  await rail.screenshot({ path: "test-results/home-category-rail.png" }).catch((e) => console.log("rail shot fail", e.message));

  await page.screenshot({ path: "test-results/home-full.png" });

  const items = await page.$$eval('[data-bottom-nav="2026"] .rx-bottom-nav-item', (els) =>
    els.map((el) => {
      const label = el.querySelector(".rx-bottom-nav-item__label")?.textContent ?? "";
      const img = el.querySelector("img") as HTMLImageElement | null;
      const svg = el.querySelector("svg");
      return {
        label,
        active: el.getAttribute("data-active"),
        imgSrc: img?.getAttribute("src") ?? null,
        imgCurrent: img?.currentSrc ?? null,
        imgW: img ? getComputedStyle(img).width : null,
        hasSvg: Boolean(svg),
      };
    }),
  );
  console.log("NAV_ITEMS", JSON.stringify(items, null, 2));
  console.log("shots done");
});
