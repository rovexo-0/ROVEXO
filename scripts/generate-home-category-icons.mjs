/**
 * Generates optimized 512×512 transparent WebP category icons from source PNGs.
 * Strips grey/checkerboard backgrounds via corner flood-fill.
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

const SIZE = 512;

function isBackgroundPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  // Neutral greys, whites, and checkerboard backdrop tones.
  return saturation < 0.14 && luminance > 35;
}

function removeBackground(pixels, width, height, channels) {
  const total = width * height;
  const isForeground = new Uint8Array(total);

  for (let pos = 0; pos < total; pos += 1) {
    const idx = pos * channels;
    const alpha = pixels[idx + 3];
    if (alpha < 16) continue;
    if (!isBackgroundPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2])) {
      isForeground[pos] = 1;
    }
  }

  const visited = new Uint8Array(total);
  let bestComponent = null;
  let bestSize = 0;

  for (let pos = 0; pos < total; pos += 1) {
    if (!isForeground[pos] || visited[pos]) continue;

    const queue = [pos];
    const component = [];
    visited[pos] = 1;

    while (queue.length > 0) {
      const current = queue.pop();
      component.push(current);
      const x = current % width;
      const y = Math.floor(current / width);

      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (!isForeground[next] || visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (component.length > bestSize) {
      bestSize = component.length;
      bestComponent = component;
    }
  }

  for (let pos = 0; pos < total; pos += 1) {
  const idx = pos * channels;
    pixels[idx + 3] = 0;
  }

  if (bestComponent) {
    for (const pos of bestComponent) {
      const idx = pos * channels;
      pixels[idx + 3] = 255;
    }
  }
}

async function processIcon(sourcePath, outputPath) {
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
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toFile(outputPath);
}

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

    await processIcon(sourcePath, outputPath);
    console.log(`✓ ${icon}.webp`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
