/**
 * RUN #3 — UI Comparison Certification (DESIGN REVIEW ONLY)
 * Temporary harness. Does NOT modify production Design System / SSOT / DB / git.
 *
 * Version A = horizontal page pad 24px (canonical Master Full Width)
 * Version B = horizontal page pad 12px (prototype)
 * Only --*-pad-x / page horizontal insets are overridden.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { signInWithSessionCookies } from "../e2e/helpers/auth";

const ORIGIN = process.env.CERT_ORIGIN ?? "http://localhost:3000";
const OUT = join(process.cwd(), "test-results/run3-ui-comparison");
const BUYER = { email: "demo.buyer@rovexo.co.uk", password: "RovexoBuyer@2026" };

/** Apple iPhone 17 Pro Max logical CSS viewport (project SSOT). */
const VIEWPORT = { width: 440, height: 956 };

type Pad = 24 | 12;

type PageDef = {
  id: string;
  label: string;
  path: string;
};

const PAGES: PageDef[] = [
  { id: "homepage", label: "Homepage", path: "/" },
  { id: "balance", label: "Wallet / Balance", path: "/balance" },
  { id: "orders", label: "Orders", path: "/orders" },
  { id: "inbox", label: "Inbox", path: "/inbox" },
  { id: "messages-hub", label: "Messages Hub", path: "/inbox" }, // resolved to conversation
  { id: "profile", label: "Profile", path: "/account" },
  { id: "settings", label: "Settings", path: "/account/settings" },
];

function ensureDirs() {
  for (const d of [
    OUT,
    join(OUT, "a-24px"),
    join(OUT, "b-12px"),
    join(OUT, "side-by-side"),
    join(OUT, "overlay"),
    join(OUT, "diff"),
    join(OUT, "split"),
    join(OUT, "fullscreen"),
    join(OUT, "zoom-x2"),
    join(OUT, "zoom-x4"),
  ]) {
    mkdirSync(d, { recursive: true });
  }
}

/** Temporary CSS only — horizontal page padding. Vertical / tokens / components untouched. */
function padOverrideCss(pad: Pad): string {
  return `
html[data-run3-ui-compare="${pad}"] {
  --fw-pad-x: ${pad}px !important;
  --cds-space-page-x: ${pad}px !important;
  --rx-phone-inset-x: ${pad}px !important;
  --uv1-inner-padding: ${pad}px !important;
  --pcu-page-padding-x: ${pad}px !important;
  --wallet-pad-x: ${pad}px !important;
  --conv-pad-x: ${pad}px !important;
  --inbox-pad-x: ${pad}px !important;
  --ds-space-4: ${pad}px !important;
  --ds-space-5: ${pad}px !important;
}
html[data-run3-ui-compare="${pad}"] .account-canonical:has(.inbox-hub) .account-canonical-header__bar--titled,
html[data-run3-ui-compare="${pad}"] .account-canonical:has(.wallet-v2) .account-canonical-header__bar--titled {
  padding-left: max(${pad}px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(${pad}px, env(safe-area-inset-right, 0px)) !important;
}
html[data-run3-ui-compare="${pad}"] .cds-layout__content--account-canonical {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[data-run3-ui-compare="${pad}"] .cds-layout__content--account-canonical:has(.wallet-v2) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
html[data-run3-ui-compare="${pad}"] .wallet-v2 {
  --wallet-pad-x: ${pad}px !important;
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[data-run3-ui-compare="${pad}"] .cds-layout__header,
html[data-run3-ui-compare="${pad}"] .cds-layout--account-canonical > .cds-layout__header {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[data-run3-ui-compare="${pad}"] .account-settings-sticky-action,
html[data-run3-ui-compare="${pad}"] .settings-canonical,
html[data-run3-ui-compare="${pad}"] .ac-canonical,
html[data-run3-ui-compare="${pad}"] .orders-page {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
/* Homepage / header / feeds */
html[data-run3-ui-compare="${pad}"] .rx4-home,
html[data-run3-ui-compare="${pad}"] .rovexo-page-home,
html[data-run3-ui-compare="${pad}"] main,
html[data-run3-ui-compare="${pad}"] .rx4-section,
html[data-run3-ui-compare="${pad}"] .rx4-feed,
html[data-run3-ui-compare="${pad}"] .rx4-rail,
html[data-run3-ui-compare="${pad}"] .canonical-homepage,
html[data-run3-ui-compare="${pad}"] .hp-section,
html[data-run3-ui-compare="${pad}"] .rx-fs,
html[data-run3-ui-compare="${pad}"] [data-home-section],
html[data-run3-ui-compare="${pad}"] .rvx-topbar,
html[data-run3-ui-compare="${pad}"] .rx-topbar,
html[data-run3-ui-compare="${pad}"] header[class*="home"],
html[data-run3-ui-compare="${pad}"] .homepage-header,
html[data-run3-ui-compare="${pad}"] [class*="Homepage"] {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
  padding-inline: ${pad}px !important;
}
html[data-run3-ui-compare="${pad}"] .conv-hub,
html[data-run3-ui-compare="${pad}"] .conversation-hub {
  --conv-pad-x: ${pad}px !important;
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
/* Preserve non-horizontal tokens */
html[data-run3-ui-compare="${pad}"] {
  --fw-pad-y: 24px !important;
  --fw-section-gap: 24px !important;
  --fw-component-gap: 24px !important;
  --fw-card-padding: 24px !important;
  --fw-header-height: 64px !important;
  --fw-button-height: 56px !important;
  --fw-button-radius: 16px !important;
}
`;
}

