/**
 * Import approved-style premium photography into source master folders.
 * Populates public/categories/source/*.png and public/hero/source/*.png only.
 *
 * Run: node scripts/import-premium-photo-sources.mjs
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { composePremiumStudioMaster } from "./assets/premium-studio-compose.mjs";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import {
  CATEGORY_PHOTO_SOURCES,
  EXTENDED_CATEGORY_KEYS,
  HERO_PHOTO_SOURCES,
} from "./assets/premium-photo-manifest.mjs";

const CATEGORY_SOURCE = path.join(process.cwd(), "public/categories/source");
const HERO_SOURCE = path.join(process.cwd(), "public/hero/source");
const CATEGORY_MASTER = 1024;
const HERO_W = 1920;
const HERO_H = 1080;
const FORCE = process.env.FORCE === "1";
const MIN_VALID_BYTES = 50_000;

async function shouldSkipSource(outputPath) {
  if (FORCE) return false;
  try {
    const { size } = await stat(outputPath);
    return size >= MIN_VALID_BYTES;
  } catch {
    return false;
  }
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; ROVEXO-Asset-Importer/1.0)",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type for ${url}: ${contentType}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchPhoto(urls) {
  let lastError;
  for (const url of urls) {
    try {
      return await fetchBuffer(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Premium studio isolation — photorealistic transparent masters */
async function isolateProduct(buffer) {
  return composePremiumStudioMaster(buffer, CATEGORY_MASTER, 0.8);
}

async function importCategoryIcon(key) {
  const meta = CATEGORY_PHOTO_SOURCES[key];
  if (!meta) throw new Error(`Missing photo manifest entry for category: ${key}`);

  const output = path.join(CATEGORY_SOURCE, `${key}.png`);
  if (await shouldSkipSource(output)) {
    console.log(`↷ skip category ${key} (valid source exists)`);
    return;
  }

  const buffer = await fetchPhoto(meta.urls);
  const isolated = await isolateProduct(buffer);
  await writeFile(output, isolated);
  console.log(`✓ source category ${key}`);
}

async function importHeroCampaign(id) {
  const meta = HERO_PHOTO_SOURCES[id];
  if (!meta) throw new Error(`Missing photo manifest entry for hero: ${id}`);

  const output = path.join(HERO_SOURCE, `${id}.png`);
  if (await shouldSkipSource(output)) {
    console.log(`↷ skip hero ${id} (valid source exists)`);
    return;
  }

  const buffer = await fetchPhoto(meta.urls);
  const composed = await sharp(buffer)
    .resize(HERO_W, HERO_H, { fit: "cover", position: "centre" })
    .modulate({ brightness: 1.02, saturation: 1.08 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(HERO_SOURCE, `${id}.png`), composed);
  console.log(`✓ source hero ${id}`);
}

async function main() {
  await mkdir(CATEGORY_SOURCE, { recursive: true });
  await mkdir(HERO_SOURCE, { recursive: true });

  const categoryKeys = [...new Set([...HOME_CATEGORY_ICON_TYPES, ...EXTENDED_CATEGORY_KEYS])];

  const failures = [];

  console.log("Importing premium category photography masters…");
  for (const key of categoryKeys) {
    try {
      await importCategoryIcon(key);
    } catch (error) {
      failures.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`✗ category ${key}`);
    }
  }

  console.log("\nImporting premium hero campaign photography masters…");
  for (const id of Object.keys(HERO_PHOTO_SOURCES)) {
    try {
      await importHeroCampaign(id);
    } catch (error) {
      failures.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`✗ hero ${id}`);
    }
  }

  if (failures.length > 0) {
    console.error("\nImport failures:");
    for (const item of failures) console.error(`  - ${item}`);
    process.exit(1);
  }

  await writeFile(
    path.join(CATEGORY_SOURCE, "manifest.json"),
    JSON.stringify(
      {
        version: "approved-premium-photography",
        pipeline: "source-photography-only",
        importedAt: new Date().toISOString(),
        keys: categoryKeys,
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    path.join(HERO_SOURCE, "manifest.json"),
    JSON.stringify(
      {
        version: "approved-premium-photography",
        pipeline: "source-photography-only",
        importedAt: new Date().toISOString(),
        campaigns: Object.keys(HERO_PHOTO_SOURCES),
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ Imported ${categoryKeys.length} category + ${Object.keys(HERO_PHOTO_SOURCES).length} hero source masters`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
