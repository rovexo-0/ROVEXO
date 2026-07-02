/**
 * Optimizes hero campaign PNG sources → WebP + AVIF + PNG in public/hero/
 * Run: node scripts/generate-hero-campaigns.mjs
 * Prefer: node scripts/generate-v12-premium-assets.mjs (full v1.2 pipeline)
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HERO_CAMPAIGN_IDS } from "./assets/premium-visual-svgs.mjs";

const ROOT = path.join(process.cwd(), "public/hero");
const SOURCE_DIR = path.join(ROOT, "source");

const WIDTHS = [768, 1280, 1920, 3840];

async function processSource(sourcePath, id) {
  const sourceBuffer = await sharp(sourcePath).resize(1920, 1080, { fit: "cover", position: "centre" }).png().toBuffer();

  for (const width of WIDTHS) {
    const height = Math.round(1080 * (width / 1920));
    const pipeline = sharp(sourceBuffer).resize(width, height, { fit: "cover", position: "centre" });
    await pipeline.clone().webp({ quality: 88, effort: 6 }).toFile(path.join(ROOT, `${id}-${width}.webp`));
    await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(ROOT, `${id}-${width}.avif`));
    await pipeline.clone().png({ compressionLevel: 9 }).toFile(path.join(ROOT, `${id}-${width}.png`));
  }

  await sharp(sourceBuffer).webp({ quality: 88, effort: 6 }).toFile(path.join(ROOT, `${id}.webp`));
  await sharp(sourceBuffer).avif({ quality: 58, effort: 6 }).toFile(path.join(ROOT, `${id}.avif`));
  await sharp(sourceBuffer).png({ compressionLevel: 9 }).toFile(path.join(ROOT, `${id}.png`));
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR).catch(() => []);
  const pngFiles = new Set(files.filter((f) => f.endsWith(".png")));

  const missing = HERO_CAMPAIGN_IDS.filter((id) => !pngFiles.has(`${id}.png`));
  if (missing.length > 0) {
    console.error("Missing hero PNG sources in public/hero/source/:");
    for (const id of missing) console.error(`  - ${id}.png`);
    console.error("\nRun: node scripts/generate-v12-premium-assets.mjs");
    process.exit(1);
  }

  for (const id of HERO_CAMPAIGN_IDS) {
    await processSource(path.join(SOURCE_DIR, `${id}.png`), id);
    console.log(`✓ ${id}`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify({ campaigns: HERO_CAMPAIGN_IDS, widths: WIDTHS, height: 1080 }, null, 2),
    "utf8",
  );

  console.log(`\nOptimized ${HERO_CAMPAIGN_IDS.length} hero campaigns → public/hero/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