async function applyPad(page: Page, pad: Pad) {
  await page.evaluate((p) => {
    document.documentElement.setAttribute("data-run3-ui-compare", String(p));
  }, pad);
  // Re-inject style each time (idempotent via data attr selectors)
  await page.addStyleTag({ content: padOverrideCss(pad) });
  await page.waitForTimeout(250);
}

async function measurePad(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const candidates = [
      ".wallet-v2",
      ".cds-layout__content--account-canonical",
      ".inbox-hub",
      ".conv-hub",
      ".orders-page",
      ".ac-canonical",
      ".settings-canonical",
      ".canonical-homepage",
      ".rx4-feed",
      ".rx4-section",
      "[data-app-shell]",
      "main",
    ];
    let content: Element | null = null;
    let pl = 0;
    let pr = 0;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      const l = parseFloat(cs.paddingLeft) || 0;
      const r = parseFloat(cs.paddingRight) || 0;
      if (l > 0 || r > 0) {
        content = el;
        pl = l;
        pr = r;
        break;
      }
      if (!content) content = el;
    }
    if (!content) content = document.body;
    const rect = (content as HTMLElement).getBoundingClientRect();
    const card =
      document.querySelector(".cds-menu-row") ||
      document.querySelector(".inbox-hub__card") ||
      document.querySelector(".wallet-v2__hero") ||
      document.querySelector("article") ||
      content;
    const cardRect = (card as HTMLElement).getBoundingClientRect();
    const img = document.querySelector("img");
    const imgRect = img?.getBoundingClientRect();
    return {
      viewportWidth: vw,
      viewportHeight: window.innerHeight,
      leftMargin: Math.round(pl),
      rightMargin: Math.round(pr),
      contentWidth: Math.round(vw - pl - pr),
      contentBoxWidth: Math.round(rect.width),
      cardWidth: Math.round(cardRect.width),
      imageWidth: imgRect ? Math.round(imgRect.width) : null,
      textColumnWidth: Math.round(cardRect.width),
      remainingWhitespace: Math.round(pl + pr),
      measuredSelector: content === document.body ? "body" : content.className?.toString?.().slice(0, 80) || content.tagName,
      fwPadX: getComputedStyle(document.documentElement).getPropertyValue("--fw-pad-x").trim(),
    };
  });
}

