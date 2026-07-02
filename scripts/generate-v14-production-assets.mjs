/**
 * ROVEXO v1.4 — Final production asset pipeline (Prompt 014)
 * Run: node scripts/generate-v14-production-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import {
  ALL_CATEGORY_SVGS,
  EXTENDED_CATEGORY_KEYS,
  HERO_CAMPAIGN_IDS,
  HERO_CAMPAIGN_SVGS,
} from "./assets/premium-visual-svgs.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const HERO_ROOT = path.join(process.cwd(), "public/hero");
const HERO_SOURCE = path.join(HERO_ROOT, "source");

const CATEGORY_MASTER = 1024;
const CATEGORY_SIZES = [64, 128, 256, 512, 1024];
const HERO_WIDTHS = [768, 1280, 1920, 3840];
const HERO_HEIGHT = 1080;

async function exportFormats(pipeline, basePath, suffix = "") {
  const tag = suffix ? `-${suffix}` : "";
  await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${basePath}${tag}.webp`);
  await pipeline.clone().avif({ quality: 60, effort: 6 }).toFile(`${basePath}${tag}.avif`);
  await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${basePath}${tag}.png`);
}

async function exportCategoryIcon(icon, svg) {
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(CATEGORY_MASTER, CATEGORY_MASTER, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await writeFile(path.join(CATEGORY_SOURCE, `${icon}.png`), pngBuffer);

  for (const size of CATEGORY_SIZES) {
    const pipeline = sharp(pngBuffer).resize(size, size, {
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

async function exportHeroCampaign(id, svg) {
  const sourceBuffer = await sharp(Buffer.from(svg))
    .resize(1920, HERO_HEIGHT, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  await writeFile(path.join(HERO_SOURCE, `${id}.png`), sourceBuffer);

  for (const width of HERO_WIDTHS) {
    const height = Math.round(HERO_HEIGHT * (width / 1920));
    const pipeline = sharp(sourceBuffer).resize(width, height, { fit: "cover", position: "centre" });
    await exportFormats(pipeline, path.join(HERO_ROOT, id), width);
  }

  const master = sharp(sourceBuffer);
  await exportFormats(master, path.join(HERO_ROOT, id));

  console.log(`✓ hero ${id}`);
}

async function main() {
  await mkdir(CATEGORY_ROOT, { recursive: true });
  await mkdir(CATEGORY_SOURCE, { recursive: true });
  await mkdir(HERO_ROOT, { recursive: true });
  await mkdir(HERO_SOURCE, { recursive: true });

  const railIcons = [...HOME_CATEGORY_ICON_TYPES];
  const allIcons = [...new Set([...railIcons, ...EXTENDED_CATEGORY_KEYS])];

  for (const icon of allIcons) {
    const svg = ALL_CATEGORY_SVGS[icon];
    if (!svg) {
      console.error(`Missing SVG for category: ${icon}`);
      process.exit(1);
    }
    await exportCategoryIcon(icon, svg);
  }

  const heroBlurs = {};
  for (const id of HERO_CAMPAIGN_IDS) {
    await exportHeroCampaign(id, HERO_CAMPAIGN_SVGS[id]);
    const tiny = await sharp(path.join(HERO_SOURCE, `${id}.png`))
      .resize(16, 9, { fit: "cover" })
      .webp({ quality: 15 })
      .toBuffer();
    heroBlurs[id] = `data:image/webp;base64,${tiny.toString("base64")}`;
  }

  await writeFile(
    path.join(CATEGORY_ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "v1.4-production",
        railIcons,
        extendedIcons: EXTENDED_CATEGORY_KEYS,
        sizes: CATEGORY_SIZES,
        formats: ["avif", "webp", "png"],
        master: CATEGORY_MASTER,
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
        version: "v1.4-production",
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

  console.log(`\n✓ Generated ${allIcons.length} category icons + ${HERO_CAMPAIGN_IDS.length} hero campaigns (v1.4 production)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
