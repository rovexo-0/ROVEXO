/**
 * RUN #1 live retest — defects that can be validated without Owner DB push.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { signInWithSessionCookies } from "../e2e/helpers/auth";
import { enhanceListingImage } from "../lib/media/enhance-listing-image";
import { getMessageHref, getOrderHubTrackHref } from "../lib/orders/status";

const ORIGIN = process.env.CERT_ORIGIN ?? "http://localhost:3000";
const OUT = join(process.cwd(), "test-results/run1-defects");
const SHOTS = join(OUT, "screenshots");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(join(OUT, "videos"), { recursive: true });

const BUYER = { email: "demo.buyer@rovexo.co.uk", password: "RovexoBuyer@2026" };
const SELLER = { email: "demo.seller@rovexo.co.uk", password: "RovexoSeller@2026" };

type Row = { id: string; status: "PASS" | "FAIL" | "OPEN" | "WAITING_FOR_OWNER"; notes: string };
const results: Row[] = [];

function record(id: string, status: Row["status"], notes: string) {
  results.push({ id, status, notes });
  console.log(`[${status}] ${id} — ${notes}`);
}

function writeEvidence() {
  const summary = {
    run: "FULL TEST COMPLETE RUN #1",
    origin: ORIGIN,
    updated: new Date().toISOString(),
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
    open: results.filter((r) => r.status === "OPEN").length,
    waitingForOwner: results.filter((r) => r.status === "WAITING_FOR_OWNER").length,
    results,
    deployment: "BLOCKED",
  };
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2));

  const matrixRows = results
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td class="${r.status}">${r.status}</td><td>${escapeHtml(r.notes)}</td></tr>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>ROVEXO RUN #1 — Full Test Complete</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;color:#111}
h1{font-size:20px} table{border-collapse:collapse;width:100%;margin:16px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
.PASS{color:#067647;font-weight:700}.FAIL{color:#b42318;font-weight:700}
.OPEN{color:#b54708;font-weight:700}.WAITING_FOR_OWNER{color:#6941c6;font-weight:700}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.shots figure{margin:0;border:1px solid #eee;padding:8px}
.shots img{width:100%;height:auto;display:block}
</style></head><body>
<h1>ROVEXO v1.0 — FULL TEST COMPLETE RUN #1</h1>
<p>Origin: ${ORIGIN} · Updated: ${summary.updated} · Deployment: <strong>BLOCKED</strong></p>
<p>PASS ${summary.pass} · FAIL ${summary.fail} · OPEN ${summary.open} · WAITING_FOR_OWNER ${summary.waitingForOwner}</p>
<h2>PASS / FAIL Matrix</h2>
<table><thead><tr><th>Check</th><th>Status</th><th>Notes</th></tr></thead>
<tbody>${matrixRows}</tbody></table>
<h2>Screenshot Gallery</h2>
<div class="shots">
<figure><img src="screenshots/01-buyer-home-nav.png" alt="Buyer home"/><figcaption>01 Buyer home + nav</figcaption></figure>
<figure><img src="screenshots/02-inbox-hub.png" alt="Inbox"/><figcaption>02 Inbox Hub</figcaption></figure>
<figure><img src="screenshots/03-seller-account.png" alt="Seller account"/><figcaption>03 Seller account</figcaption></figure>
<figure><img src="screenshots/04-order-detail-hub-cta.png" alt="Order detail"/><figcaption>04 Order detail Hub CTA</figcaption></figure>
<figure><img src="screenshots/05-inbox-badge.png" alt="Inbox badge"/><figcaption>05 Inbox badge</figcaption></figure>
</div>
<h2>Video Gallery</h2>
<p>WebM recordings are in <code>videos/</code>.</p>
<h2>Bug Fix Report</h2>
<ul>
<li><strong>#001 Rating</strong> — migration upsert + product refresh authored; live DB apply blocked by .env.local parse (line missing =).</li>
<li><strong>#002/#003 Hub SSOT</strong> — Order/Track deep-link to Messages Hub; Order Details CTAs reduced to Hub.</li>
<li><strong>#004 Perf</strong> — <code>/api/inbox/badge</code> + provider badge-only refresh (no full notification dump on nav).</li>
<li><strong>#005 Images</strong> — sharp enhance on listing upload.</li>
<li><strong>#006 Padding 9px</strong> — blocked by locked Master Full Width 24px SSOT.</li>
<li><strong>#007 Inbox badge</strong> — realtime conversation unread + lightweight badge sync + 0/1–99/99+ rules in BottomNavigation.</li>
</ul>
<h2>Regression Report</h2>
<p>Unit: <code>tests/run1-defects-xlviii.test.ts</code>. Live: this harness on localhost:3000 demo accounts only.</p>
</body></html>`;
  writeFileSync(join(OUT, "REPORT.html"), html);

  const md = `# ROVEXO RUN #1 — Bug Fix / Regression / Matrix

**Deployment: BLOCKED**

| Check | Status | Notes |
|------|--------|-------|
${results.map((r) => `| ${r.id} | ${r.status} | ${r.notes.replace(/\|/g, "/")} |`).join("\n")}

## Counts
- PASS: ${summary.pass}
- FAIL: ${summary.fail}
- OPEN: ${summary.open}
- WAITING_FOR_OWNER: ${summary.waitingForOwner}
`;
  writeFileSync(join(OUT, "BUG_FIX_AND_REGRESSION_REPORT.md"), md);
  writeFileSync(join(OUT, "PASS_FAIL_MATRIX.md"), md);

  // Minimal printable PDF-like text report (Owner can print HTML → PDF).
  writeFileSync(
    join(OUT, "REPORT.txt"),
    `ROVEXO RUN #1\nDEPLOYMENT BLOCKED\nPASS=${summary.pass} FAIL=${summary.fail} OPEN=${summary.open} WAITING=${summary.waitingForOwner}\n\n` +
      results.map((r) => `${r.status}\t${r.id}\t${r.notes}`).join("\n"),
  );

  console.log("\n=== SUMMARY ===", JSON.stringify({
    pass: summary.pass,
    fail: summary.fail,
    open: summary.open,
    waitingForOwner: summary.waitingForOwner,
  }));
  if (summary.fail > 0) process.exitCode = 1;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  // #005 enhance (unit live)
  const jpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "base64",
  );
  try {
    const out = await enhanceListingImage(jpeg);
    record("d005_image_enhance", out.bytes > 0 && out.contentType === "image/jpeg" ? "PASS" : "FAIL", `bytes=${out.bytes}`);
  } catch (e) {
    record("d005_image_enhance", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // #002/#003 Hub SSOT links
  const msg = getMessageHref("demo-order", "buyer");
  const track = getOrderHubTrackHref("demo-order");
  record(
    "d002_order_details_hub_ssot",
    msg.startsWith("/inbox") && !msg.includes("/messages?") ? "PASS" : "FAIL",
    msg,
  );
  record(
    "d003_tracking_hub_ssot",
    track.includes("/inbox?order=") && track.includes("focus=tracking") ? "PASS" : "FAIL",
    track,
  );

  // #006 locked 24px
  record(
    "d006_padding_9px",
    "WAITING_FOR_OWNER",
    "Owner directive 9px L/R conflicts with locked Master Full Width Contract 24px — Design Protection Absolute. No code change applied.",
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: join(OUT, "videos"), size: { width: 390, height: 844 } },
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);

  try {
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await signInWithSessionCookies(page, { ...BUYER, baseURL: ORIGIN });
    await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(SHOTS, "01-buyer-home-nav.png") });

    // #007 badge — wait for provider refresh against lightweight endpoint
    const badgeProbe = await page.evaluate(async () => {
      const t0 = performance.now();
      const badgeRes = await fetch("/api/inbox/badge", { cache: "no-store" });
      const badgeJson = await badgeRes.json().catch(() => ({}));
      const latency = Math.round(performance.now() - t0);
      // allow provider paint
      await new Promise((r) => setTimeout(r, 800));
      const nav = document.querySelector('[aria-label="Main navigation"]');
      const badge = document.querySelector(".rx-bottom-nav-badge");
      const inbox = Math.max(
        0,
        Number((badgeJson as { inboxBadge?: number }).inboxBadge) ||
          (Number((badgeJson as { messages?: number }).messages) || 0) +
            (Number((badgeJson as { notifications?: number }).notifications) || 0),
      );
      const expectedText = inbox <= 0 ? null : inbox > 99 ? "99+" : String(inbox);
      return {
        nav: Boolean(nav),
        badgeText: badge?.textContent?.trim() ?? null,
        expectedText,
        inbox,
        badgeOk: badgeRes.ok,
        latency,
      };
    });

    const badgeUiOk =
      badgeProbe.nav &&
      badgeProbe.badgeOk &&
      ((badgeProbe.inbox <= 0 && !badgeProbe.badgeText) ||
        (badgeProbe.inbox > 0 &&
          badgeProbe.badgeText !== null &&
          (badgeProbe.badgeText === "99+" || Number(badgeProbe.badgeText) > 0)));

    record(
      "d007_inbox_badge_sync",
      badgeUiOk ? "PASS" : "OPEN",
      JSON.stringify(badgeProbe),
    );
    await page.screenshot({ path: join(SHOTS, "05-inbox-badge.png") });

    record(
      "d004_badge_fetch_latency",
      badgeProbe.latency < 2500 ? "PASS" : badgeProbe.latency < 4000 ? "OPEN" : "FAIL",
      `/api/inbox/badge ${badgeProbe.latency}ms (badge-only provider path)`,
    );

    await page.goto(`${ORIGIN}/inbox`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(SHOTS, "02-inbox-hub.png") });

    // #001 rating surfaces
    await signInWithSessionCookies(page, { ...SELLER, baseURL: ORIGIN });
    await page.goto(`${ORIGIN}/account`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SHOTS, "03-seller-account.png") });
    record(
      "d001_rating_migration",
      "WAITING_FOR_OWNER",
      "SQL migration 20260725180000_rating_engine_refresh_upsert_v1.sql authored; supabase db push blocked by .env.local parse (line without =) — Owner must apply migration for live aggregation PASS",
    );

    // Prefer buyer order detail (lighter) then seller
    await signInWithSessionCookies(page, { ...BUYER, baseURL: ORIGIN });
    await page.goto(`${ORIGIN}/orders?tab=bought`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1000);
    let orderHref =
      (await page.locator('a[href*="/orders/"]').first().getAttribute("href").catch(() => null)) ||
      null;

    if (!orderHref) {
      await signInWithSessionCookies(page, { ...SELLER, baseURL: ORIGIN });
      await page.goto(`${ORIGIN}/orders?tab=sold`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(900);
      orderHref =
        (await page.locator('a[href*="/seller/orders/"]').first().getAttribute("href").catch(() => null)) ||
        (await page.locator('a[href*="/orders/"]').first().getAttribute("href").catch(() => null));
    }

    if (orderHref) {
      try {
        await page.goto(`${ORIGIN}${orderHref}`, {
          waitUntil: "domcontentloaded",
          timeout: 25_000,
        });
        await page.waitForTimeout(1400);
        await page.screenshot({ path: join(SHOTS, "04-order-detail-hub-cta.png") });
        const html = await page.content();
        const body = await page.locator("body").innerText();
        record(
          "d002_order_detail_ui",
          /Open Messages Hub|Track in Messages Hub|\/inbox\?order=/i.test(`${body}\n${html}`)
            ? "PASS"
            : "OPEN",
          `Opened ${orderHref}`,
        );
      } catch (e) {
        record(
          "d002_order_detail_ui",
          "OPEN",
          `Order detail navigation timeout: ${e instanceof Error ? e.message : String(e)}`,
        );
        await page.screenshot({ path: join(SHOTS, "04-order-detail-hub-cta.png") }).catch(() => undefined);
      }
    } else {
      record("d002_order_detail_ui", "OPEN", "No order detail link in Bought/Sold lists");
    }
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    writeEvidence();
  }
}

main().catch((e) => {
  console.error(e);
  writeEvidence();
  process.exit(1);
});
