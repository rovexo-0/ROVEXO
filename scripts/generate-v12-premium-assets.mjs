/**
 * ROVEXO v1.2 — Generate premium category + hero assets from SVG sources.
 * Outputs AVIF, WebP, PNG with responsive widths.
 *
 * Run: node scripts/generate-v12-premium-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import {
  CATEGORY_PREMIUM_SVGS,
  HERO_CAMPAIGN_IDS,
  HERO_CAMPAIGN_SVGS,
} from "./assets/premium-visual-svgs.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const HERO_ROOT = path.join(process.cwd(), "public/hero");
const HERO_SOURCE = path.join(HERO_ROOT, "source");

const CATEGORY_SIZE = 1024;
const CATEGORY_DISPLAY_SIZES = [128, 256, 512, 1024];
const HERO_WIDTHS = [768, 1280, 1920, 3840];
const HERO_HEIGHT = 1080;

async function svgToPng(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function exportCategoryIcon(icon, svg) {
  const pngBuffer = await svgToPng(svg, CATEGORY_SIZE, CATEGORY_SIZE);
  await writeFile(path.join(CATEGORY_SOURCE, `${icon}.png`), pngBuffer);

  for (const size of CATEGORY_DISPLAY_SIZES) {
    const pipeline = sharp(pngBuffer).resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    const suffix = size === 1024 ? "" : `-${size}`;
    await pipeline.clone().webp({ quality: 92, effort: 6, alphaQuality: 100 }).toFile(path.join(CATEGORY_ROOT, `${icon}${suffix}.webp`));
    await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(CATEGORY_ROOT, `${icon}${suffix}.avif`));
    await pipeline.clone().png({ compressionLevel: 9 }).toFile(path.join(CATEGORY_ROOT, `${icon}${suffix}.png`));
  }

  console.log(`✓ category ${icon}`);
}

async function exportHeroCampaign(id, svg) {
  const sourcePath = path.join(HERO_SOURCE, `${id}.png`);
  const sourceBuffer = await sharp(Buffer.from(svg)).resize(1920, HERO_HEIGHT, { fit: "cover" }).png().toBuffer();
  await writeFile(sourcePath, sourceBuffer);

  for (const width of HERO_WIDTHS) {
    const height = Math.round(HERO_HEIGHT * (width / 1920));
    const pipeline = sharp(sourceBuffer).resize(width, height, { fit: "cover", position: "centre" });

    await pipeline.clone().webp({ quality: 88, effort: 6 }).toFile(path.join(HERO_ROOT, `${id}-${width}.webp`));
    await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(HERO_ROOT, `${id}-${width}.avif`));
    await pipeline.clone().png({ compressionLevel: 9 }).toFile(path.join(HERO_ROOT, `${id}-${width}.png`));
  }

  await sharp(sourceBuffer).webp({ quality: 88, effort: 6 }).toFile(path.join(HERO_ROOT, `${id}.webp`));
  await sharp(sourceBuffer).avif({ quality: 58, effort: 6 }).toFile(path.join(HERO_ROOT, `${id}.avif`));
  await sharp(sourceBuffer).png({ compressionLevel: 9 }).toFile(path.join(HERO_ROOT, `${id}.png`));

  console.log(`✓ hero ${id}`);
}

async function main() {
  await mkdir(CATEGORY_ROOT, { recursive: true });
  await mkdir(CATEGORY_SOURCE, { recursive: true });
  await mkdir(HERO_ROOT, { recursive: true });
  await mkdir(HERO_SOURCE, { recursive: true });

  for (const icon of HOME_CATEGORY_ICON_TYPES) {
    const svg = CATEGORY_PREMIUM_SVGS[icon];
    if (!svg) {
      console.error(`Missing SVG template for category: ${icon}`);
      process.exit(1);
    }
    await exportCategoryIcon(icon, svg);
  }

  for (const id of HERO_CAMPAIGN_IDS) {
    await exportHeroCampaign(id, HERO_CAMPAIGN_SVGS[id]);
  }

  await writeFile(
    path.join(CATEGORY_ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "v1.2",
        icons: HOME_CATEGORY_ICON_TYPES,
        sizes: CATEGORY_DISPLAY_SIZES,
        formats: ["avif", "webp", "png"],
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
        version: "v1.2",
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

  console.log(`\nGenerated ${HOME_CATEGORY_ICON_TYPES.length} category icons + ${HERO_CAMPAIGN_IDS.length} hero campaigns`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
