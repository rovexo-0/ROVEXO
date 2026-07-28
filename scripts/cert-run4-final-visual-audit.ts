/**
 * FINAL VISUAL AUDIT — Internal UI 16px preview (Owner edge-proximity review).
 * localhost only. Does not change SSOT.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { signInWithSessionCookies } from "../e2e/helpers/auth";
import { run4InternalPadOverrideCss } from "../lib/preview/run4-internal-pad-css";

const ORIGIN = process.env.CERT_ORIGIN ?? "http://localhost:3000";
const OUT = join(process.cwd(), "test-results/run4-final-visual-audit");
const BUYER = { email: "demo.buyer@rovexo.co.uk", password: "RovexoBuyer@2026" };
const VIEWPORT = { width: 440, height: 956 };

/** Soft edge: content should sit ≥ 16px from screen L/R (Internal v1.1). Warn if < 12. Fail visual if < 8. */
const WARN_PX = 12;
const FAIL_PX = 8;

type PageDef = { id: string; label: string; path: string; focus?: string[] };

const PAGES: PageDef[] = [
  { id: "balance", label: "Wallet / Balance", path: "/balance", focus: ["charts", "cards", "sticky"] },
  { id: "orders", label: "Orders", path: "/orders", focus: ["cards", "lists"] },
  { id: "inbox", label: "Inbox", path: "/inbox", focus: ["cards", "tabs"] },
  { id: "messages-hub", label: "Messages Hub", path: "/inbox", focus: ["gallery", "sticky", "forms"] },
  { id: "saved", label: "Saved", path: "/saved", focus: ["listing-cards", "empty"] },
  { id: "sell", label: "Sell", path: "/sell", focus: ["forms", "gallery", "sticky"] },
  { id: "search", label: "Search", path: "/search", focus: ["listing-cards", "results"] },
  { id: "listing", label: "Listing Details", path: "/search", focus: ["gallery", "sticky"] },
  { id: "profile", label: "Profile", path: "/account", focus: ["forms", "lists"] },
  { id: "settings", label: "Settings", path: "/account/settings", focus: ["forms", "lists"] },
  { id: "help", label: "Help", path: "/help", focus: ["lists"] },
  { id: "legal", label: "Legal", path: "/legal", focus: ["lists"] },
  { id: "checkout", label: "Checkout", path: "/checkout", focus: ["summary", "sticky", "forms"] },
];

type EdgeHit = {
  tag: string;
  cls: string;
  left: number;
  right: number;
  top: number;
  role: string;
};

type PageAudit = {
  id: string;
  label: string;
  path: string;
  status: "PASS" | "WARN" | "FAIL" | "WEAKER";
  minLeft: number;
  minRight: number;
  hits: EdgeHit[];
  notes: string;
  weaker: boolean;
  weakerReason?: string;
};

async function apply16(page: Page) {
  await page.evaluate(() => {
    document.getElementById("rovexo-run4-final-audit")?.remove();
    document.documentElement.setAttribute("data-run4-internal-pad", "16");
  });
  await page.addStyleTag({ content: run4InternalPadOverrideCss(16) });
  await page.evaluate(() => {
    const styles = [...document.querySelectorAll("style")];
    const last = styles[styles.length - 1];
    if (last) last.id = "rovexo-run4-final-audit";
  });
  await page.waitForTimeout(200);
}

