/**

 * Fails if hero campaigns are missing or constants still reference Unsplash.

 * Run: node scripts/verify-hero-campaigns.mjs

 */

import { access, readFile, stat } from "node:fs/promises";

import path from "node:path";

import { HERO_PHOTO_SOURCES } from "./assets/premium-photo-manifest.mjs";



const HERO_DIR = path.join(process.cwd(), "public/hero");

const HERO_CAMPAIGN_IDS = Object.keys(HERO_PHOTO_SOURCES);



async function exists(filePath) {

  try {

    await access(filePath);

    return true;

  } catch {

    return false;

  }

}



async function main() {

  const missing = [];

  const invalid = [];



  for (const id of HERO_CAMPAIGN_IDS) {

    for (const ext of ["webp", "avif", "png"]) {

      const assetPath = path.join(HERO_DIR, `${id}.${ext}`);

      if (!(await exists(assetPath))) {

        missing.push(`${id}.${ext}`);

        continue;

      }

      const { size } = await stat(assetPath);

      if (size < 4096) invalid.push(`${id}.${ext} (${size} bytes)`);

    }

  }



  const manifestPath = path.join(HERO_DIR, "manifest.json");

  if (await exists(manifestPath)) {

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    if (manifest.pipeline !== "source-photography-only") {

      invalid.push("public/hero/manifest.json not exported from photography source masters");

    }

  } else {

    missing.push("manifest.json");

  }



  const constants = await readFile(path.join(process.cwd(), "lib/home/constants.ts"), "utf8");

  if (constants.includes("unsplash.com")) {

    invalid.push("lib/home/constants.ts still references unsplash.com");

  }



  const heroImages = await readFile(path.join(process.cwd(), "lib/home/hero-images.ts"), "utf8");

  if (heroImages.includes("unsplash.com")) {

    invalid.push("lib/home/hero-images.ts still references unsplash.com");

  }



  if (missing.length > 0 || invalid.length > 0) {

    console.error("\n[ROVEXO] Hero campaign library incomplete.\n");

    if (missing.length > 0) {

      console.error("Missing:");

      for (const item of missing) console.error(`  - public/hero/${item}`);

    }

    if (invalid.length > 0) {

      console.error("Invalid:");

      for (const item of invalid) console.error(`  - ${item}`);

    }

    console.error("\nRun:\n  node scripts/import-premium-photo-sources.mjs\n  node scripts/generate-production-from-sources.mjs\n");

    process.exit(1);

  }



  console.log(`✓ All ${HERO_CAMPAIGN_IDS.length} local hero campaigns verified (AVIF + WebP + PNG)`);

}



main().catch((error) => {

  console.error(error);

  process.exit(1);

});


