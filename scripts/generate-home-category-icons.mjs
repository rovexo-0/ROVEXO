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
const COLOR_TOLERANCE = 34;
const MAX_FLOOD_ALPHA = 252;

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2));
}

function removeBackground(pixels, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const seed = (x, y) => {
    const idx = (y * width + x) * channels;
    queue.push(idx);
    visited[y * width + x] = 1;
  };

  seed(0, 0);
  seed(width - 1, 0);
  seed(0, height - 1);
  seed(width - 1, height - 1);

  while (queue.length > 0) {
    const idx = queue.pop();
    const x = (idx / channels) % width;
    const y = Math.floor(idx / channels / width);
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    pixels[idx + 3] = 0;

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nPos = ny * width + nx;
      if (visited[nPos]) continue;

      const nIdx = nPos * channels;
      const nr = pixels[nIdx];
      const ng = pixels[nIdx + 1];
      const nb = pixels[nIdx + 2];
      const na = pixels[nIdx + 3];

      if (na > MAX_FLOOD_ALPHA) continue;

      if (colorDistance(r, g, b, nr, ng, nb) <= COLOR_TOLERANCE) {
        visited[nPos] = 1;
        queue.push(nIdx);
      }
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
