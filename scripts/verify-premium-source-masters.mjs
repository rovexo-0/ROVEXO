/**
 * Validates premium photography source masters before production export.
 * Run: node scripts/verify-premium-source-masters.mjs
 */
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";
import { EXTENDED_CATEGORY_KEYS, HERO_PHOTO_SOURCES } from "./assets/premium-photo-manifest.mjs";

const CATEGORY_SOURCE = path.join(process.cwd(), "public/categories/source");
const HERO_SOURCE = path.join(process.cwd(), "public/hero/source");
const MIN_CATEGORY_SOURCE_BYTES = 12_000;
const MIN_HERO_SOURCE_BYTES = 80_000;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const errors = [];
  const categoryKeys = [...new Set([...HOME_CATEGORY_ICON_TYPES, ...EXTENDED_CATEGORY_KEYS])];

  for (const key of categoryKeys) {
    const filePath = path.join(CATEGORY_SOURCE, `${key}.png`);
    if (!(await exists(filePath))) {
      errors.push(`Missing category source: ${key}.png`);
      continue;
    }
    const { size } = await stat(filePath);
    if (size < MIN_CATEGORY_SOURCE_BYTES) {
      errors.push(`Category source too small (${size} B): ${key}.png`);
    }
  }

  for (const id of Object.keys(HERO_PHOTO_SOURCES)) {
    const filePath = path.join(HERO_SOURCE, `${id}.png`);
    if (!(await exists(filePath))) {
      errors.push(`Missing hero source: ${id}.png`);
      continue;
    }
    const { size } = await stat(filePath);
    if (size < MIN_HERO_SOURCE_BYTES) {
      errors.push(`Hero source too small (${size} B): ${id}.png`);
    }
  }

  for (const manifestPath of [
    path.join(CATEGORY_SOURCE, "manifest.json"),
    path.join(HERO_SOURCE, "manifest.json"),
  ]) {
    if (!(await exists(manifestPath))) {
      errors.push(`Missing ${manifestPath}`);
      continue;
    }
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.pipeline !== "source-photography-only") {
      errors.push(`${manifestPath} must declare pipeline source-photography-only`);
    }
  }

  const publicCategoryManifest = path.join(process.cwd(), "public/categories/manifest.json");
  if (await exists(publicCategoryManifest)) {
    const manifest = JSON.parse(await readFile(publicCategoryManifest, "utf8"));
    if (manifest.pipeline !== "source-photography-only") {
      errors.push("public/categories/manifest.json not exported from photography masters");
    }
  }

  if (errors.length > 0) {
    console.error("\n[ROVEXO] Premium source masters invalid:\n");
    for (const item of errors) console.error(`  - ${item}`);
    console.error("\nRun:\n  node scripts/import-premium-photo-sources.mjs\n  node scripts/generate-production-from-sources.mjs\n");
    process.exit(1);
  }

  console.log(
    `✓ Premium photography sources verified (${categoryKeys.length} categories + ${Object.keys(HERO_PHOTO_SOURCES).length} heroes)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
