/**
 * Optimizes premium PNG product renders → AVIF + WebP + PNG for homepage category rail.
 * Prefer: node scripts/generate-v12-premium-assets.mjs (full v1.2 pipeline)
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";

const ROOT = path.join(process.cwd(), "public/categories");
const SOURCE_DIR = path.join(ROOT, "source");

async function main() {
  await mkdir(ROOT, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  console.log("Use node scripts/generate-v12-premium-assets.mjs to generate category icons.");
  console.log(`Expected icons: ${HOME_CATEGORY_ICON_TYPES.join(", ")}`);
}

main();
