/**
 * P3.2 evidence probe — collect ChunkLoadError / recovery signals via Playwright.
 * Usage: node scripts/p32-chunkload-probe.cjs <baseUrl> <outJson> [routes...]
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const outFile = process.argv[3] || "test-results/p32-framework-boundary/probe.json";
const routes = process.argv.slice(4);
const defaultRoutes = ["/", "/login", "/search", "/browse"];
const pathList = routes.length ? routes : defaultRoutes;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();

  const chunkErrors = [];
  const unhandled = [];
  const consoleLines = [];
  let recoveryHits = 0;

  page.on("console", (msg) => {
    const t = msg.text();
    consoleLines.push({ type: msg.type(), text: t.slice(0, 500) });
    if (/ChunkLoadError|Failed to load chunk/i.test(t)) {
      chunkErrors.push({ source: "console", text: t.slice(0, 500) });
    }
    if (/rx_chunk=1|chunk_load_recovery/i.test(t)) recoveryHits += 1;
  });
  page.on("pageerror", (err) => {
    const t = String(err && err.message ? err.message : err);
    unhandled.push(t.slice(0, 500));
    if (/ChunkLoadError|Failed to load chunk/i.test(t)) {
      chunkErrors.push({ source: "pageerror", text: t.slice(0, 500) });
    }
  });

  const navigations = [];
  for (const route of pathList) {
    const url = route.startsWith("http") ? route : `${baseUrl.replace(/\/$/, "")}${route}`;
    const started = Date.now();
    let status = null;
    try {
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      status = res ? res.status() : null;
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null);
      await page.waitForTimeout(800);
    } catch (e) {
      status = `ERR:${String(e.message || e).slice(0, 120)}`;
    }
    navigations.push({ route, url, status, ms: Date.now() - started });
  }

  const page2 = await context.newPage();
  page2.on("pageerror", (err) => {
    const t = String(err && err.message ? err.message : err);
    if (/ChunkLoadError|Failed to load chunk/i.test(t)) {
      chunkErrors.push({ source: "page2-pageerror", text: t.slice(0, 500) });
    }
  });
  await page2.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null);
  await page2.waitForTimeout(1000);

  const html = await page.content().catch(() => "");
  const htmlHasRecovery =
    html.includes("rovexo_chunk_load_recovery_v1") || html.includes("__rovexoChunkRecoveryLock");

  const result = {
    baseUrl,
    at: new Date().toISOString(),
    chunkLoadError: chunkErrors.length > 0,
    chunkErrorCount: chunkErrors.length,
    chunkErrors: chunkErrors.slice(0, 30),
    unhandledRejectionOrPageError: unhandled.length > 0,
    unhandledSample: unhandled.slice(0, 20),
    recoverySignalCount: recoveryHits,
    htmlMentionsRecoveryKeys: htmlHasRecovery,
    navigations,
    consoleSample: consoleLines.filter((c) => /error|chunk|fail/i.test(c.text)).slice(0, 40),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ outFile, chunkLoadError: result.chunkLoadError, count: result.chunkErrorCount }, null, 2));
  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
