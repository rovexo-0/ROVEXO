/**
 * Fails loudly when any homepage premium category asset is missing or undersized.
 * Run: node scripts/verify-category-premium-assets.mjs
 */
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";

const ROOT = path.join(process.cwd(), "public/categories");
const MIN_BYTES = 1024;

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
    for (const ext of ["webp", "avif", "png"]) {
      const assetPath = path.join(ROOT, `${icon}.${ext}`);
      if (!(await fileExists(assetPath))) {
        missing.push(`${icon}.${ext}`);
      } else {
        const { size } = await stat(assetPath);
        if (size < MIN_BYTES) {
          invalid.push(`${icon}.${ext} (${size} bytes)`);
        }
      }
    }
  }

  const manifestPath = path.join(ROOT, "manifest.json");
  if (!(await fileExists(manifestPath))) {
    missing.push("manifest.json");
  } else {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!manifest.formats?.includes("avif")) {
      invalid.push("manifest.json missing avif format");
    }
    const validPipelines = ["source-photography-only", "v16-raster-3d", "v15-raster-montage", "icons8-3d-fluency"];
    if (!validPipelines.includes(manifest.pipeline)) {
      invalid.push(`manifest.json pipeline not recognized: ${manifest.pipeline}`);
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    console.error("\n[ROVEXO] Premium category asset library incomplete.\n");
    if (missing.length > 0) {
      console.error("Missing:");
      for (const item of missing) console.error(`  - public/categories/${item}`);
    }
    if (invalid.length > 0) {
      console.error("Invalid:");
      for (const item of invalid) console.error(`  - ${item}`);
    }
    console.error("\nFix: run node scripts/generate-v16-premium-category-pack.mjs\n");
    process.exit(1);
  }

  console.log(`✓ All ${HOME_CATEGORY_ICON_TYPES.length} premium category assets verified (AVIF/WebP/PNG)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
