/**
 * Generates optimized 512×512 WebP category icons from source PNGs.
 * Run: node scripts/generate-home-category-icons.mjs
 */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/categories/home");
const SOURCE_DIR = path.join(ROOT, "source");
const ICONS = [
  "vehicles",
  "property",
  "phones",
  "computers",
  "fashion",
  "electronics",
  "furniture",
  "home-garden",
  "sports",
  "pets",
  "jobs",
  "services",
  "autoparts",
  "wholesale",
  "auctions",
  "more",
];

async function main() {
  await mkdir(ROOT, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR).catch(() => []);
  const pngFiles = files.filter((f) => f.endsWith(".png"));

  for (const icon of ICONS) {
    const sourcePath = path.join(SOURCE_DIR, `${icon}.png`);
    const outputPath = path.join(ROOT, `${icon}.webp`);

    if (!pngFiles.includes(`${icon}.png`)) {
      console.warn(`skip ${icon}: missing ${sourcePath}`);
      continue;
    }

    await sharp(sourcePath)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, effort: 6, alphaQuality: 100 })
      .toFile(outputPath);

    console.log(`✓ ${icon}.webp`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
