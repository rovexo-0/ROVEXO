/**
 * Import Icons8 3D Fluency global icon pack into public/icons/fluency-3d.
 * Run: node scripts/import-fluency-3d-global-pack.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { composeTransparentMaster } from "./assets/fluency-3d-compose.mjs";
import {
  FLUENCY_3D_ICON_CANDIDATES,
  ICONS8_3D_FLUENCY_COLLECTION,
  icons8FluencyUrl,
} from "./assets/fluency-3d-global-registry.mjs";

const ROOT = path.join(process.cwd(), "public/icons/fluency-3d");
const SIZES = [64, 128, 256, 512];
const MASTER = 512;

async function fetchIconPng(name) {
  const response = await fetch(icons8FluencyUrl(name, 512), {
    headers: { "User-Agent": "ROVEXO-Fluency3D-Importer/1.0" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${name}`);
  return Buffer.from(await response.arrayBuffer());
}

async function resolveIcon(key) {
  const candidates = FLUENCY_3D_ICON_CANDIDATES[key];
  if (!candidates?.length) throw new Error(`No candidates for ${key}`);

  let lastError;
  for (const name of candidates) {
    try {
      const buffer = await fetchIconPng(name);
      if (buffer.length < 1_500) throw new Error(`undersized (${buffer.length} bytes)`);
      return { name, buffer };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Unresolved ${key}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function exportIcon(key, masterBuffer) {
  for (const size of SIZES) {
    const pipeline = sharp(masterBuffer).resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const base = path.join(ROOT, key);
    const tag = size === 512 ? "" : `-${size}`;
    await pipeline.clone().webp({ quality: 92, effort: 6, alphaQuality: 100 }).toFile(`${base}${tag}.webp`);
    await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(`${base}${tag}.avif`);
    await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${base}${tag}.png`);
  }
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  const keys = Object.keys(FLUENCY_3D_ICON_CANDIDATES);
  const resolved = {};

  console.log(`Importing Icons8 3D Fluency global pack (${keys.length} icons)…`);

  for (const key of keys) {
    const { name, buffer } = await resolveIcon(key);
    const master = await composeTransparentMaster(buffer, MASTER);
    await exportIcon(key, master);
    resolved[key] = name;
    console.log(`✓ ${key} ← ${name}`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "icons8-3d-fluency-global-v1",
        pipeline: ICONS8_3D_FLUENCY_COLLECTION,
        collection: "Icons8 3D Fluency",
        license: "https://icons8.com/license",
        keys,
        resolved,
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

  console.log(`\n✓ Global Fluency 3D pack: ${keys.length} icons`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
