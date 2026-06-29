/**
 * Import Icons8 3D Fluency category icons into public/categories (icons only).
 * Run: node scripts/import-icons8-3d-fluency-category-pack.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { composeTransparentMaster } from "./assets/fluency-3d-compose.mjs";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import {
  CATEGORY_ICON_CANDIDATES,
  ICONS8_3D_FLUENCY_COLLECTION,
  icons8FluencyUrl,
} from "./assets/icons8-3d-fluency-category-pack.mjs";

const CATEGORY_ROOT = path.join(process.cwd(), "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const CATEGORY_SIZES = [64, 128, 256, 512, 1024];
const MASTER = 1024;

async function composeMaster(iconBuffer) {
  return composeTransparentMaster(iconBuffer, MASTER, 0.72);
}

async function fetchIconPng(name, size = 512) {
  const response = await fetch(icons8FluencyUrl(name, size), {
    headers: { "User-Agent": "ROVEXO-Category-Asset-Importer/1.0" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${name}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type for ${name}: ${contentType}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function resolveCategoryIcon(key) {
  const candidates = CATEGORY_ICON_CANDIDATES[key];
  if (!candidates?.length) throw new Error(`No icon candidates for ${key}`);

  let lastError;
  for (const name of candidates) {
    try {
      const buffer = await fetchIconPng(name, 512);
      if (buffer.length < 2_000) throw new Error(`undersized (${buffer.length} bytes)`);
      return { name, buffer };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`No Icons8 asset resolved for ${key}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

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
}

async function main() {
  await mkdir(CATEGORY_ROOT, { recursive: true });
  await mkdir(CATEGORY_SOURCE, { recursive: true });

  const resolved = {};
  console.log(`Importing Icons8 3D Fluency category pack (${HOME_CATEGORY_ICON_TYPES.length} icons)…`);

  for (const key of HOME_CATEGORY_ICON_TYPES) {
    const { name, buffer } = await resolveCategoryIcon(key);
    const master = await composeMaster(buffer);
    await exportCategoryIcon(key, master);
    resolved[key] = name;
    console.log(`✓ ${key} ← ${name}`);
  }

  const manifest = {
    version: "icons8-3d-fluency-v1",
    pipeline: ICONS8_3D_FLUENCY_COLLECTION,
    collection: "Icons8 3D Fluency",
    license: "https://icons8.com/license",
    railIcons: [...HOME_CATEGORY_ICON_TYPES],
    resolved,
    sizes: CATEGORY_SIZES,
    formats: ["avif", "webp", "png"],
    master: MASTER,
    importedAt: new Date().toISOString(),
  };

  await writeFile(path.join(CATEGORY_SOURCE, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  await writeFile(path.join(CATEGORY_ROOT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\n✓ Icons8 3D Fluency category pack imported (${Object.keys(resolved).length} icons)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