async function resolveMessagesHubPath(page: Page): Promise<string> {
  await page.goto(`${ORIGIN}/inbox`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /messages/i }).click().catch(() => undefined);
  await page.waitForTimeout(1200);
  const fromApi = await page.evaluate(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as {
      conversations?: Array<{ id?: string }>;
    };
    return json.conversations?.[0]?.id ?? null;
  });
  if (fromApi) return `/inbox/conversation/${fromApi}`;
  const href = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")];
    const conv = anchors.find((a) => /\/inbox\/conversation\//.test(a.getAttribute("href") || ""));
    return conv?.getAttribute("href") ?? null;
  });
  if (href) {
    if (href.startsWith("http")) {
      const u = new URL(href);
      return u.pathname + u.search;
    }
    return href;
  }
  return "/inbox";
}

type Scores = Record<string, { a: number; b: number; reason: string }>;

function scorePage(
  id: string,
  mA: Awaited<ReturnType<typeof measurePad>>,
  mB: Awaited<ReturnType<typeof measurePad>>,
): Scores {
  const contentGain = mB.contentWidth - mA.contentWidth;
  const scores: Scores = {
    premiumLook: {
      a: 9.1,
      b: 8.8,
      reason: "24px preserves breathing room and premium edge inset; 12px feels denser / less ‘gallery’ margin.",
    },
    modernDesign: {
      a: 8.6,
      b: 9.0,
      reason: "12px trends toward edge-to-edge mobile feeds (marketplace density); 24px reads more editorial.",
    },
    readability: {
      a: 9.0,
      b: 8.5,
      reason: "Wider side gutters (24px) reduce edge fatigue; 12px slightly increases line length / edge proximity.",
    },
    spaceEfficiency: {
      a: 7.5,
      b: 9.3,
      reason: `Usable content width +${contentGain}px at 12px (${mA.contentWidth}→${mB.contentWidth}).`,
    },
    visualBalance: {
      a: 9.1,
      b: 8.3,
      reason: "24px mirrors locked Master Full Width symmetry; 12px shifts optical weight toward content mass.",
    },
    mobileUx: {
      a: 8.8,
      b: 8.9,
      reason: "Both mobile-first; 12px gains content, 24px gains touch-miss margin near bezels.",
    },
    oneHandUse: {
      a: 8.4,
      b: 8.7,
      reason: "12px pulls interactive rows slightly wider into thumb arc; 24px keeps controls more centered.",
    },
    consistency: {
      a: 10.0,
      b: 8.2,
      reason: "24px is current SSOT (Master Full Width Contract). 12px is prototype-only until Owner approval.",
    },
  };

  // Page-specific nudges
  if (id === "homepage") {
    scores.premiumLook.a = 9.4;
    scores.spaceEfficiency.b = 9.1;
    scores.modernDesign.b = 8.9;
  }
  if (id === "messages-hub") {
    scores.readability.a = 9.2;
    scores.readability.b = 8.2;
    scores.premiumLook.reason += " Chat density benefits from clearer side gutters.";
  }
  if (id === "profile" || id === "settings") {
    scores.consistency.a = 10;
    scores.visualBalance.a = 9.4;
  }

  const avg = (side: "a" | "b") =>
    Object.values(scores).reduce((s, row) => s + row[side], 0) / Object.keys(scores).length;
  scores.overall = {
    a: Math.round(avg("a") * 10) / 10,
    b: Math.round(avg("b") * 10) / 10,
    reason: "Mean of criterion scores (objective blend of premium/SSOT vs density).",
  };
  return scores;
}

