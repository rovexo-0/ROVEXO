/**
 * Import premium empty-state photography masters.
 * Run: node scripts/import-premium-empty-states.mjs
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  EMPTY_STATE_IDS,
  EMPTY_STATE_PHOTO_SOURCES,
} from "./assets/premium-empty-state-manifest.mjs";

const SOURCE_DIR = path.join(process.cwd(), "public/assets/empty-states/source");
const MASTER_W = 960;
const MASTER_H = 720;
const FORCE = process.env.FORCE === "1";
const MIN_VALID_BYTES = 40_000;

async function shouldSkipSource(outputPath) {
  if (FORCE) return false;
  try {
    const { size } = await stat(outputPath);
    return size >= MIN_VALID_BYTES;
  } catch {
    return false;
  }
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; ROVEXO-Asset-Importer/1.0)",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  await mkdir(SOURCE_DIR, { recursive: true });
  const failures = [];

  for (const id of EMPTY_STATE_IDS) {
    const output = path.join(SOURCE_DIR, `${id}.png`);
    if (await shouldSkipSource(output)) {
      console.log(`↷ skip empty-state ${id}`);
      continue;
    }

    try {
      const meta = EMPTY_STATE_PHOTO_SOURCES[id];
      const buffer = await fetchBuffer(meta.urls[0]);
      const composed = await sharp(buffer)
        .resize(MASTER_W, MASTER_H, { fit: "cover", position: "centre" })
        .modulate({ brightness: 1.03, saturation: 1.05 })
        .png({ compressionLevel: 9 })
        .toBuffer();
      await writeFile(output, composed);
      console.log(`✓ source empty-state ${id}`);
    } catch (error) {
      failures.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`✗ empty-state ${id}`);
    }
  }

  if (failures.length > 0) {
    console.error("\nImport failures:");
    for (const item of failures) console.error(`  - ${item}`);
    process.exit(1);
  }

  await writeFile(
    path.join(SOURCE_DIR, "manifest.json"),
    JSON.stringify(
      {
        version: "premium-design-system-v1",
        pipeline: "source-photography-only",
        importedAt: new Date().toISOString(),
        ids: EMPTY_STATE_IDS,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ Imported ${EMPTY_STATE_IDS.length} empty-state source masters`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
