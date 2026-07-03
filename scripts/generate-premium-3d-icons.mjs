/**
 * ROVEXO v1.0 — Premium 3D icon exporter.
 *
 * Reads approved transparent 3D master PNGs and produces the responsive,
 * multi-format variants the app consumes. Each master is alpha-trimmed then
 * re-centred on a square transparent canvas with a fixed margin so every icon
 * carries identical optical weight regardless of the raw render's framing.
 *
 * Category masters:  public/categories/source/{key}.png
 *   -> public/categories/{key}[-{size}].{avif,webp,png}   (64,128,256,512,1024)
 *
 * Nav masters:       public/icons/premium/nav/source/{key}.png
 *   -> public/icons/premium/nav/{key}[-{size}].{webp,png} (64,128,256)
 *
 * Run: node scripts/generate-premium-3d-icons.mjs
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CATEGORY_ROOT = path.join(ROOT, "public/categories");
const CATEGORY_SOURCE = path.join(CATEGORY_ROOT, "source");
const NAV_ROOT = path.join(ROOT, "public/icons/premium/nav");
const NAV_SOURCE = path.join(NAV_ROOT, "source");

const CATEGORY_KEYS = [
  "vehicles", "property", "phones", "computers", "electronics", "gaming",
  "home-garden", "diy", "tools", "womens-fashion", "mens-fashion", "kids-fashion",
  "shoes", "jewellery", "beauty", "health", "pets", "sports", "services", "autoparts",
];
const NAV_KEYS = ["home", "search", "sell", "saved", "account"];

const CATEGORY_SIZES = [64, 128, 256, 512, 1024];
const NAV_SIZES = [64, 128, 256];

// Fraction of the square canvas the trimmed subject should occupy so the
// premium 3D glyph renders at its intended size natively (no CSS scaling).
const CONTENT_RATIO = 0.84;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Per-icon colour treatments (applied to the normalised master before export).
// Keeps the glossy 3D shading intact while shifting the base hue so the assets
// carry the approved navigation colour scheme without borders or plates.
const NAV_RECOLOR = {
  // Glossy red heart. `tint` preserves the 3D luminance/gloss while forcing the
  // chroma, so the result is deterministic regardless of the master's base hue.
  saved: (buffer) => sharp(buffer).tint({ r: 226, g: 34, b: 40 }).png().toBuffer(),
  // Dark gray glossy magnifier — desaturate then darken (hue-independent).
  search: (buffer) => sharp(buffer).modulate({ saturation: 0, brightness: 0.66 }).png().toBuffer(),
};

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Trim transparent margins then re-centre on a padded square transparent canvas. */
async function normaliseToSquareMaster(sourceBuffer) {
  let content = sourceBuffer;
  try {
    content = await sharp(sourceBuffer).trim({ threshold: 12 }).toBuffer();
  } catch {
    // Fully-uniform or untrimmable image — keep the original.
    content = sourceBuffer;
  }

  const meta = await sharp(content).metadata();
  const maxSide = Math.max(meta.width ?? 1, meta.height ?? 1);
  const canvas = Math.round(maxSide / CONTENT_RATIO);

  return sharp({
    create: { width: canvas, height: canvas, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: content, gravity: "center" }])
    .png()
    .toBuffer();
}

async function generate(kind, keys, sourceDir, outDir, sizes, formats, recolorMap = {}) {
  const largest = Math.max(...sizes);
  for (const key of keys) {
    const sourcePath = path.join(sourceDir, `${key}.png`);
    if (!(await exists(sourcePath))) {
      throw new Error(`[ROVEXO] Missing ${kind} master: ${sourcePath}`);
    }
    let master = await normaliseToSquareMaster(await readFile(sourcePath));
    const recolor = recolorMap[key];
    if (recolor) {
      master = await recolor(master);
    }
    for (const size of sizes) {
      const suffix = size === largest ? "" : `-${size}`;
      const pipeline = sharp(master).resize(size, size, { fit: "contain", background: TRANSPARENT });
      const target = path.join(outDir, `${key}${suffix}`);
      if (formats.includes("webp")) {
        await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${target}.webp`);
      }
      if (formats.includes("avif")) {
        await pipeline.clone().avif({ quality: 62, effort: 6 }).toFile(`${target}.avif`);
      }
      if (formats.includes("png")) {
        await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${target}.png`);
      }
    }
    console.log(`\u2713 ${kind} ${key}`);
  }
}

async function main() {
  console.log("Exporting premium 3D category icons\u2026");
  await generate("category", CATEGORY_KEYS, CATEGORY_SOURCE, CATEGORY_ROOT, CATEGORY_SIZES, [
    "avif",
    "webp",
    "png",
  ]);

  console.log("\nExporting premium 3D navigation icons\u2026");
  await generate("nav", NAV_KEYS, NAV_SOURCE, NAV_ROOT, NAV_SIZES, ["webp", "png"], NAV_RECOLOR);

  console.log(
    `\n\u2713 Done: ${CATEGORY_KEYS.length} category icons + ${NAV_KEYS.length} nav icons (avif/webp/png).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
