/**
 * ROVEXO v1.5 — Final premium asset pipeline (Prompt 015)
 * Brand-new raster masters — does NOT use premium-visual-svgs.mjs
 * Run: node scripts/generate-v15-final-premium-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import { renderAllCategoryIcons, V15_EXTENDED_KEYS } from "./assets/v15-category-renders.mjs";
import {
  renderAllHeroCampaigns,
  renderHeroCampaignMaster,
  V15_HERO_CAMPAIGN_IDS,
} from "./assets/v15-hero-renders.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const HERO_ROOT = path.join(process.cwd(), "public/hero");
const HERO_SOURCE = path.join(HERO_ROOT, "source");

const CATEGORY_SIZES = [64, 128, 256, 512, 1024];
const HERO_WIDTHS = [768, 1280, 1920, 3840];
const HERO_HEIGHT = 1080;

async function exportFormats(pipeline, basePath, suffix = "") {
  const tag = suffix ? `-${suffix}` : "";
  await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${basePath}${tag}.webp`);
  await pipeline.clone().avif({ quality: 60, effort: 6 }).toFile(`${basePath}${tag}.avif`);
  await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${basePath}${tag}.png`);
}

async function exportCategoryIcon(icon, masterBuffer) {
  await writeFile(path.join(CATEGORY_SOURCE, `${icon}.png`), masterBuffer);

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
  const sourceBuffer = await renderHeroCampaignMaster(masterBuffer);
  await writeFile(path.join(HERO_SOURCE, `${id}.png`), sourceBuffer);

  for (const width of HERO_WIDTHS) {
    const height = Math.round(HERO_HEIGHT * (width / 1920));
    const pipeline = sharp(sourceBuffer).resize(width, height, { fit: "cover", position: "centre" });
    await exportFormats(pipeline, path.join(HERO_ROOT, id), width);
  }

  await exportFormats(sharp(sourceBuffer), path.join(HERO_ROOT, id));
  console.log(`✓ hero ${id}`);
}

async function main() {
  await mkdir(CATEGORY_ROOT, { recursive: true });
  await mkdir(CATEGORY_SOURCE, { recursive: true });
  await mkdir(HERO_ROOT, { recursive: true });
  await mkdir(HERO_SOURCE, { recursive: true });

  const railIcons = [...HOME_CATEGORY_ICON_TYPES];
  const allIcons = [...new Set([...railIcons, ...V15_EXTENDED_KEYS])];

  console.log("Generating v1.5 premium category icons (new raster masters)…");
  const categoryBuffers = await renderAllCategoryIcons(allIcons);

  for (const icon of allIcons) {
    const buffer = categoryBuffers.get(icon);
    if (!buffer) {
      console.error(`Missing rendered category: ${icon}`);
      process.exit(1);
    }
    await exportCategoryIcon(icon, buffer);
  }

  console.log("\nGenerating v1.5 premium hero campaigns (product montages)…");
  const heroBuffers = await renderAllHeroCampaigns(categoryBuffers);

  const heroBlurs = {};
  for (const id of V15_HERO_CAMPAIGN_IDS) {
    const buffer = heroBuffers.get(id);
    if (!buffer) {
      console.error(`Missing rendered hero: ${id}`);
      process.exit(1);
    }
    await exportHeroCampaign(id, buffer);
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
        version: "v1.5-final-premium",
        pipeline: "v15-raster-montage",
        railIcons,
        extendedIcons: V15_EXTENDED_KEYS,
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
        version: "v1.5-final-premium",
        pipeline: "v15-raster-montage",
        campaigns: V15_HERO_CAMPAIGN_IDS,
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
    `\n✓ v1.5 final premium: ${allIcons.length} category icons + ${V15_HERO_CAMPAIGN_IDS.length} hero campaigns`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
