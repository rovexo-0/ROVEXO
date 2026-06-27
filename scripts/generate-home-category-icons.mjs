/**
 * Optimizes premium PNG product renders → transparent 1024×1024 WebP for the homepage category rail.
 * Requires source PNGs in public/categories/home/source/{type}.png — no SVG fallback.
 * Run: node scripts/generate-home-category-icons.mjs
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_CATEGORY_ICON_TYPES } from "./data/home-category-icon-types.mjs";

const ROOT = path.join(process.cwd(), "public/categories/home");
const SOURCE_DIR = path.join(ROOT, "source");
const SIZE = 1024;

function isBackdropPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  if (saturation > 0.14) return false;
  if (luminance > 35) return true;
  if (luminance < 24) return true;
  return false;
}

function removeBackground(pixels, width, height, channels) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = [];

  const seed = (x, y) => {
    const pos = y * width + x;
    if (visited[pos]) return;
    const idx = pos * channels;
    const alpha = pixels[idx + 3];
    if (alpha < 16 || isBackdropPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2])) {
      visited[pos] = 1;
      queue.push(pos);
    }
  };

  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (queue.length > 0) {
    const pos = queue.pop();
    const idx = pos * channels;
    pixels[idx + 3] = 0;

    const x = pos % width;
    const y = Math.floor(pos / width);

    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const next = ny * width + nx;
      if (visited[next]) continue;

      const nIdx = next * channels;
      const alpha = pixels[nIdx + 3];
      if (alpha < 16 || isBackdropPixel(pixels[nIdx], pixels[nIdx + 1], pixels[nIdx + 2])) {
        visited[next] = 1;
        queue.push(next);
      }
    }
  }
}

async function processPng(sourcePath, outputPath) {
  const { data, info } = await sharp(sourcePath)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  removeBackground(pixels, info.width, info.height, info.channels);

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .trim()
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 94, effort: 6, alphaQuality: 100 })
    .toFile(outputPath);
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR).catch(() => []);
  const pngFiles = new Set(files.filter((f) => f.endsWith(".png")));

  const missing = HOME_CATEGORY_ICON_TYPES.filter((icon) => !pngFiles.has(`${icon}.png`));
  if (missing.length > 0) {
    console.error("Missing premium PNG sources (place in public/categories/home/source/):");
    for (const icon of missing) console.error(`  - ${icon}.png`);
    process.exit(1);
  }

  for (const icon of HOME_CATEGORY_ICON_TYPES) {
    const sourcePath = path.join(SOURCE_DIR, `${icon}.png`);
    const outputPath = path.join(ROOT, `${icon}.webp`);
    await processPng(sourcePath, outputPath);
    console.log(`✓ ${icon}.webp`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(
      { generated: HOME_CATEGORY_ICON_TYPES.length, icons: HOME_CATEGORY_ICON_TYPES, size: SIZE },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\nOptimized ${HOME_CATEGORY_ICON_TYPES.length} premium renders → public/categories/home/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