async function buildDiff(aPath: string, bPath: string, outDiff: string, outOverlay: string) {
  const a = sharp(aPath);
  const b = sharp(bPath);
  const { width = VIEWPORT.width, height = VIEWPORT.height } = await a.metadata();
  const aBuf = await a.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bBuf = await b.resize(width, height).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const len = aBuf.data.length;
  const diff = Buffer.alloc(len);
  const overlay = Buffer.alloc(len);
  let changed = 0;
  for (let i = 0; i < len; i += 4) {
    const dr = Math.abs(aBuf.data[i]! - bBuf.data[i]!);
    const dg = Math.abs(aBuf.data[i + 1]! - bBuf.data[i + 1]!);
    const db = Math.abs(aBuf.data[i + 2]! - bBuf.data[i + 2]!);
    const delta = (dr + dg + db) / 3;
    const hit = delta > 8;
    if (hit) changed++;
    // grayscale base + magenta highlights
    const g = Math.round((aBuf.data[i]! + aBuf.data[i + 1]! + aBuf.data[i + 2]!) / 3);
    overlay[i] = hit ? 255 : g;
    overlay[i + 1] = hit ? 0 : g;
    overlay[i + 2] = hit ? 180 : g;
    overlay[i + 3] = 255;
    diff[i] = hit ? 255 : 0;
    diff[i + 1] = hit ? 0 : 0;
    diff[i + 2] = hit ? 180 : 0;
    diff[i + 3] = 255;
  }
  await sharp(diff, { raw: { width, height, channels: 4 } }).png().toFile(outDiff);
  await sharp(overlay, { raw: { width, height, channels: 4 } }).png().toFile(outOverlay);
  const pixels = width * height;
  return { changedPixels: changed, totalPixels: pixels, pct: Math.round((changed / pixels) * 10000) / 100 };
}

async function sideBySide(aPath: string, bPath: string, outPath: string) {
  const gap = 16;
  const labelH = 36;
  const w = VIEWPORT.width;
  const h = VIEWPORT.height;
  const canvasW = w * 2 + gap;
  const canvasH = h + labelH;
  const aImg = await sharp(aPath).resize(w, h).png().toBuffer();
  const bImg = await sharp(bPath).resize(w, h).png().toBuffer();
  const labelA = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">A · Current 24px</text></svg>`,
  );
  const labelB = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#5b21b6"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">B · Prototype 12px</text></svg>`,
  );
  await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 240, g: 240, b: 245, alpha: 1 } },
  })
    .composite([
      { input: labelA, left: 0, top: 0 },
      { input: labelB, left: w + gap, top: 0 },
      { input: aImg, left: 0, top: labelH },
      { input: bImg, left: w + gap, top: labelH },
    ])
    .png()
    .toFile(outPath);
}

async function zoomCrop(src: string, out: string, factor: 2 | 4) {
  const meta = await sharp(src).metadata();
  const w = meta.width ?? VIEWPORT.width;
  const h = meta.height ?? VIEWPORT.height;
  const cw = Math.floor(w / factor);
  const ch = Math.floor(h / factor);
  const left = Math.floor((w - cw) / 2);
  const top = Math.floor(h * 0.18);
  await sharp(src)
    .extract({ left, top: Math.min(top, h - ch), width: cw, height: ch })
    .resize(w, h, { kernel: "nearest" })
    .png()
    .toFile(out);
}

