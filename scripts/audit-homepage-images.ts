import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXTERNAL_PLACEHOLDER_IMAGE_HOSTS,
  isExternalPlaceholderImageUrl,
} from "../lib/media/official-demo-images";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".sql"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "apps/rovexo-staff/node_modules",
  "ROVEXO_UPLOAD",
  "ROVEXO",
  "archive",
]);
const IGNORE_FILES = new Set([
  "lib/media/official-demo-images.ts",
  "scripts/audit-homepage-images.ts",
  "tests/homepage-eligibility.test.ts",
  "lib/super-admin/production-assets/validator.ts",
  "scripts/verify-hero-campaigns.mjs",
]);

async function walk(dir: string, matches: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, matches);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    const relative = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    if (IGNORE_FILES.has(relative)) continue;
    if (relative.includes("official-demo-images.ts")) continue;
    const contents = await readFile(fullPath, "utf8");
    for (const host of EXTERNAL_PLACEHOLDER_IMAGE_HOSTS) {
      if (contents.includes(host)) {
        matches.push(`${relative} → ${host}`);
      }
    }
    const urlMatches = contents.match(/https?:\/\/[^\s"'`]+/g) ?? [];
    for (const url of urlMatches) {
      if (isExternalPlaceholderImageUrl(url)) {
        matches.push(`${relative} → ${url}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const matches: string[] = [];
  await walk(ROOT, matches);
  const unique = [...new Set(matches)].sort();

  console.log("ROVEXO Homepage Image Audit");
  console.log("===========================");
  console.log(`Placeholder providers tracked: ${EXTERNAL_PLACEHOLDER_IMAGE_HOSTS.join(", ")}`);
  console.log(`External placeholder references found: ${unique.length}`);
  if (unique.length) {
    unique.forEach((line) => console.log(`  - ${line}`));
    process.exitCode = 1;
  } else {
    console.log("No external placeholder image providers remain in scanned sources.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