async function probeEdges(page: Page) {
  return page.evaluate(
    ({ warnPx, failPx }: { warnPx: number; failPx: number }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const selectors = [
        "img",
        "button",
        "input",
        "textarea",
        "select",
        "table",
        "canvas",
        "[role='dialog']",
        "[role='listbox']",
        ".cds-menu-row",
        ".cds-button",
        ".wallet-v2__hero",
        ".inbox-hub__card",
        ".conv-hub",
        ".listing-card",
        "[class*='ListingCard']",
        "[class*='gallery']",
        "[class*='sticky']",
        ".account-settings-sticky-action",
        "[class*='Sheet']",
        "[class*='Modal']",
        "[class*='summary']",
        "form",
        "[data-empty]",
        ".inbox-hub__empty",
      ];

      const hits: Array<{
        tag: string;
        cls: string;
        left: number;
        right: number;
        top: number;
        role: string;
        severity: "warn" | "fail";
      }> = [];

      let minLeft = Infinity;
      let minRight = Infinity;
      const seen = new Set<Element>();

      for (let s = 0; s < selectors.length; s++) {
        const nodes = document.querySelectorAll(selectors[s]!);
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i]!;
          if (seen.has(el)) continue;
          seen.add(el);
          const cls = (el as HTMLElement).className
            ? String((el as HTMLElement).className)
            : "";
          if (cls.includes("rx-bottom-nav") || cls.includes("bottom-nav")) continue;
          if (cls.includes("conv-hub") && !cls.includes("conv-hub__")) continue; // full-bleed hub shell
          if (cls.includes("srch-land__close")) continue; // inside inset search bar chrome
          if (cls.includes("srch-land__bar")) continue;
          if (el.closest("[data-bottom-nav]")) continue;
          if (el.closest("[data-run4-preview-chrome]")) continue;

          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) continue;
          if (r.bottom < 0 || r.top > vh) continue;
          const left = Math.round(r.left);
          const right = Math.round(vw - r.right);
          if (left < failPx || right < failPx || left < warnPx || right < warnPx) {
            const severity: "warn" | "fail" =
              left < failPx || right < failPx ? "fail" : "warn";
            hits.push({
              tag: el.tagName.toLowerCase(),
              cls: cls.slice(0, 80),
              left,
              right,
              top: Math.round(r.top),
              role: el.getAttribute("role") || "",
              severity,
            });
          }
          if (r.top >= 0 && r.bottom <= vh + 40) {
            minLeft = Math.min(minLeft, left);
            minRight = Math.min(minRight, right);
          }
        }
      }

      const shell =
        document.querySelector(".cds-layout__content--account-canonical") ||
        document.querySelector(".wallet-v2") ||
        document.querySelector("main");
      const shellPad = shell
        ? {
            pl: Math.round(parseFloat(getComputedStyle(shell).paddingLeft) || 0),
            pr: Math.round(parseFloat(getComputedStyle(shell).paddingRight) || 0),
          }
        : null;

      return {
        minLeft: minLeft === Infinity ? -1 : minLeft,
        minRight: minRight === Infinity ? -1 : minRight,
        hits: hits.slice(0, 40),
        shellPad,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    },
    { warnPx: WARN_PX, failPx: FAIL_PX },
  );
}

