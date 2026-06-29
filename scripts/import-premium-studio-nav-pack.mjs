/**
 * Import photorealistic premium studio navigation icons.
 * Run: node scripts/import-premium-studio-nav-pack.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { composePremiumStudioMaster } from "./assets/premium-studio-compose.mjs";
import {
  PREMIUM_STUDIO_NAV_SOURCES,
  PREMIUM_STUDIO_PIPELINE,
} from "./assets/premium-studio-nav-manifest.mjs";

const ROOT = path.join(process.cwd(), "public/icons/premium-studio");
const SIZES = [64, 128, 256, 512];
const MASTER = 512;

async function fetchPhoto(urls) {
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": "ROVEXO-Premium-Studio-Importer/1.0",
        },
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 8_000) throw new Error(`undersized (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function exportIcon(key, masterBuffer) {
  for (const size of SIZES) {
    const pipeline = sharp(masterBuffer).resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const base = path.join(ROOT, key);
    const tag = size === 512 ? "" : `-${size}`;
    await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${base}${tag}.webp`);
    await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(`${base}${tag}.avif`);
    await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${base}${tag}.png`);
  }
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  const keys = Object.keys(PREMIUM_STUDIO_NAV_SOURCES);

  console.log(`Importing premium studio navigation pack (${keys.length} icons)…`);

  for (const key of keys) {
    const meta = PREMIUM_STUDIO_NAV_SOURCES[key];
    const buffer = await fetchPhoto(meta.urls);
    const master = await composePremiumStudioMaster(buffer, MASTER, 0.78);
    await exportIcon(key, master);
    console.log(`✓ ${key}`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "premium-studio-photography-v1",
        pipeline: PREMIUM_STUDIO_PIPELINE,
        collection: "ROVEXO Premium Studio Photography",
        keys,
        sizes: SIZES,
        formats: ["avif", "webp", "png"],
        master: MASTER,
        importedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ Premium studio navigation pack: ${keys.length} icons`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
