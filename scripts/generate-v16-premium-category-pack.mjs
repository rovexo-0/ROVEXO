/**
 * ROVEXO v1.6 — Import brand-new Premium 3D category icon pack.
 * Replaces ALL homepage category raster assets (source + responsive variants).
 *
 * Run: node scripts/generate-v16-premium-category-pack.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import { renderAllCategoryIcons } from "./assets/v16-category-renders.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const CATEGORY_SIZES = [64, 128, 256, 512, 1024];

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

async function main() {
  await mkdir(CATEGORY_ROOT, { recursive: true });
  await mkdir(CATEGORY_SOURCE, { recursive: true });

  const icons = [...HOME_CATEGORY_ICON_TYPES];
  console.log(`Generating v1.6 Premium 3D category pack (${icons.length} icons)…`);

  const buffers = await renderAllCategoryIcons(icons);

  for (const icon of icons) {
    const buffer = buffers.get(icon);
    if (!buffer) {
      console.error(`Missing rendered category: ${icon}`);
      process.exit(1);
    }
    await exportCategoryIcon(icon, buffer);
  }

  await writeFile(
    path.join(CATEGORY_SOURCE, "manifest.json"),
    JSON.stringify(
      {
        version: "v16-premium-3d-pack",
        pipeline: "v16-raster-3d",
        importedAt: new Date().toISOString(),
        keys: icons,
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    path.join(CATEGORY_ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "v16-premium-3d-pack",
        pipeline: "v16-raster-3d",
        railIcons: icons,
        extendedIcons: [],
        sizes: CATEGORY_SIZES,
        formats: ["avif", "webp", "png"],
        master: 1024,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ v1.6 Premium 3D category pack: ${icons.length} icons @ 1024px master`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