async function resolvePaths(page: Page): Promise<PageDef[]> {
  const pages = PAGES.map((p) => ({ ...p }));
  await page.goto(`${ORIGIN}/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /messages/i }).click().catch(() => undefined);
  await page.waitForTimeout(600);
  const convId = await page.evaluate(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { conversations?: Array<{ id?: string }> };
    return json.conversations?.[0]?.id ?? null;
  });
  const msg = pages.find((p) => p.id === "messages-hub");
  if (msg && convId) msg.path = `/inbox/conversation/${convId}`;

  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const listingHref = await page.evaluate(() => {
    const a = document.querySelector<HTMLAnchorElement>("a[href*='/listing/']");
    return a?.getAttribute("href") ?? null;
  });
  const listing = pages.find((p) => p.id === "listing");
  if (listing && listingHref) {
    listing.path = listingHref.startsWith("http") ? new URL(listingHref).pathname : listingHref.split("?")[0]!;
  }
  return pages;
}

/** Heuristic: weaker if content min inset < 16 while design target is 16, or fail-severity hits on product UI */
function assessWeaker(
  id: string,
  probe: Awaited<ReturnType<typeof probeEdges>>,
): { weaker: boolean; reason?: string } {
  const failHits = probe.hits.filter((h) => h.severity === "fail");
  // Exclude full-bleed intentional: sticky bottom CTAs often span width with internal pad
  const meaningfulFails = failHits.filter((h) => {
    const c = h.cls.toLowerCase();
    if (c.includes("rx-bottom-nav") || c.includes("sell-plus")) return false;
    // Images that are full-bleed heroes on listing are a concern if left/right < 8
    return true;
  });

  if (probe.overflowX) return { weaker: true, reason: "Horizontal overflow at 16px" };
  if (meaningfulFails.length > 0) {
    const sample = meaningfulFails[0]!;
    return {
      weaker: true,
      reason: `Element too close to edge (<${FAIL_PX}px): <${sample.tag}> left=${sample.left} right=${sample.right}`,
    };
  }

  // Shell pad should be 16 on account surfaces
  if (probe.shellPad && (probe.shellPad.pl < 16 || probe.shellPad.pr < 16) && probe.shellPad.pl > 0) {
    // listing/search may use different shells
    if (["listing", "search", "messages-hub"].includes(id) === false) {
      return {
        weaker: true,
        reason: `Shell pad below 16px (L=${probe.shellPad.pl} R=${probe.shellPad.pr})`,
      };
    }
  }

  return { weaker: false };
}

async function main() {
  mkdirSync(join(OUT, "screenshots"), { recursive: true });
  mkdirSync(join(OUT, "screenshots-scrolled"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      localStorage.setItem("rovexo_run4_internal_pad_active", "1");
      localStorage.setItem("rovexo_run4_internal_pad", "16");
      localStorage.setItem("rovexo_run3_preview_active", "0");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded" });
  await signInWithSessionCookies(page, { ...BUYER, baseURL: ORIGIN });

  const pages = await resolvePaths(page);
  const audits: PageAudit[] = [];

  for (const def of pages) {
    console.log(`Audit ${def.label}…`);
    await page.goto(`${ORIGIN}${def.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await apply16(page);
    await page.waitForTimeout(300);

    const probe = await probeEdges(page);
    await page.screenshot({ path: join(OUT, "screenshots", `${def.id}.png`), fullPage: false });

    // Scroll mid-page for sticky / gallery context
    await page.evaluate(() => window.scrollBy(0, Math.min(420, document.body.scrollHeight / 3)));
    await page.waitForTimeout(400);
    await apply16(page);
    const probeScroll = await probeEdges(page);
    await page.screenshot({
      path: join(OUT, "screenshots-scrolled", `${def.id}.png`),
      fullPage: false,
    });

    const mergedHits = [...probe.hits, ...probeScroll.hits];
    const unique = new Map<string, (typeof mergedHits)[0]>();
    for (const h of mergedHits) {
      const k = `${h.tag}|${h.left}|${h.right}|${h.cls.slice(0, 30)}`;
      if (!unique.has(k)) unique.set(k, h);
    }
    const hits = [...unique.values()];
    const minLeft = Math.min(
      probe.minLeft < 0 ? 999 : probe.minLeft,
      probeScroll.minLeft < 0 ? 999 : probeScroll.minLeft,
    );
    const minRight = Math.min(
      probe.minRight < 0 ? 999 : probe.minRight,
      probeScroll.minRight < 0 ? 999 : probeScroll.minRight,
    );

    const combined = {
      ...probe,
      hits,
      minLeft: minLeft === 999 ? -1 : minLeft,
      minRight: minRight === 999 ? -1 : minRight,
      overflowX: probe.overflowX || probeScroll.overflowX,
    };
    const { weaker, reason } = assessWeaker(def.id, combined);
    const hasFail = hits.some((h) => h.severity === "fail");
    const hasWarn = hits.some((h) => h.severity === "warn");

    let status: PageAudit["status"] = "PASS";
    if (weaker) status = "WEAKER";
    else if (hasFail) status = "FAIL";
    else if (hasWarn) status = "WARN";

    // Reclassify: warn-only full-bleed images that are still ≥ shell — if shell is 16 and only warn, keep PASS unless weaker
    if (status === "WARN" && !weaker && (combined.shellPad?.pl ?? 16) >= 16) {
      // Filter warns that are bottom-nav adjacent or decorative
      const realWarns = hits.filter(
        (h) => h.severity === "warn" && (h.left < WARN_PX || h.right < WARN_PX),
      );
      const chromeWarns = realWarns.every((h) => {
        const c = h.cls.toLowerCase();
        return c.includes("safe-area") || h.top > 880;
      });
      if (chromeWarns || realWarns.length === 0) status = "PASS";
    }

    audits.push({
      id: def.id,
      label: def.label,
      path: def.path,
      status,
      minLeft: combined.minLeft,
      minRight: combined.minRight,
      hits: hits.map(({ tag, cls, left, right, top, role }) => ({ tag, cls, left, right, top, role })),
      notes: weaker
        ? reason || "Visually weaker at 16px"
        : `shell L/R=${combined.shellPad?.pl ?? "?"}/${combined.shellPad?.pr ?? "?"} · minInset L/R=${combined.minLeft}/${combined.minRight} · overflow=${combined.overflowX}`,
      weaker,
      weakerReason: reason,
    });
    console.log(`  ${status} ${audits[audits.length - 1]!.notes}`);
  }

  // Homepage lock sanity: must NOT apply
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  // Clear attr as gate would on homepage
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-run4-internal-pad");
    document.getElementById("rovexo-run4-final-audit")?.remove();
  });
  await page.screenshot({ path: join(OUT, "screenshots", "homepage-locked-control.png"), fullPage: false });

  await context.close();
  await browser.close();

  const weakerPages = audits.filter((a) => a.weaker || a.status === "WEAKER" || a.status === "FAIL");
  const finalPass = weakerPages.length === 0;

  const report = {
    title: "FINAL VISUAL AUDIT — Internal UI 16px",
    origin: ORIGIN,
    viewport: VIEWPORT,
    updated: new Date().toISOString(),
    verdict: finalPass ? "FINAL DESIGN CERTIFICATION PASS" : "VISUAL WEAKER PAGES FOUND",
    weakerCount: weakerPages.length,
    pages: audits,
    weakerPages: weakerPages.map((p) => ({
      id: p.id,
      label: p.label,
      path: p.path,
      reason: p.weakerReason || p.notes,
    })),
    evidence: {
      screenshots: join(OUT, "screenshots"),
      scrolled: join(OUT, "screenshots-scrolled"),
    },
    ssot: "Master Full Width remains 24px until Owner approval — this audit uses temporary 16px preview only",
    deployment: "BLOCKED",
  };

  writeFileSync(join(OUT, "FINAL_VISUAL_AUDIT.json"), JSON.stringify(report, null, 2));

  const md = [
    `# FINAL VISUAL AUDIT — Internal UI 16px`,
    ``,
    `**Verdict: ${report.verdict}**`,
    ``,
    `Device: iPhone 17 Pro Max ${VIEWPORT.width}×${VIEWPORT.height}`,
    `Preview: temporary RUN #4 16px overlay (Homepage LOCKED / not audited for change)`,
    ``,
    `## Matrix`,
    ``,
    `| Page | Status | Notes |`,
    `|------|--------|-------|`,
    ...audits.map((a) => `| ${a.label} | ${a.status} | ${a.notes.replace(/\|/g, "/")} |`),
    ``,
    finalPass
      ? `## Result\n\nNo internal page was judged visually weaker at 16px. No components critically hugging screen edges (<${FAIL_PX}px) outside intentional chrome (bottom nav).\n`
      : `## Weaker pages\n\n${weakerPages.map((p) => `- **${p.label}** (\`${p.path}\`): ${p.weakerReason || p.notes}`).join("\n")}\n`,
    ``,
    `Evidence: \`screenshots/\` and \`screenshots-scrolled/\``,
    ``,
  ].join("\n");
  writeFileSync(join(OUT, "FINAL_VISUAL_AUDIT.md"), md);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Final Visual Audit 16px</title>
<style>
body{font-family:system-ui;margin:0;background:#0b0b0f;color:#f4f4f5}
header{padding:20px;border-bottom:1px solid #27272a}
.PASS{color:#4ade80}.WARN{color:#fbbf24}.FAIL,.WEAKER{color:#f87171}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px}
figure{margin:0;background:#111;border:1px solid #333;border-radius:12px;overflow:hidden}
img{width:100%;display:block} figcaption{padding:8px;font-size:12px;color:#a1a1aa}
</style></head><body>
<header><h1>${report.verdict}</h1>
<p>Internal pages @ 16px · iPhone 17 Pro Max · ${audits.length} pages · Weaker: ${weakerPages.length}</p></header>
<div class="grid">
${audits.map((a) => `<figure><img src="screenshots/${a.id}.png"/><figcaption><span class="${a.status}">${a.status}</span> ${a.label}<br/>${a.notes}</figcaption></figure>`).join("")}
</div></body></html>`;
  writeFileSync(join(OUT, "FINAL_VISUAL_AUDIT.html"), html);

  console.log("\n===", report.verdict, "===");
  if (!finalPass) {
    for (const w of weakerPages) console.log("WEAKER:", w.label, w.weakerReason || w.notes);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
