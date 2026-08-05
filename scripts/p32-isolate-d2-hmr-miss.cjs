/**
 * P3.2 isolate D2 — delete live HMR chunks while tab open (no ROVEXO code).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out =
    "/home/mihai/ROVEXO/test-results/p32-framework-boundary/isolate-D2-delete-live-hmr-chunk.json";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const chunkErrors = [];
  const push = (t, source) => {
    const s = String(t || "");
    if (/ChunkLoadError|Failed to load chunk|Loading chunk/i.test(s)) {
      chunkErrors.push({ source, text: s.slice(0, 500) });
    }
  };
  page.on("pageerror", (e) => push(e.message, "pageerror"));
  page.on("console", (m) => push(m.text(), "console"));

  await page.goto("http://127.0.0.1:3011/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);

  const chunkDir = "/tmp/p32-next16-isolate/.next/dev/static/chunks";
  const deleted = [];
  try {
    const files = fs.readdirSync(chunkDir).filter((f) => /hmr-client/i.test(f) && f.endsWith(".js"));
    for (const f of files) {
      fs.unlinkSync(path.join(chunkDir, f));
      deleted.push(f);
    }
  } catch (e) {
    deleted.push("delete_err:" + String(e.message || e));
  }

  fs.appendFileSync(
    "/tmp/p32-next16-isolate/src/app/page.tsx",
    `\n// P32_FORCE_HMR_${Date.now()}\n`,
  );

  await page.waitForTimeout(2500);

  try {
    await page.evaluate(async () => {
      try {
        await import(
          "/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_DOES_NOT_EXIST._.js"
        );
      } catch (e) {
        console.error(String(e && e.message ? e.message : e));
        throw e;
      }
    });
  } catch (e) {
    push(String(e.message || e), "evaluate");
  }

  await page.waitForTimeout(1500);
  try {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e) {
    push(e.message, "reload");
  }
  await page.waitForTimeout(1500);

  const result = {
    at: new Date().toISOString(),
    scenario: "D2_delete_live_hmr_chunk_plus_forced_import",
    deletedHmrFiles: deleted,
    chunkLoadError: chunkErrors.length > 0,
    chunkErrorCount: chunkErrors.length,
    chunkErrors: chunkErrors.slice(0, 20),
    note: "Clean Next 16.2.12 isolate — no ROVEXO recovery",
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      out,
      chunkLoadError: result.chunkLoadError,
      count: result.chunkErrorCount,
      deleted: deleted.length,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
