import { chromium } from "@playwright/test";
import { signInWithSessionCookies } from "../e2e/helpers/auth";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 440, height: 956 } })
  ).newPage();
  await page.addInitScript(() => localStorage.setItem("rovexo_cookie_consent_v1", "accepted"));
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await signInWithSessionCookies(page, {
    email: "demo.buyer@rovexo.co.uk",
    password: "RovexoBuyer@2026",
    baseURL: "http://localhost:3000",
  });
  await page.goto("http://localhost:3000/preview/ui-12px", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  const probe = await page.evaluate(() => {
    const content = document.querySelector(".cds-layout__content--account-canonical");
    const cs = content ? getComputedStyle(content) : null;
    return {
      active: localStorage.getItem("rovexo_run3_preview_active"),
      pad: localStorage.getItem("rovexo_run3_preview_pad"),
      attr: document.documentElement.getAttribute("data-run3-ui-compare"),
      pl: cs ? Math.round(parseFloat(cs.paddingLeft)) : null,
      toggle: Boolean(document.querySelector("[data-run3-preview-chrome]")),
    };
  });
  console.log("12px", JSON.stringify(probe));
  await page.getByRole("button", { name: "24px", exact: true }).click();
  await page.waitForTimeout(500);
  const probe2 = await page.evaluate(() => {
    const content = document.querySelector(".cds-layout__content--account-canonical");
    const cs = content ? getComputedStyle(content) : null;
    return {
      pad: localStorage.getItem("rovexo_run3_preview_pad"),
      attr: document.documentElement.getAttribute("data-run3-ui-compare"),
      pl: cs ? Math.round(parseFloat(cs.paddingLeft)) : null,
    };
  });
  console.log("24px", JSON.stringify(probe2));
  const ok = probe.pl === 12 && probe2.pl === 24 && probe.toggle;
  console.log(ok ? "LIVE_PREVIEW_PASS" : "LIVE_PREVIEW_FAIL");
  await browser.close();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
