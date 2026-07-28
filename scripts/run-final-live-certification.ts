#!/usr/bin/env node
/**
 * Absolute Blood Law XLV — Final Live Production Certification Runner
 *
 * LIVE on http://localhost:3000 only.
 * Isolated Demo Session (XLIV). Fail-closed: first FAIL stops.
 * Evidence: before/after screenshots · console · network · HTML report.
 *
 * Usage:
 *   npx tsx scripts/run-final-live-certification.ts
 *   FINAL_CERT_CONTINUE=1 …  # continue after FAIL (Owner override — not production)
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { loadDotEnvFiles } from "./playwright-env.mjs";
import {
  FINAL_LIVE_CERTIFICATION_V1,
  XLV_MANDATORY_SURFACES,
  XLV_CRITICAL_VIDEO_FLOWS,
} from "../lib/full-demo/final-live-certification-v1";
import {
  discoverAppRoutes,
  isStaticCrawlableRoute,
} from "../lib/full-demo/discover-app-routes-v1";

loadDotEnvFiles();

const HOST = process.env.FINAL_CERT_HOST ?? FINAL_LIVE_CERTIFICATION_V1.host;
const OUT = path.join(process.cwd(), "test-results", "final-live-certification-xlv");
const CONTINUE_ON_FAIL = process.env.FINAL_CERT_CONTINUE === "1";

/** Ensure Playwright Chromium can load workspace-bundled libs (libnspr4 etc.). */
function ensureChromiumLibs() {
  const libDir = path.join(process.cwd(), ".local-chromium-libs", "lib");
  if (fs.existsSync(path.join(libDir, "libnspr4.so"))) {
    process.env.LD_LIBRARY_PATH = [libDir, process.env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(":");
  }
}
ensureChromiumLibs();

function ensureDirs() {
  fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), "utf8");
}

