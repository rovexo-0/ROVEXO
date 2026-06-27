/**
 * Fails loudly when any homepage premium category WebP is missing or undersized.
 * Run: node scripts/verify-category-premium-assets.mjs
 */
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";

const ROOT = path.join(process.cwd(), "public/categories/home");
const MIN_BYTES = 2048;
const EXPECTED_SIZE = 1024;

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];
  const invalid = [];

  for (const icon of HOME_CATEGORY_ICON_TYPES) {
    const webpPath = path.join(ROOT, `${icon}.webp`);
    const sourcePath = path.join(ROOT, "source", `${icon}.png`);

    if (!(await fileExists(webpPath))) {
      missing.push(`${icon}.webp`);
      if (!(await fileExists(sourcePath))) {
        missing.push(`source/${icon}.png (source required)`);
      }
      continue;
    }

    const { size } = await stat(webpPath);
    if (size < MIN_BYTES) {
      invalid.push(`${icon}.webp (${size} bytes — likely corrupt or over-compressed)`);
    }
  }

  const manifestPath = path.join(ROOT, "manifest.json");
  if (await fileExists(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.size !== EXPECTED_SIZE) {
      invalid.push(`manifest.json size=${manifest.size}, expected ${EXPECTED_SIZE}`);
    }
  } else {
    missing.push("manifest.json");
  }

  if (missing.length > 0 || invalid.length > 0) {
    console.error("\n[ROVEXO] Premium category asset library incomplete.\n");
    if (missing.length > 0) {
      console.error("Missing:");
      for (const item of missing) console.error(`  - public/categories/home/${item}`);
    }
    if (invalid.length > 0) {
      console.error("Invalid:");
      for (const item of invalid) console.error(`  - ${item}`);
    }
    console.error("\nFix: add PNG sources to public/categories/home/source/ then run:");
    console.error("  node scripts/generate-home-category-icons.mjs\n");
    process.exit(1);
  }

  console.log(`✓ All ${HOME_CATEGORY_ICON_TYPES.length} premium category assets verified (${EXPECTED_SIZE}px WebP)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
