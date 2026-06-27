/**
 * Optimizes hero campaign PNG sources → WebP + AVIF in public/hero/
 * Run: node scripts/generate-hero-campaigns.mjs
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/hero");
const SOURCE_DIR = path.join(ROOT, "source");

const CAMPAIGNS = [
  "vehicles",
  "property",
  "phones",
  "computers",
  "electronics",
  "fashion",
  "home-garden",
  "luxury",
  "verified-sellers",
  "auctions",
  "seasonal",
];

const WIDTH = 1920;
const HEIGHT = 1080;

async function processSource(sourcePath, id) {
  const pipeline = sharp(sourcePath).resize(WIDTH, HEIGHT, {
    fit: "cover",
    position: "centre",
  });

  await pipeline.clone().webp({ quality: 90, effort: 6 }).toFile(path.join(ROOT, `${id}.webp`));
  await pipeline.clone().avif({ quality: 62, effort: 6 }).toFile(path.join(ROOT, `${id}.avif`));
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR).catch(() => []);
  const pngFiles = new Set(files.filter((f) => f.endsWith(".png")));

  const missing = CAMPAIGNS.filter((id) => !pngFiles.has(`${id}.png`));
  if (missing.length > 0) {
    console.error("Missing hero PNG sources in public/hero/source/:");
    for (const id of missing) console.error(`  - ${id}.png`);
    process.exit(1);
  }

  for (const id of CAMPAIGNS) {
    await processSource(path.join(SOURCE_DIR, `${id}.png`), id);
    console.log(`✓ ${id}.webp + ${id}.avif`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify({ campaigns: CAMPAIGNS, width: WIDTH, height: HEIGHT }, null, 2),
    "utf8",
  );

  console.log(`\nOptimized ${CAMPAIGNS.length} hero campaigns → public/hero/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