function writeHtmlReport(rows, meta) {
  const matrix = rows
    .map(
      (r) =>
        `<tr class="${r.result}"><td>${r.id}</td><td>${r.role}</td><td>${r.result}</td><td>${r.ms}ms</td><td>${r.description}</td><td>${r.before ? `<a href="${path.relative(OUT, r.before)}">before</a>` : ""} ${r.after ? `<a href="${path.relative(OUT, r.after)}">after</a>` : ""}</td></tr>`,
    )
    .join("\n");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>ROVEXO Final Live Certification XLV</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#0b0b0f;color:#f5f5f7}
h1{color:#a855f7} table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #333;padding:8px;font-size:13px;vertical-align:top}
tr.PASS{background:#052e16} tr.FAIL{background:#450a0a} tr.WARNING{background:#422006}
tr.BLOCKED_OWNER{background:#1e1b4b} a{color:#c4b5fd}
.meta{opacity:.85;line-height:1.5}
</style></head><body>
<h1>FULL PLATFORM CERTIFICATION REPORT — Blood XLV</h1>
<div class="meta">
<p><strong>Host:</strong> ${meta.host}</p>
<p><strong>Started:</strong> ${meta.startedAt}</p>
<p><strong>Finished:</strong> ${meta.finishedAt}</p>
<p><strong>Demo Session:</strong> ${meta.sessionId ?? "n/a"}</p>
<p><strong>Production unchanged:</strong> ${meta.productionUnchanged}</p>
<p><strong>PASS:</strong> ${meta.pass} · <strong>FAIL:</strong> ${meta.fail} · <strong>WARNING:</strong> ${meta.warning}</p>
<p><strong>Production Ready:</strong> ${meta.productionReady ? "YES" : "NO — DEPLOYMENT BLOCKED"}</p>
<p>${meta.stopReason ? `<strong>Stopped:</strong> ${meta.stopReason}` : ""}</p>
</div>
<h2>PASS / FAIL Matrix</h2>
<table><thead><tr><th>ID</th><th>Role</th><th>Result</th><th>Time</th><th>Description</th><th>Evidence</th></tr></thead>
<tbody>${matrix}</tbody></table>
<h2>Galleries</h2>
<p>Screenshots: <code>screenshots/</code> · Videos: <code>videos/</code></p>
</body></html>`;
  fs.writeFileSync(path.join(OUT, "FULL_PLATFORM_CERTIFICATION_REPORT.html"), html, "utf8");
  // Printable PDF surrogate (Owner can Print → PDF from browser)
  fs.writeFileSync(
    path.join(OUT, "FULL_PLATFORM_CERTIFICATION_REPORT.pdf.html"),
    html,
    "utf8",
  );
}

function writeTextReport(rows, meta) {
  const lines = [
    "==========================================================",
    "FULL PLATFORM CERTIFICATION REPORT — BLOOD XLV",
    "FINAL LIVE PRODUCTION CERTIFICATION",
    "==========================================================",
    `HOST: ${meta.host}`,
    `STARTED: ${meta.startedAt}`,
    `FINISHED: ${meta.finishedAt}`,
    `DEMO SESSION: ${meta.sessionId ?? "n/a"}`,
    `PRODUCTION UNCHANGED: ${meta.productionUnchanged}`,
    `PASS: ${meta.pass} FAIL: ${meta.fail} WARNING: ${meta.warning}`,
    `PRODUCTION READY: ${meta.productionReady ? "YES" : "NO"}`,
    meta.stopReason ? `STOPPED: ${meta.stopReason}` : "",
    "",
    ...rows.map(
      (r) =>
        `${r.id} [${r.role}] ${r.result} ${r.ms}ms — ${r.description}` +
        (r.consoleErrors.length ? ` | console=${r.consoleErrors.length}` : "") +
        (r.networkErrors.length ? ` | network=${r.networkErrors.length}` : ""),
    ),
    "",
    "DEPLOYMENT IS ABSOLUTELY BLOCKED UNTIL CERTIFICATION COMPLETES SUCCESSFULLY.",
    "==========================================================",
  ];
  fs.writeFileSync(
    path.join(OUT, "FULL_PLATFORM_CERTIFICATION_REPORT.txt"),
    lines.filter(Boolean).join("\n"),
    "utf8",
  );
}

async function safeGoto(page, url) {
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(400);
  return res;
}

async function capturePair(page, slug) {
  const before = path.join(OUT, "screenshots", `${slug}__before.png`);
  const after = path.join(OUT, "screenshots", `${slug}__after.png`);
  await page.screenshot({ path: before, fullPage: true });
  return { before, after };
}

async function interactVisibleControls(page) {
  const summary = { buttons: 0, inputs: 0, toggles: 0, clicked: 0 };
  const buttons = page.locator(
    'button:visible, a[role="button"]:visible, [data-testid]:visible',
  );
  summary.buttons = await buttons.count();
  const inputs = page.locator(
    'input:visible:not([type="hidden"]), textarea:visible, select:visible',
  );
  summary.inputs = await inputs.count();
  const toggles = page.locator(
    'input[type="checkbox"]:visible, input[type="radio"]:visible, [role="switch"]:visible',
  );
  summary.toggles = await toggles.count();

  // Soft interaction: focus first safe text input if present (no submit).
  const textInput = page.locator('input[type="text"]:visible, input[type="search"]:visible, input[type="email"]:visible').first();
  if (await textInput.count()) {
    try {
      await textInput.focus({ timeout: 1000 });
      summary.clicked += 1;
    } catch {
      // ignore
    }
  }
  return summary;
}

async function main() {
  ensureDirs();
  const startedAt = new Date().toISOString();
  /** @type {CertRow[]} */
  const rows = [];
  let sessionId = null;
  let productionUnchanged = false;
  let stopReason = "";
  let aborted = false;

  // Probe host
  try {
    const probe = await fetch(HOST, { redirect: "manual" });
    if (![200, 301, 302, 307, 308].includes(probe.status)) {
      throw new Error(`Host ${HOST} returned ${probe.status}`);
    }
  } catch {
    console.error(`FATAL: ${HOST} unreachable. Start npm run dev -p 3000.`);
    process.exit(2);
  }

  // Demo session (optional if migration missing — record WARNING and continue guest crawl)
  try {
    const engineMod = await import("../lib/full-demo/demo-session-engine-v1.ts");
    const engine = (engineMod as { default?: typeof engineMod }).default ?? engineMod;
    const createDemoCertificationSession = (
      engine as {
        createDemoCertificationSession: (input: {
          maxListings?: number;
        }) => Promise<{
          ok: boolean;
          sessionId?: string;
          demoListingIds?: string[];
          code?: string;
          message?: string;
        }>;
      }
    ).createDemoCertificationSession;
    const created = await createDemoCertificationSession({ maxListings: 5 });
    if (created.ok) {
      sessionId = created.sessionId ?? null;
      rows.push({
        id: "00_demo_session_create",
        result: "PASS",
        role: "system",
        ms: 0,
        description: `Demo session ${sessionId} · copies=${created.demoListingIds?.length ?? 0} · wallets buyer/seller/business £100k`,
        consoleErrors: [],
        networkErrors: [],
      });
    } else {
      rows.push({
        id: "00_demo_session_create",
        result: "WARNING",
        role: "system",
        ms: 0,
        description: `${created.code}: ${created.message} — apply XLIV migration for isolated copies`,
        consoleErrors: [],
        networkErrors: [],
      });
    }
  } catch (error) {
    rows.push({
      id: "00_demo_session_create",
      result: "WARNING",
      role: "system",
      ms: 0,
      description: error instanceof Error ? error.message : String(error),
      consoleErrors: [],
      networkErrors: [],
    });
  }

  const discovered = discoverAppRoutes(process.cwd());
  const staticRoutes = discovered.filter(isStaticCrawlableRoute);
  writeJson("discovered-routes.json", { total: discovered.length, static: staticRoutes.length, routes: discovered });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    recordVideo: { dir: path.join(OUT, "videos"), size: { width: 430, height: 932 } },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 500) networkErrors.push(`${res.status()} ${res.url()}`);
  });

  async function runSurface(id, routePath, role) {
    if (aborted) return;
    const started = Date.now();
    const slug = `${String(rows.length + 1).padStart(3, "0")}_${role}_${id}`.replace(/[^\w.-]+/g, "_");
    consoleErrors.length = 0;
    networkErrors.length = 0;
    const url = new URL(routePath, HOST).toString();
    let before = "";
    let after = "";
    try {
      const pair = await capturePair(page, slug);
      before = pair.before;
      const res = await safeGoto(page, url);
      const status = res?.status() ?? 0;
      const body = await page.locator("body").innerText().catch(() => "");
      const white =
        !body ||
        body.trim().length < 8 ||
        /something went wrong|application error|internal server error/i.test(body);
      const summary = await interactVisibleControls(page);
      await page.screenshot({ path: pair.after, fullPage: true });
      after = pair.after;

      const fail =
        status >= 500 ||
        white ||
        networkErrors.length > 0;

      const row = {
        id: `${role}:${id}`,
        result: fail ? "FAIL" : "PASS",
        path: routePath,
        role,
        before,
        after,
        ms: Date.now() - started,
        description: fail
          ? `FAIL status=${status} white=${white} net=${networkErrors.length} console=${consoleErrors.length}`
          : `OK status=${status} buttons=${summary.buttons} inputs=${summary.inputs} toggles=${summary.toggles}`,
        consoleErrors: [...consoleErrors],
        networkErrors: [...networkErrors],
      };
      rows.push(row);

      if (fail) {
        stopReason = row.description;
        if (!CONTINUE_ON_FAIL) {
          aborted = true;
          console.error(`\nSTOP — FAIL CLOSED at ${row.id}: ${stopReason}\n`);
        }
      }
    } catch (error) {
      const row = {
        id: `${role}:${id}`,
        result: "FAIL",
        path: routePath,
        role,
        before,
        after,
        ms: Date.now() - started,
        description: error instanceof Error ? error.message : String(error),
        consoleErrors: [...consoleErrors],
        networkErrors: [...networkErrors],
      };
      rows.push(row);
      stopReason = row.description;
      if (!CONTINUE_ON_FAIL) {
        aborted = true;
        console.error(`\nSTOP — FAIL CLOSED at ${row.id}: ${stopReason}\n`);
      }
    }
  }

  /** Resolve demo credentials for role — Full Demo permanence accounts preferred. */
  async function resolveRoleCredentials(role) {
    const { FULL_DEMO_ACCOUNTS } = await import("../lib/full-demo/canonical.ts");
    const { DEMO_USERS, resolveDemoSeedPassword } = await import(
      "../lib/demo-environment/config.ts"
    );
    if (role === "buyer") {
      const a = FULL_DEMO_ACCOUNTS.find((x) => x.key === "live-buyer");
      return a?.password ? { email: a.email, password: a.password } : null;
    }
    if (role === "seller") {
      const a = FULL_DEMO_ACCOUNTS.find((x) => x.key === "live-seller");
      return a?.password ? { email: a.email, password: a.password } : null;
    }
    if (role === "business") {
      const u = DEMO_USERS.find((x) => x.key === "business01");
      if (!u) return null;
      return { email: u.email, password: resolveDemoSeedPassword() };
    }
    if (role === "admin") {
      const u = DEMO_USERS.find((x) => x.key === "admin");
      if (!u) return null;
      return { email: u.email, password: resolveDemoSeedPassword() };
    }
    if (role === "super_admin") {
      const u = DEMO_USERS.find((x) => x.key === "superadmin");
      if (!u) return null;
      return { email: u.email, password: resolveDemoSeedPassword() };
    }
    return null;
  }

  async function signInRole(role) {
    const creds = await resolveRoleCredentials(role);
    if (!creds) {
      rows.push({
        id: `auth:${role}`,
        result: "WARNING",
        role,
        ms: 0,
        description: `No credentials for ${role} — role surfaces skipped`,
        consoleErrors: [],
        networkErrors: [],
      });
      return false;
    }
    const started = Date.now();
    try {
      await context.clearCookies();
      const authMod = await import("../e2e/helpers/auth.ts");
      const auth = (authMod as { default?: typeof authMod }).default ?? authMod;
      const signInWithSessionCookies = (
        auth as {
          signInWithSessionCookies: (page: typeof page, input: {
            email: string;
            password: string;
            baseURL: string;
          }) => Promise<void>;
        }
      ).signInWithSessionCookies;
      await signInWithSessionCookies(page, {
        email: creds.email,
        password: creds.password,
        baseURL: HOST,
      });
      rows.push({
        id: `auth:${role}`,
        result: "PASS",
        role,
        ms: Date.now() - started,
        description: `Signed in ${creds.email} (session cookies)`,
        consoleErrors: [],
        networkErrors: [],
      });
      return true;
    } catch (error) {
      rows.push({
        id: `auth:${role}`,
        result: "FAIL",
        role,
        ms: Date.now() - started,
        description: error instanceof Error ? error.message : String(error),
        consoleErrors: [],
        networkErrors: [],
      });
      stopReason = rows[rows.length - 1].description;
      if (!CONTINUE_ON_FAIL) {
        aborted = true;
        console.error(`\nSTOP — FAIL CLOSED at auth:${role}: ${stopReason}\n`);
      }
      return false;
    }
  }

  // Guest mandatory surfaces
  for (const surface of XLV_MANDATORY_SURFACES) {
    if (aborted) break;
    if (!surface.roles.includes("guest")) continue;
    await runSurface(surface.id, surface.path, "guest");
  }

  // Guest static route crawl (completeness)
  for (const route of staticRoutes) {
    if (aborted) break;
    if (XLV_MANDATORY_SURFACES.some((s) => s.path === route)) continue;
    // Skip auth-gated shells for guest
    if (
      route.startsWith("/admin") ||
      route.startsWith("/super-admin") ||
      route.startsWith("/business") ||
      route.startsWith("/inbox") ||
      route.startsWith("/orders") ||
      route.startsWith("/wallet") ||
      route.startsWith("/balance") ||
      route.startsWith("/checkout") ||
      route.startsWith("/sell") ||
      route.startsWith("/account") ||
      route.startsWith("/saved") ||
      route.startsWith("/notifications")
    ) {
      continue;
    }
    await runSurface(`discover:${route}`, route, "guest");
  }

  // Authenticated roles — mandatory surfaces + role route prefixes
  const authenticatedRoles = ["buyer", "seller", "business", "admin", "super_admin"];
  for (const role of authenticatedRoles) {
    if (aborted) break;
    const ok = await signInRole(role);
    if (!ok) continue;

    for (const surface of XLV_MANDATORY_SURFACES) {
      if (aborted) break;
      if (!surface.roles.includes(role)) continue;
      await runSurface(surface.id, surface.path, role);
    }

    // Role-scoped discovery
    for (const route of staticRoutes) {
      if (aborted) break;
      if (XLV_MANDATORY_SURFACES.some((s) => s.path === route)) continue;
      const include =
        (role === "buyer" &&
          (route.startsWith("/account") ||
            route.startsWith("/orders") ||
            route.startsWith("/wallet") ||
            route.startsWith("/balance") ||
            route.startsWith("/saved") ||
            route.startsWith("/inbox") ||
            route.startsWith("/notifications") ||
            route.startsWith("/checkout"))) ||
        (role === "seller" &&
          (route.startsWith("/sell") ||
            route.startsWith("/orders") ||
            route.startsWith("/wallet") ||
            route.startsWith("/balance") ||
            route.startsWith("/inbox") ||
            route.startsWith("/account"))) ||
        (role === "business" && route.startsWith("/business")) ||
        (role === "admin" && route.startsWith("/admin")) ||
        (role === "super_admin" && route.startsWith("/super-admin"));
      if (include) {
        await runSurface(`discover:${route}`, route, role);
      }
    }
  }

  // Critical video markers (homepage already recorded via context video)
  writeJson("critical-video-flows.json", {
    required: XLV_CRITICAL_VIDEO_FLOWS,
    note: "Playwright context video captures continuous session across guest + authenticated roles.",
  });

  writeJson("bug-report.json", {
    failures: rows.filter((r) => r.result === "FAIL"),
    warnings: rows.filter((r) => r.result === "WARNING"),
  });
  writeJson("fix-report.json", {
    note: "Fixes applied during this certification run are recorded in results after RCA STOP cycles.",
    applied: [],
  });
  writeJson("regression-report.json", {
    chain: [
      "Notifications",
      "Messages",
      "Offers",
      "Counter Offers",
      "Orders",
      "Wallet",
      "Badges",
      "Dashboards",
    ],
    status: aborted ? "BLOCKED_UNTIL_FAIL_FIXED" : "PENDING_FULL_PASS",
  });
  writeJson("performance-report.json", {
    rows: rows.map((r) => ({ id: r.id, ms: r.ms, result: r.result })),
  });

  await context.close();
  await browser.close();

  // Teardown demo session
  if (sessionId) {
    try {
      const engineMod = await import("../lib/full-demo/demo-session-engine-v1.ts");
      const engine = (engineMod as { default?: typeof engineMod }).default ?? engineMod;
      const destroyDemoCertificationSession = (
        engine as {
          destroyDemoCertificationSession: (id: string) => Promise<{
            ok: boolean;
            productionUnchanged?: boolean;
            deletedArtifacts?: number;
            message?: string;
          }>;
        }
      ).destroyDemoCertificationSession;
      const destroyed = await destroyDemoCertificationSession(sessionId);
      productionUnchanged = destroyed.ok === true && destroyed.productionUnchanged === true;
      rows.push({
        id: "99_demo_session_destroy",
        result: destroyed.ok ? "PASS" : "FAIL",
        role: "system",
        ms: 0,
        description: destroyed.ok
          ? `Teardown OK deleted=${destroyed.deletedArtifacts}`
          : destroyed.message,
        consoleErrors: [],
        networkErrors: [],
      });
      if (!destroyed.ok && !CONTINUE_ON_FAIL) {
        stopReason = destroyed.message;
      }
    } catch (error) {
      rows.push({
        id: "99_demo_session_destroy",
        result: "FAIL",
        role: "system",
        ms: 0,
        description: error instanceof Error ? error.message : String(error),
        consoleErrors: [],
        networkErrors: [],
      });
    }
  } else {
    productionUnchanged = true;
  }

  const finishedAt = new Date().toISOString();
  const pass = rows.filter((r) => r.result === "PASS").length;
  const fail = rows.filter((r) => r.result === "FAIL").length;
  const warning = rows.filter((r) => r.result === "WARNING").length;
  const productionReady = fail === 0 && !aborted && productionUnchanged && Boolean(sessionId);

  const meta = {
    host: HOST,
    startedAt,
    finishedAt,
    sessionId,
    productionUnchanged,
    pass,
    fail,
    warning,
    productionReady,
    stopReason,
    bloodLaw: "XLV",
  };

  writeJson("results.json", { meta, rows });
  writeHtmlReport(rows, meta);
  writeTextReport(rows, meta);

  console.log(`\nReport: ${path.join(OUT, "FULL_PLATFORM_CERTIFICATION_REPORT.html")}`);
  console.log(`PASS=${pass} FAIL=${fail} WARNING=${warning} PRODUCTION_READY=${productionReady}`);

  if (!productionReady) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
