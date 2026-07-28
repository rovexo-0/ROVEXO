/**
 * Prune Next.js serverless NFT traces after `next build`.
 *
 * Turbopack production builds can over-include the whole repo when source uses
 * dynamic path.join(process.cwd(), ...) (blood/cert scanners). Vercel then
 * rejects deploy: functions exceed 250 MB uncompressed.
 *
 * Applies the same exclude intent as next.config outputFileTracingExcludes
 * onto every .nft.json under .next/server (glob star-star avoided in this
 * comment so the block does not terminate early).
 * Infrastructure only — no runtime behaviour change.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const picomatch = require("next/dist/compiled/picomatch");

const ROOT = process.cwd();
const SERVER_DIR = path.join(ROOT, ".next", "server");

const EXCLUDE_GLOBS = [
  // Heavy public trees (CDN/static only — not required inside lambdas).
  // Keep brand / production category / search heroes for startup blood checks.
  "./public/**/source/**/*",
  "./public/icons/premium-studio/**/*",
  "./public/icons/fluency-3d/**/*",
  "./public/icons/premium/**/*",
  "./public/assets/empty-states/**/*",
  "./public/hero/**/*",
  "./public/demo/**/*",
  "./lighthouse*.json",
  "./e2e-cert-run.log",
  "./*.log",
  "./scripts/**/*",
  "./e2e/**/*",
  "./tests/**/*",
  "./mobile/**/*",
  "./docs/**/*",
  "./reports/**/*",
  "./archive/**/*",
  "./apps/**/*",
  "./owner-review-screenshots/**/*",
  "./audit-captures/**/*",
  "./audit-captures-auth/**/*",
  "./test-results/**/*",
  "./playwright-report/**/*",
  "./.cursor/**/*",
  "./.next/cache/**/*",
  "./.git/**/*",
  "./.local-chromium-libs/**/*",
  "./node_modules/@sparticuz/**/*",
  "./node_modules/playwright/**/*",
  "./node_modules/playwright-core/**/*",
  "./node_modules/@playwright/**/*",
  "./node_modules/typescript/**/*",
  "./node_modules/@typescript-eslint/**/*",
  "./node_modules/eslint/**/*",
  "./node_modules/eslint-config-next/**/*",
  "./node_modules/vitest/**/*",
  "./node_modules/jsdom/**/*",
  "./node_modules/@axe-core/**/*",
  "./node_modules/@rolldown/**/*",
  "./tsconfig.tsbuildinfo",
];

/** Always keep — overrides a matching exclude (startup blood laws need these). */
const KEEP_GLOBS = [
  "./scripts/run-final-live-certification.ts",
];

function listNftFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listNftFiles(full, out);
    else if (entry.name.endsWith(".nft.json")) out.push(full);
  }
  return out;
}

function pruneNft(traceFile, shouldDrop) {
  const pageDir = path.dirname(traceFile);
  const raw = JSON.parse(fs.readFileSync(traceFile, "utf8"));
  const before = Array.isArray(raw.files) ? raw.files.length : 0;
  if (!before) return { before: 0, after: 0, bytesBefore: 0, bytesAfter: 0 };

  let bytesBefore = 0;
  let bytesAfter = 0;
  const kept = [];

  for (const file of raw.files) {
    const abs = path.resolve(pageDir, file);
    let size = 0;
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) size = fs.statSync(abs).size;
    } catch {
      size = 0;
    }
    bytesBefore += size;
    if (shouldDrop(abs)) continue;
    kept.push(file);
    bytesAfter += size;
  }

  if (kept.length !== before) {
    fs.writeFileSync(
      traceFile,
      JSON.stringify({ version: raw.version ?? 1, files: kept }),
    );
  }

  return { before, after: kept.length, bytesBefore, bytesAfter };
}

function main() {
  if (!fs.existsSync(SERVER_DIR)) {
    console.error("[prune-serverless-traces] missing .next/server — run next build first");
    process.exit(1);
  }

  const isExcluded = picomatch(
    EXCLUDE_GLOBS.map((g) => path.join(ROOT, g)),
    { dot: true, contains: true },
  );
  const isKept = picomatch(
    KEEP_GLOBS.map((g) => path.join(ROOT, g)),
    { dot: true, contains: true },
  );
  const shouldDrop = (abs) => isExcluded(abs) && !isKept(abs);

  const nfts = listNftFiles(SERVER_DIR);
  let removedFiles = 0;
  let bytesSaved = 0;
  let worstAfter = 0;
  let worstPath = "";

  for (const nft of nfts) {
    const result = pruneNft(nft, shouldDrop);
    removedFiles += result.before - result.after;
    bytesSaved += result.bytesBefore - result.bytesAfter;
    if (result.bytesAfter > worstAfter) {
      worstAfter = result.bytesAfter;
      worstPath = path.relative(ROOT, nft);
    }
  }

  const mb = (n) => `${(n / 1e6).toFixed(1)}MB`;
  console.log(
    `[prune-serverless-traces] nft=${nfts.length} removedFiles=${removedFiles} saved≈${mb(bytesSaved)} worstAfter≈${mb(worstAfter)} (${worstPath})`,
  );

  if (worstAfter > 250 * 1e6) {
    console.error(
      `[prune-serverless-traces] FAIL: worst serverless trace still ${mb(worstAfter)} > 250MB`,
    );
    process.exit(1);
  }
}

main();
