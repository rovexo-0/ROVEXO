/**
 * Removes stale development hero exports and legacy category folders
 * that block production asset validation. Does not touch approved sources.
 *
 * Run: node scripts/cleanup-stale-production-assets.mjs
 */
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const HERO_CAMPAIGN_IDS = new Set([
  "move-store",
  "zero-fees",
  "verified-businesses",
  "buy-securely",
  "fast-delivery",
  "electronics-deals",
  "home-garden",
  "premium-auctions",
]);

const HERO_WIDTHS = new Set(["768", "1280", "1920", "3840"]);
const KEEP_HERO_FILES = new Set(["manifest.json", "blur-placeholders.json"]);
const IMAGE_EXTENSIONS = new Set([".avif", ".webp", ".png"]);

function parseHeroBasename(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const match = base.match(/^(.+?)(?:-(768|1280|1920|3840))?$/);
  return { ext, campaignId: match?.[1] ?? null, width: match?.[2] ?? null };
}

function isApprovedHeroProductionFile(filename) {
  if (KEEP_HERO_FILES.has(filename)) return true;
  const { ext, campaignId, width } = parseHeroBasename(filename);
  if (!IMAGE_EXTENSIONS.has(ext) || !campaignId) return false;
  if (!HERO_CAMPAIGN_IDS.has(campaignId)) return false;
  if (width && !HERO_WIDTHS.has(width)) return false;
  return true;
}

async function cleanupHeroProduction() {
  const heroRoot = path.join(process.cwd(), "public/hero");
  const entries = await readdir(heroRoot);
  let removed = 0;

  for (const entry of entries) {
    const fullPath = path.join(heroRoot, entry);
    const info = await stat(fullPath);
    if (!info.isFile()) continue;
    if (isApprovedHeroProductionFile(entry)) continue;
    await rm(fullPath);
    removed += 1;
    console.log(`✓ removed stale hero asset ${entry}`);
  }

  return removed;
}

async function cleanupLegacyCategoryHome() {
  const legacyDir = path.join(process.cwd(), "public/categories/home");
  try {
    await stat(legacyDir);
  } catch {
    return 0;
  }

  await rm(legacyDir, { recursive: true, force: true });
  console.log("✓ removed legacy public/categories/home/");
  return 1;
}

async function main() {
  const heroRemoved = await cleanupHeroProduction();
  const legacyRemoved = await cleanupLegacyCategoryHome();
  console.log(`\nCleanup complete: ${heroRemoved} stale hero files, ${legacyRemoved} legacy directories`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
