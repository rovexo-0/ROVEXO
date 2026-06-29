/**
 * Production asset export — reads ONLY public category and hero source PNG masters.
 * No SVG. No procedural illustration generators.
 *
 * Run:
 *   node scripts/import-premium-photo-sources.mjs   (populate sources)
 *   node scripts/generate-production-from-sources.mjs
 */
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import { EXTENDED_CATEGORY_KEYS, HERO_PHOTO_SOURCES } from "./assets/premium-photo-manifest.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const HERO_ROOT = path.join(process.cwd(), "public/hero");
const HERO_SOURCE = path.join(HERO_ROOT, "source");

const CATEGORY_SIZES = [64, 128, 256, 512, 1024];
const HERO_WIDTHS = [768, 1280, 1920, 3840];
const HERO_W = 1920;
const HERO_H = 1080;
const HERO_HEIGHT = 1080;
const HERO_CAMPAIGN_IDS = Object.keys(HERO_PHOTO_SOURCES);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function exportFormats(pipeline, basePath, suffix = "") {
  const tag = suffix ? `-${suffix}` : "";
  await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${basePath}${tag}.webp`);
  await pipeline.clone().avif({ quality: 60, effort: 6 }).toFile(`${basePath}${tag}.avif`);
  await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${basePath}${tag}.png`);
}

async function exportCategoryIcon(icon, masterBuffer) {
  for (const size of CATEGORY_SIZES) {
    const pipeline = sharp(masterBuffer).resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const base = path.join(CATEGORY_ROOT, icon);
    if (size === 1024) {
      await exportFormats(pipeline, base);
    } else {
      await exportFormats(pipeline, base, size);
    }
  }
  console.log(`✓ category ${icon}`);
}

async function exportHeroCampaign(id, masterBuffer) {
  const sourceBuffer = await sharp(masterBuffer)
    .resize(HERO_W, HERO_H, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  for (const width of HERO_WIDTHS) {
    const height = Math.round(HERO_HEIGHT * (width / 1920));
    const pipeline = sharp(sourceBuffer).resize(width, height, { fit: "cover", position: "centre" });
    await exportFormats(pipeline, path.join(HERO_ROOT, id), width);
  }

  await exportFormats(sharp(sourceBuffer), path.join(HERO_ROOT, id));
  console.log(`✓ hero ${id}`);
}

async function main() {
  const categoryKeys = [...new Set([...HOME_CATEGORY_ICON_TYPES, ...EXTENDED_CATEGORY_KEYS])];
  const missing = [];

  for (const key of categoryKeys) {
    const sourcePath = path.join(CATEGORY_SOURCE, `${key}.png`);
    if (!(await exists(sourcePath))) missing.push(sourcePath);
  }
  for (const id of HERO_CAMPAIGN_IDS) {
    const sourcePath = path.join(HERO_SOURCE, `${id}.png`);
    if (!(await exists(sourcePath))) missing.push(sourcePath);
  }

  if (missing.length > 0) {
    console.error("\n[ROVEXO] Missing premium source masters:\n");
    for (const item of missing) console.error(`  - ${item}`);
    console.error("\nRun: node scripts/import-premium-photo-sources.mjs\n");
    process.exit(1);
  }

  console.log("Exporting category responsive assets from photography masters…");
  for (const icon of categoryKeys) {
    const masterBuffer = await readFile(path.join(CATEGORY_SOURCE, `${icon}.png`));
    await exportCategoryIcon(icon, masterBuffer);
  }

  console.log("\nExporting hero responsive assets from photography masters…");
  const heroBlurs = {};
  for (const id of HERO_CAMPAIGN_IDS) {
    const masterBuffer = await readFile(path.join(HERO_SOURCE, `${id}.png`));
    await exportHeroCampaign(id, masterBuffer);
    const tiny = await sharp(masterBuffer)
      .resize(16, 9, { fit: "cover" })
      .webp({ quality: 15 })
      .toBuffer();
    heroBlurs[id] = `data:image/webp;base64,${tiny.toString("base64")}`;
  }

  await writeFile(
    path.join(CATEGORY_ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "approved-premium-photography",
        pipeline: "source-photography-only",
        railIcons: HOME_CATEGORY_ICON_TYPES,
        extendedIcons: EXTENDED_CATEGORY_KEYS,
        sizes: CATEGORY_SIZES,
        formats: ["avif", "webp", "png"],
        master: 1024,
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    path.join(HERO_ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "approved-premium-photography",
        pipeline: "source-photography-only",
        campaigns: HERO_CAMPAIGN_IDS,
        widths: HERO_WIDTHS,
        height: HERO_HEIGHT,
        formats: ["avif", "webp", "png"],
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(path.join(HERO_ROOT, "blur-placeholders.json"), JSON.stringify(heroBlurs, null, 2), "utf8");

  console.log(
    `\n✓ Production export complete: ${categoryKeys.length} categories + ${HERO_CAMPAIGN_IDS.length} hero campaigns (photography masters only)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