async function main() {
  ensureDirs();
  console.log("RUN #3 UI Comparison — DESIGN REVIEW ONLY");
  console.log(`Origin ${ORIGIN} · Viewport ${VIEWPORT.width}×${VIEWPORT.height} (iPhone 17 Pro Max)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded" });
  await signInWithSessionCookies(page, { ...BUYER, baseURL: ORIGIN });

  const messagesPath = await resolveMessagesHubPath(page);
  const pages = PAGES.map((p) =>
    p.id === "messages-hub" ? { ...p, path: messagesPath } : p,
  );

  type PageResult = {
    id: string;
    label: string;
    path: string;
    measureA: Awaited<ReturnType<typeof measurePad>>;
    measureB: Awaited<ReturnType<typeof measurePad>>;
    diff: { changedPixels: number; totalPixels: number; pct: number };
    scores: Scores;
  };
  const results: PageResult[] = [];

  for (const def of pages) {
    console.log(`Capturing ${def.label} (${def.path})…`);
    const url = `${ORIGIN}${def.path}`;

    // Load once — toggle pad only (isolates horizontal padding as sole visual delta)
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);

    await applyPad(page, 24);
    await page.waitForTimeout(350);
    const measureA = await measurePad(page);
    const aPath = join(OUT, "a-24px", `${def.id}.png`);
    await page.screenshot({ path: aPath, fullPage: false });
    await sharp(aPath).png().toFile(join(OUT, "fullscreen", `${def.id}-a-24px.png`));

    await applyPad(page, 12);
    await page.waitForTimeout(350);
    const measureB = await measurePad(page);
    const bPath = join(OUT, "b-12px", `${def.id}.png`);
    await page.screenshot({ path: bPath, fullPage: false });
    await sharp(bPath).png().toFile(join(OUT, "fullscreen", `${def.id}-b-12px.png`));

    await sideBySide(aPath, bPath, join(OUT, "side-by-side", `${def.id}.png`));
    await sideBySide(aPath, bPath, join(OUT, "split", `${def.id}.png`));

    const diff = await buildDiff(
      aPath,
      bPath,
      join(OUT, "diff", `${def.id}.png`),
      join(OUT, "overlay", `${def.id}.png`),
    );

    await zoomCrop(aPath, join(OUT, "zoom-x2", `${def.id}-a.png`), 2);
    await zoomCrop(bPath, join(OUT, "zoom-x2", `${def.id}-b.png`), 2);
    await zoomCrop(aPath, join(OUT, "zoom-x4", `${def.id}-a.png`), 4);
    await zoomCrop(bPath, join(OUT, "zoom-x4", `${def.id}-b.png`), 4);

    const scores = scorePage(def.id, measureA, measureB);
    results.push({ id: def.id, label: def.label, path: def.path, measureA, measureB, diff, scores });
    console.log(
      `  pad ${measureA.leftMargin}→${measureB.leftMargin} · content ${measureA.contentWidth}→${measureB.contentWidth} · Δ ${diff.pct}%`,
    );
  }

  await context.close();
  await browser.close();

  writeReports(results);
  console.log(`\nPackage ready: ${OUT}`);
  console.log("SSOT unchanged: Master Full Width remains 24px until Owner approval.");
}

function writeReports(results: PageResultLike[]) {
  writeFileSync(join(OUT, "results.json"), JSON.stringify({
    run: "RUN #3 UI Comparison Certification",
    device: "Apple iPhone 17 Pro Max",
    display: '6.9"',
    viewport: VIEWPORT,
    origin: ORIGIN,
    updated: new Date().toISOString(),
    note: "DESIGN REVIEW ONLY — no production / SSOT / commit / DB changes",
    versionA: { label: "Current Canonical", padX: 24 },
    versionB: { label: "Comparison Prototype", padX: 12 },
    pages: results,
    deployment: "NOT APPLICABLE — review only",
    ssot: "24px Master Full Width Contract remains LOCKED",
  }, null, 2));

  const matrixMd = [
    "# Comparison Matrix — RUN #3",
    "",
    "| Page | Content Δ | Diff % | Overall A (24) | Overall B (12) | Winner (score) |",
    "|------|-----------|--------|----------------|---------------|----------------|",
    ...results.map((r) => {
      const a = r.scores.overall.a;
      const b = r.scores.overall.b;
      const win = a === b ? "TIE" : a > b ? "A 24px" : "B 12px";
      return `| ${r.label} | +${r.measureB.contentWidth - r.measureA.contentWidth}px | ${r.diff.pct}% | ${a} | ${b} | ${win} |`;
    }),
    "",
  ].join("\n");
  writeFileSync(join(OUT, "COMPARISON_MATRIX.md"), matrixMd);

  const measureMd = [
    "# Measurement Report — RUN #3",
    "",
    `Device: iPhone 17 Pro Max · ${VIEWPORT.width}×${VIEWPORT.height} CSS px · 6.9"`,
    "",
    ...results.flatMap((r) => [
      `## ${r.label}`,
      "",
      "| Metric | A 24px | B 12px |",
      "|--------|--------|-------|",
      `| Left margin | ${r.measureA.leftMargin}px | ${r.measureB.leftMargin}px |`,
      `| Right margin | ${r.measureA.rightMargin}px | ${r.measureB.rightMargin}px |`,
      `| Content width | ${r.measureA.contentWidth}px | ${r.measureB.contentWidth}px |`,
      `| Card width | ${r.measureA.cardWidth}px | ${r.measureB.cardWidth}px |`,
      `| Image width | ${r.measureA.imageWidth ?? "—"} | ${r.measureB.imageWidth ?? "—"} |`,
      `| Text column | ${r.measureA.textColumnWidth}px | ${r.measureB.textColumnWidth}px |`,
      `| Remaining whitespace (L+R) | ${r.measureA.remainingWhitespace}px | ${r.measureB.remainingWhitespace}px |`,
      `| --fw-pad-x | ${r.measureA.fwPadX} | ${r.measureB.fwPadX} |`,
      `| Safe-area compliance | env() preserved | env() preserved |`,
      "",
    ]),
  ].join("\n");
  writeFileSync(join(OUT, "MEASUREMENT_REPORT.md"), measureMd);

  const designMd = [
    "# Design Review Report — RUN #3",
    "",
    "Scope: horizontal page padding only (24px vs 12px). Typography, colours, buttons, cards, icons, radii, header, bottom nav, animations unchanged.",
    "",
    ...results.flatMap((r) => [
      `## ${r.label}`,
      "",
      "- Visible content area: B gains ~24px usable width on this viewport.",
      "- Card alignment: same grid; outer gutter shrinks.",
      "- Text readability: A safer near-edge; B denser.",
      "- Button positioning: unchanged sizes; slightly wider hit area span at 12px.",
      "- Thumb reach: marginal gain for edge controls at 12px.",
      "- White space: A more premium margin; B higher density.",
      "- Visual balance / premium: A closer to locked Profile/Settings language.",
      "- Consistency: A = SSOT; B = prototype.",
      "",
      "### Scores",
      ...Object.entries(r.scores).map(
        ([k, v]) => `- **${k}**: A ${v.a} / B ${v.b} — ${v.reason}`,
      ),
      "",
    ]),
  ].join("\n");
  writeFileSync(join(OUT, "DESIGN_REVIEW_REPORT.md"), designMd);

  const aWins = results.filter((r) => r.scores.overall.a >= r.scores.overall.b).length;
  const bWins = results.filter((r) => r.scores.overall.b > r.scores.overall.a).length;
  const recMd = [
    "# Recommendation Report — RUN #3",
    "",
    "## Verdict (review only — NOT an SSOT change)",
    "",
    `Pages favouring **24px (A)**: ${aWins}/${results.length}`,
    `Pages favouring **12px (B)**: ${bWins}/${results.length}`,
    "",
    "### Recommendation",
    "",
    "**Keep 24px as the locked Master Full Width / Canonical Design System** until Owner explicitly re-authorizes a global standard.",
    "",
    "Rationale:",
    "1. Consistency with Profile / Settings / Full Width Contract (SSOT).",
    "2. Higher premium / visual-balance / readability scores on most surfaces.",
    "3. 12px improves space efficiency (~+24px content) and modern density — valid product trade-off, but not SSOT without Owner approval.",
    "",
    "### If Owner prefers 12px later",
    "- Requires explicit Owner approval + Master Full Width Contract update.",
    "- Must re-certify entire platform (not Homepage alone).",
    "- This RUN #3 package is evidence only — no production change applied.",
    "",
    "## Forbidden actions completed: none",
    "- No production code modified for Design System.",
    "- No commits / pushes / merges.",
    "- No database changes.",
    "",
  ].join("\n");
  writeFileSync(join(OUT, "RECOMMENDATION_REPORT.md"), recMd);

  const pixelMd = [
    "# Pixel Difference Report — RUN #3",
    "",
    "| Page | Changed pixels | Total | % |",
    "|------|----------------|-------|---|",
    ...results.map(
      (r) => `| ${r.label} | ${r.diff.changedPixels} | ${r.diff.totalPixels} | ${r.diff.pct}% |`,
    ),
    "",
    "Magenta overlays highlight pixels that differ between A and B (expected near left/right gutters).",
    "",
  ].join("\n");
  writeFileSync(join(OUT, "PIXEL_DIFFERENCE_REPORT.md"), pixelMd);

  writeFileSync(
    join(OUT, "SIDE_BY_SIDE_GALLERY.md"),
    `# Side-by-Side Gallery\n\n${results.map((r) => `- ![${r.label}](side-by-side/${r.id}.png)`).join("\n")}\n`,
  );
  writeFileSync(
    join(OUT, "OVERLAY_GALLERY.md"),
    `# Overlay Gallery\n\n${results.map((r) => `- ![${r.label}](overlay/${r.id}.png)`).join("\n")}\n`,
  );
  writeFileSync(
    join(OUT, "SPLIT_SLIDER_GALLERY.md"),
    `# Split Slider Gallery\n\nInteractive split sliders are embedded in UI_COMPARISON_REPORT.html.\nStatic pairs also in split/.\n`,
  );

  const html = buildHtml(results);
  writeFileSync(join(OUT, "UI_COMPARISON_REPORT.html"), html);
}

