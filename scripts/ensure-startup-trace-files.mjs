/**
 * Inject startup blood-law filesystem dependencies into serverless NFT traces.
 *
 * Preview 500 root cause: instrumentation readFileSync(source) → ENOENT because
 * turbopackIgnore / tracing excludes omitted those files from `/var/task`.
 *
 * Surgical inject only (list in scripts/startup-trace-files.txt) — avoids the
 * 800MB+ blast radius of broad outputFileTracingIncludes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SERVER_DIR = path.join(ROOT, ".next", "server");
const LIST_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "startup-trace-files.txt",
);

function listNftFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listNftFiles(full, out);
    else if (entry.name.endsWith(".nft.json")) out.push(full);
  }
  return out;
}

function relFromNft(nftFile, absTarget) {
  return path.relative(path.dirname(nftFile), absTarget).split(path.sep).join("/");
}

function main() {
  if (!fs.existsSync(SERVER_DIR)) {
    console.error("[ensure-startup-trace-files] missing .next/server");
    process.exit(1);
  }
  if (!fs.existsSync(LIST_FILE)) {
    console.error("[ensure-startup-trace-files] missing", LIST_FILE);
    process.exit(1);
  }

  const required = fs
    .readFileSync(LIST_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((rel) => ({ rel, abs: path.join(ROOT, rel) }))
    .filter(({ abs, rel }) => {
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        console.warn("[ensure-startup-trace-files] skip missing", rel);
        return false;
      }
      return true;
    });

  // Instrumentation is the boot choke-point that readFileSyncs these paths.
  // Inject only into instrumentation NFT to avoid multiplying ~88MB across
  // every route (still keeps each function under the 250MB limit).
  const instrumentationNft = path.join(SERVER_DIR, "instrumentation.js.nft.json");
  const nfts = fs.existsSync(instrumentationNft)
    ? [instrumentationNft]
    : listNftFiles(SERVER_DIR).filter((f) => path.basename(f) === "instrumentation.js.nft.json");

  if (!nfts.length) {
    console.error("[ensure-startup-trace-files] instrumentation.js.nft.json not found");
    process.exit(1);
  }
  let patched = 0;
  let added = 0;

  for (const nft of nfts) {
    const raw = JSON.parse(fs.readFileSync(nft, "utf8"));
    const files = Array.isArray(raw.files) ? raw.files.slice() : [];
    const set = new Set(files.map((f) => path.resolve(path.dirname(nft), f)));
    let changed = false;

    for (const { abs } of required) {
      if (set.has(abs)) continue;
      files.push(relFromNft(nft, abs));
      set.add(abs);
      changed = true;
      added += 1;
    }

    if (changed) {
      fs.writeFileSync(nft, JSON.stringify({ version: raw.version ?? 1, files }));
      patched += 1;
    }
  }

  console.log(
    `[ensure-startup-trace-files] required=${required.length} patchedNfts=${patched} addedEntries=${added}`,
  );
}

main();
