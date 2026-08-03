/**
 * Live homepage grid blank-slot diagnostic.
 * Run: node scripts/diagnose-homepage-blank-slot.mjs
 */
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadEnv();

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const EMAIL = "demo.buyer@rovexo.co.uk";
const PASSWORD = "RovexoBuyer@2026";

async function main() {
  const pending = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => pending.map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          for (const c of cookiesToSet) {
            const i = pending.findIndex((e) => e.name === c.name);
            if (i >= 0) pending[i] = c;
            else pending.push(c);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error) throw new Error(`sign-in failed: ${error.message}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const { hostname } = new URL(BASE);
  await page.context().addCookies(
    pending.map((c) => {
      const raw = String(c.options?.sameSite || "lax").toLowerCase();
      const sameSite = raw === "strict" ? "Strict" : raw === "none" ? "None" : "Lax";
      return {
        name: c.name,
        value: c.value,
        domain: hostname,
        path: c.options?.path || "/",
        httpOnly: c.options?.httpOnly ?? true,
        secure: c.options?.secure ?? false,
        sameSite,
      };
    }),
  );

  const feedRes = await page.request.get(`${BASE}/api/homepage/feed?page=1`);
  const feed = await feedRes.json();
  console.log(
    "FEED",
    JSON.stringify({
      count: feed.items?.length,
      hasMore: feed.hasMore,
      titles: feed.items?.map((i) => i.title),
    }),
  );

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  // Dismiss cookie banner so it cannot mask the last row.
  const reject = page.getByRole("button", { name: /reject|decline|essential/i });
  const accept = page.getByRole("button", { name: /accept/i });
  if (await reject.count()) await reject.first().click().catch(() => {});
  else if (await accept.count()) await accept.first().click().catch(() => {});
  await page.waitForTimeout(1500);
  console.log("PAGE_URL", page.url());

  const report = await page.evaluate(() => {
    const grid = document.querySelector('[data-homepage-listing-container="grid"]');
    if (!grid) {
      return { error: "NO_GRID", bodyText: document.body.innerText.slice(0, 800) };
    }
    const children = Array.from(grid.children);
    const childReports = children.map((el, index) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const img = el.querySelector("img");
      return {
        index,
        tag: el.tagName,
        className: String(el.className || "").slice(0, 140),
        dataListingCard: el.getAttribute("data-listing-card"),
        dataSkeleton: el.getAttribute("data-listing-card-skeleton"),
        ariaLabel:
          el.getAttribute("aria-label") ||
          el.querySelector("[aria-label]")?.getAttribute("aria-label") ||
          null,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        gridRow: cs.gridRow,
        gridColumn: cs.gridColumn,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 100),
        hasImg: Boolean(img),
        imgNatural: img ? img.naturalWidth : 0,
        imgSrc: img?.currentSrc?.slice(0, 120) || null,
      };
    });

    const gridCs = getComputedStyle(grid);
    const gridRect = grid.getBoundingClientRect();
    const cols = Number(gridCs.getPropertyValue("--hp-grid-cols").trim() || "2") || 2;
    const cards = childReports.filter((c) => c.dataListingCard === "rovexo");
    const last = cards[cards.length - 1];
    const gap = 12;
    const expectedHalf = Math.round((gridRect.width - gap) / 2);
    const emptyRightWidth = last ? Math.round(gridRect.right - (last.left + last.width)) : 0;
    const visibleCards = cards.filter(
      (c) => c.visibility === "visible" && Number(c.opacity) > 0 && c.width > 8 && c.height > 8,
    );
    const nonCardChildren = childReports.filter(
      (c) => c.dataListingCard !== "rovexo" && !c.dataSkeleton,
    );
    const skeletonCount = childReports.filter((c) => c.dataSkeleton).length;
    // Diagnostic only — do NOT treat incomplete last-row geometry as a "fix".
    const phantomGridChild = nonCardChildren.length > 0 || skeletonCount > 0;
    const countsMismatch =
      cards.length !== children.length || cards.length !== visibleCards.length;
    const incompleteLastRow =
      cards.length > 0 && cards.length % cols !== 0 && emptyRightWidth > expectedHalf * 0.45;

    return {
      gridDisplay: gridCs.display,
      gridTemplateColumns: gridCs.gridTemplateColumns,
      gridColsVar: gridCs.getPropertyValue("--hp-grid-cols").trim(),
      gridWidth: Math.round(gridRect.width),
      gridHeight: Math.round(gridRect.height),
      childCount: children.length,
      listingCardCount: cards.length,
      visibleCardCount: visibleCards.length,
      skeletonCount,
      nonCardChildren,
      cols,
      lastGridColumn: last?.gridColumn ?? null,
      lastWidth: last?.width ?? null,
      expectedHalf,
      emptyRightWidth,
      phantomGridChild,
      countsMismatch,
      incompleteLastRow,
      children: childReports,
    };
  });

  console.log(JSON.stringify(report, null, 2));
  // Diagnostics only — never claim VERIFIED / FIXED from this script.
  if (report.error) {
    console.error("DIAG: NO_GRID");
    process.exitCode = 2;
  } else if (report.phantomGridChild) {
    console.error("DIAG: phantom non-ListingCard / skeleton child inside grid");
    process.exitCode = 2;
  } else if (report.countsMismatch) {
    console.error("DIAG: count mismatch (children / cards / visible)");
    process.exitCode = 2;
  } else if (report.incompleteLastRow) {
    console.log(
      "DIAG: no phantom grid child; incomplete last-row geometry present (odd count in 2-col grid). Not a UI workaround verdict.",
    );
  } else {
    console.log("DIAG: no phantom grid child; no incomplete last-row geometry.");
  }
  mkdirSync("test-results", { recursive: true });
  const shot = join("test-results", "homepage-blank-slot-diag.png");
  await page.screenshot({ path: shot, fullPage: true });
  console.log("SCREENSHOT", shot);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