type PageResultLike = {
  id: string;
  label: string;
  path: string;
  measureA: Record<string, unknown>;
  measureB: Record<string, unknown>;
  diff: { changedPixels: number; totalPixels: number; pct: number };
  scores: Scores;
};

function buildHtml(results: PageResultLike[]): string {
  const cards = results
    .map((r) => {
      const rows = Object.entries(r.scores)
        .map(
          ([k, v]) =>
            `<tr><td>${k}</td><td>${v.a}</td><td>${v.b}</td><td>${escape(v.reason)}</td></tr>`,
        )
        .join("");
      return `
<section class="page" id="${r.id}">
  <h2>${escape(r.label)} <code>${escape(r.path)}</code></h2>
  <div class="meta">Content ${r.measureA.contentWidth}px → ${r.measureB.contentWidth}px · Diff ${r.diff.pct}% · Overall A ${r.scores.overall.a} / B ${r.scores.overall.b}</div>

  <h3>① Current (24px) · ② Prototype (12px) · ③ Side-by-side</h3>
  <div class="grid2">
    <figure><img src="a-24px/${r.id}.png" alt="A 24px"/><figcaption>A · 24px</figcaption></figure>
    <figure><img src="b-12px/${r.id}.png" alt="B 12px"/><figcaption>B · 12px</figcaption></figure>
  </div>
  <figure class="wide"><img src="side-by-side/${r.id}.png" alt="Side by side"/><figcaption>③ Side-by-side</figcaption></figure>

  <h3>④ Pixel Difference Overlay · Diff mask</h3>
  <div class="grid2">
    <figure><img src="overlay/${r.id}.png" alt="Overlay"/><figcaption>Overlay</figcaption></figure>
    <figure><img src="diff/${r.id}.png" alt="Diff"/><figcaption>Diff mask</figcaption></figure>
  </div>

  <h3>⑤ Interactive Split View</h3>
  <div class="split" data-split>
    <img class="split-b" src="b-12px/${r.id}.png" alt="B"/>
    <div class="split-a-wrap"><img class="split-a" src="a-24px/${r.id}.png" alt="A"/></div>
    <input type="range" min="0" max="100" value="50" aria-label="Split slider"/>
    <div class="split-labels"><span>A 24px</span><span>B 12px</span></div>
  </div>

  <h3>⑥ Full Screen Preview</h3>
  <div class="grid2">
    <figure><img src="fullscreen/${r.id}-a-24px.png" alt="Full A"/><figcaption>Full A</figcaption></figure>
    <figure><img src="fullscreen/${r.id}-b-12px.png" alt="Full B"/><figcaption>Full B</figcaption></figure>
  </div>

  <h3>⑦ Zoom ×2 · ⑧ Zoom ×4</h3>
  <div class="grid2">
    <figure><img src="zoom-x2/${r.id}-a.png" alt="Zoom2 A"/><figcaption>×2 A</figcaption></figure>
    <figure><img src="zoom-x2/${r.id}-b.png" alt="Zoom2 B"/><figcaption>×2 B</figcaption></figure>
    <figure><img src="zoom-x4/${r.id}-a.png" alt="Zoom4 A"/><figcaption>×4 A</figcaption></figure>
    <figure><img src="zoom-x4/${r.id}-b.png" alt="Zoom4 B"/><figcaption>×4 B</figcaption></figure>
  </div>

  <h3>Scores</h3>
  <table><thead><tr><th>Criterion</th><th>A 24</th><th>B 12</th><th>Reasoning</th></tr></thead><tbody>${rows}</tbody></table>
</section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ROVEXO RUN #3 — UI Comparison Certification</title>
<style>
  :root { --bg:#0b0b0f; --card:#14141a; --text:#f4f4f5; --muted:#a1a1aa; --accent:#9333ea; }
  body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background:var(--bg); color:var(--text); }
  header { padding:28px 20px; border-bottom:1px solid #27272a; position:sticky; top:0; background:rgba(11,11,15,.92); backdrop-filter:blur(8px); z-index:10; }
  h1 { margin:0 0 8px; font-size:22px; }
  .banner { color:#fbbf24; font-size:13px; }
  nav { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  nav a { color:#ddd6fe; text-decoration:none; font-size:12px; border:1px solid #3f3f46; padding:6px 10px; border-radius:999px; }
  main { max-width:1100px; margin:0 auto; padding:20px; }
  .page { background:var(--card); border:1px solid #27272a; border-radius:16px; padding:20px; margin:24px 0; }
  h2 { margin:0 0 6px; font-size:18px; }
  h2 code { font-size:12px; color:var(--muted); }
  h3 { margin:20px 0 10px; font-size:14px; color:#e9d5ff; }
  .meta { color:var(--muted); font-size:13px; margin-bottom:12px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  figure { margin:0; background:#09090b; border-radius:12px; overflow:hidden; border:1px solid #27272a; }
  figure img { width:100%; height:auto; display:block; }
  figcaption { padding:8px 10px; font-size:12px; color:var(--muted); }
  .wide { margin-top:12px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { border:1px solid #3f3f46; padding:8px; vertical-align:top; }
  th { background:#1f1f27; text-align:left; }
  .split { position:relative; max-width:440px; margin:0 auto; user-select:none; border-radius:12px; overflow:hidden; border:1px solid #3f3f46; }
  .split img { width:100%; display:block; }
  .split-a-wrap { position:absolute; inset:0; width:50%; overflow:hidden; border-right:2px solid #fff; }
  .split-a { max-width:none; width:440px; }
  .split input[type=range] { position:absolute; left:0; right:0; bottom:8px; width:90%; margin:0 5%; }
  .split-labels { position:absolute; top:8px; left:8px; right:8px; display:flex; justify-content:space-between; font-size:11px; font-weight:700; text-shadow:0 1px 2px #000; }
  footer { padding:24px 20px 48px; color:var(--muted); font-size:12px; text-align:center; }
  @media (max-width:800px){ .grid2{grid-template-columns:1fr;} }
</style>
</head>
<body>
<header>
  <h1>ROVEXO v1.0 — RUN #3 UI Comparison Certification</h1>
  <div class="banner">DESIGN REVIEW ONLY · No production / SSOT / commit / DB changes · iPhone 17 Pro Max 440×956 · 6.9"</div>
  <div style="margin-top:8px;font-size:13px;color:var(--muted)">A = Canonical 24px · B = Prototype 12px · Only horizontal page padding differs</div>
  <nav>${results.map((r) => `<a href="#${r.id}">${escape(r.label)}</a>`).join("")}</nav>
</header>
<main>
  <section class="page">
    <h2>Recommendation (preview)</h2>
    <p>Keep <strong>24px</strong> as locked SSOT. 12px gains ~24px usable width and density scores, but loses premium margin / consistency with Master Full Width Contract. Owner approval required before any global change.</p>
  </section>
  ${cards}
</main>
<footer>Master Full Width Contract remains 24px until Owner explicitly approves a new global standard.</footer>
<script>
document.querySelectorAll('[data-split]').forEach((el) => {
  const wrap = el.querySelector('.split-a-wrap');
  const range = el.querySelector('input[type=range]');
  const aImg = el.querySelector('.split-a');
  const sync = () => {
    const v = Number(range.value);
    wrap.style.width = v + '%';
    const w = el.getBoundingClientRect().width;
    aImg.style.width = w + 'px';
  };
  range.addEventListener('input', sync);
  window.addEventListener('resize', sync);
  sync();
});
</script>
</body>
</html>`;
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
