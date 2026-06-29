/**
 * Export responsive AVIF/WebP/PNG empty-state illustrations.
 * Run: node scripts/generate-empty-state-assets.mjs
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { EMPTY_STATE_IDS } from "./assets/premium-empty-state-manifest.mjs";

const ROOT = path.join(process.cwd(), "public/assets/empty-states");
const SOURCE = path.join(ROOT, "source");
const SIZES = [240, 480, 960];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function exportFormats(pipeline, basePath, suffix = "") {
  const tag = suffix ? `-${suffix}` : "";
  await pipeline.clone().webp({ quality: 92, effort: 6 }).toFile(`${basePath}${tag}.webp`);
  await pipeline.clone().avif({ quality: 58, effort: 6 }).toFile(`${basePath}${tag}.avif`);
  await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${basePath}${tag}.png`);
}

async function main() {
  await mkdir(ROOT, { recursive: true });

  const missing = [];
  for (const id of EMPTY_STATE_IDS) {
    const sourcePath = path.join(SOURCE, `${id}.png`);
    if (!(await exists(sourcePath))) missing.push(sourcePath);
  }

  if (missing.length > 0) {
    console.error("\nMissing empty-state sources. Run: node scripts/import-premium-empty-states.mjs\n");
    for (const item of missing) console.error(`  - ${item}`);
    process.exit(1);
  }

  for (const id of EMPTY_STATE_IDS) {
    const masterBuffer = await readFile(path.join(SOURCE, `${id}.png`));
    for (const size of SIZES) {
      const height = Math.round(size * 0.75);
      const pipeline = sharp(masterBuffer).resize(size, height, { fit: "cover", position: "centre" });
      const base = path.join(ROOT, id);
      if (size === 960) {
        await exportFormats(pipeline, base);
      } else {
        await exportFormats(pipeline, base, size);
      }
    }
    console.log(`✓ empty-state ${id}`);
  }

  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(
      {
        version: "premium-design-system-v1",
        pipeline: "source-photography-only",
        ids: EMPTY_STATE_IDS,
        sizes: SIZES,
        formats: ["avif", "webp", "png"],
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ Empty-state export complete (${EMPTY_STATE_IDS.length} illustrations)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
