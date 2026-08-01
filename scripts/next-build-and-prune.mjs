/**
 * Production build entry: next build then prune serverless NFT traces
 * before the process exits (so Vercel packages the pruned output only).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");

const fingerprint = spawnSync("npx", ["tsx", "scripts/assert-catalog-runtime-fingerprint.ts"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

if (fingerprint.status !== 0) {
  process.exit(fingerprint.status ?? 1);
}

const build = spawnSync("npx", ["next", "build"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const prune = spawnSync(process.execPath, [path.join(root, "prune-serverless-traces.mjs")], {
  cwd: path.join(root, ".."),
  stdio: "inherit",
  env: process.env,
});

if (prune.status !== 0) {
  process.exit(prune.status ?? 1);
}

const ensure = spawnSync(
  process.execPath,
  [path.join(root, "ensure-startup-trace-files.mjs")],
  {
    cwd: path.join(root, ".."),
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(ensure.status ?? 1);
