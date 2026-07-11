#!/usr/bin/env node
/**
 * Phase 1 — compare Production vs Preview route responses (no secrets).
 */
const PROD = process.env.ROVEXO_PRODUCTION_URL || "https://www.rovexo.co.uk";
const PREVIEW = process.env.ROVEXO_PREVIEW_URL;

if (!PREVIEW) {
  console.error("Set ROVEXO_PREVIEW_URL to the preview deployment URL.");
  process.exit(1);
}

const ROUTES = [
  "/",
  "/search",
  "/categories",
  "/sell",
  "/sell/new",
  "/account",
  "/account/settings",
  "/messages",
  "/notifications",
  "/orders",
  "/wallet",
  "/login",
  "/signup",
  "/offline",
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
  "/sitemap.xml",
  "/api/health",
];

async function fetchMeta(base, path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  const title = text.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
  return { status: res.status, ct, len: text.length, title, hash: simpleHash(text) };
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 50000); i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

async function main() {
  console.log(`Production: ${PROD}`);
  console.log(`Preview:    ${PREVIEW}\n`);

  const rows = [];
  let pass = 0;
  let fail = 0;

  for (const path of ROUTES) {
    const [p, v] = await Promise.all([fetchMeta(PROD, path), fetchMeta(PREVIEW, path)]);
    const statusOk = p.status === v.status;
    const titleOk = p.title === v.title || (!p.title && !v.title);
    const ctOk = p.ct.split(";")[0] === v.ct.split(";")[0];
    const lenClose = Math.abs(p.len - v.len) <= Math.max(500, p.len * 0.02);
    const ok = statusOk && titleOk && ctOk && (path.includes("/api/") ? lenClose : true);

    if (ok) pass++;
    else fail++;

    rows.push({ path, ok, prod: p, preview: v, statusOk, titleOk, ctOk });
  }

  for (const r of rows) {
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(
      `${mark} ${r.path} | prod ${r.prod.status} preview ${r.preview.status} | title match ${r.titleOk} | ct ${r.ctOk}`,
    );
    if (!r.ok && r.prod.title !== r.preview.title) {
      console.log(`       prod title:   ${r.prod.title}`);
      console.log(`       prev title:   ${r.preview.title}`);
    }
  }

  // PWA manifest field compare
  const [mProd, mPrev] = await Promise.all([
    fetch(`${PROD}/manifest.webmanifest`).then((r) => r.json()),
    fetch(`${PREVIEW}/manifest.webmanifest`).then((r) => r.json()),
  ]);
  const manifestKeys = ["name", "short_name", "display", "theme_color", "start_url", "scope"];
  let manifestOk = true;
  for (const k of manifestKeys) {
    if (mProd[k] !== mPrev[k]) manifestOk = false;
  }
  console.log(`\nPWA manifest core fields: ${manifestOk ? "PASS" : "FAIL"}`);
  if (mProd.id !== mPrev.id) {
    console.log(`  Note: manifest id differs (expected if NEXT_PUBLIC_APP_URL matches): prod=${mProd.id} preview=${mPrev.id}`);
  }

  console.log(`\nSummary: ${pass}/${ROUTES.length} routes matched | ${fail} differences`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
