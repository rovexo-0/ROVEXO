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

  await page.goto("http://localhost:3000/preview/ui-internal-16px", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  const internal = await page.evaluate(() => {
    const el = document.querySelector(".cds-layout__content--account-canonical");
    const cs = el ? getComputedStyle(el) : null;
    return {
      pad: localStorage.getItem("rovexo_run4_internal_pad"),
      pl: cs ? Math.round(parseFloat(cs.paddingLeft)) : null,
      toggle: Boolean(document.querySelector("[data-run4-preview-chrome]")),
    };
  });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const home = await page.evaluate(() => {
    const chrome = document.querySelector("[data-run4-preview-chrome]")?.textContent ?? "";
    const attr = document.documentElement.getAttribute("data-run4-internal-pad");
    return { chrome, attr, locked: /Homepage LOCKED/i.test(chrome) };
  });

  console.log(JSON.stringify({ internal, home }));
  const ok = internal.pl === 16 && internal.toggle && home.locked && home.attr === null;
  console.log(ok ? "RUN4_LIVE_PASS" : "RUN4_LIVE_FAIL");
  await browser.close();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
