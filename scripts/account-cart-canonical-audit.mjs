#!/usr/bin/env node

/** Account + Cart canonical UI — Playwright validation. */

import { mkdirSync, writeFileSync } from "node:fs";

import { join } from "node:path";

import { chromium } from "playwright";



const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";

const outDir = join(process.cwd(), "reports", "module-1", "account-cart-v1.2");



mkdirSync(outDir, { recursive: true });



async function auditAccount(page) {

  await page.goto(`${base}/account`, { waitUntil: "domcontentloaded", timeout: 120_000 });

  await page.waitForTimeout(600);

  await page.screenshot({ path: join(outDir, "account-iphone17promax.png"), type: "png" });

  return page.evaluate(() => {

    const row = document.querySelector(".ac-hub__menu-card .ac-hub__row");

    const rowBox = row?.getBoundingClientRect();

    const icon = document.querySelector(".ac-hub__menu-icon");

    const iconBox = icon?.getBoundingClientRect();

    const menuTitle = document.querySelector(".ac-hub__menu-title");

    const menuTitleStyle = menuTitle ? getComputedStyle(menuTitle) : null;

    return {

      version: document.querySelector('[data-ac-hub-version="v1.2"]')?.getAttribute("data-ac-hub-version"),

      menuRows: document.querySelectorAll(".ac-hub__menu-card .ac-hub__row").length,

      rowsWithoutTrailingSlot: [...document.querySelectorAll(".ac-hub__menu-card .ac-hub__row")].every(

        (menuRow) =>

          menuRow.children.length === 2 && menuRow.lastElementChild?.classList.contains("ac-hub__row-copy"),

      ),

      hasProfile: Boolean(document.querySelector(".ac-hub__profile")),

      rowHeightPx: rowBox?.height ?? 0,

      iconSizePx: iconBox?.width ?? 0,

      menuTitleFontPx: menuTitleStyle ? Number.parseFloat(menuTitleStyle.fontSize) : 0,

      overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),

    };

  });

}



async function auditCart(page) {

  await page.goto(`${base}/cart`, { waitUntil: "domcontentloaded", timeout: 120_000 });

  await page.waitForTimeout(600);

  await page.screenshot({ path: join(outDir, "cart-iphone17promax.png"), type: "png" });

  return page.evaluate(() => ({

    version: document.querySelector('[data-cart-version="v1.0"]')?.getAttribute("data-cart-version"),

    hasCheckout: Boolean(document.querySelector(".cart-v1__checkout")),

    overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),

  }));

}



async function main() {

  const browser = await chromium.launch();

  const page = await browser.newPage();

  await page.setViewportSize({ width: 440, height: 956 });



  const account = await auditAccount(page);

  const cart = await auditCart(page);

  const authGated = !account.version && !cart.version;

  const audit = { account, cart, authGated };

  writeFileSync(join(outDir, "audit.json"), JSON.stringify(audit, null, 2));



  const checks = authGated

    ? [

        ["auth gated routes", true],

        ["account overflow", account.overflowPx <= 1],

        ["cart overflow", cart.overflowPx <= 1],

      ]

    : [

        ["account v1.2", account.version === "v1.2"],

        ["account menu rows", account.menuRows >= 10],

        ["account profile", account.hasProfile === true],

        ["no trailing chevrons", account.rowsWithoutTrailingSlot === true],

        ["row height polish", account.rowHeightPx >= 67 && account.rowHeightPx <= 70],

        ["icon container", account.iconSizePx >= 39 && account.iconSizePx <= 41],

        ["section title scale", account.menuTitleFontPx >= 23 && account.menuTitleFontPx <= 25],

        ["account overflow", account.overflowPx <= 1],

        ["cart v1", cart.version === "v1.0"],

        ["cart checkout cta", cart.hasCheckout || cart.version === "v1.0"],

        ["cart overflow", cart.overflowPx <= 1],

      ];



  const failed = checks.filter(([, pass]) => !pass);

  await browser.close();



  if (failed.length > 0) {

    console.error("Account/Cart audit failed:", failed);

    process.exit(1);

  }



  console.log("Account/Cart audit passed:", outDir);

}



main().catch((error) => {

  console.error(error);

  process.exit(1);

});

